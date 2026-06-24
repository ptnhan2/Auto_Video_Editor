/**
 * Unit tests cho POST /api/opencut/review route handler.
 *
 * Mock node:fs/promises (readFile) và opencut-bridge (importProject)
 * để test độc lập toàn bộ flow approve/reject proposed edits.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock fs/promises ──────────────────────────────────────────────

const mockReadFile = vi.fn();
vi.mock('node:fs/promises', () => ({
  readFile: mockReadFile,
}));

// ── Mock bridge ────────────────────────────────────────────────────

const mockImportProject = vi.fn();
vi.mock('@/shared/api-clients/opencut-bridge', () => ({
  importProject: mockImportProject,
}));

let routeModule: {
  POST: (req: Request) => Promise<Response>;
};

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  routeModule = await import('@/app/api/opencut/review/route');
});

// ── Helpers ───────────────────────────────────────────────────────

function createPostRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/opencut/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Sample project JSON đơn giản để test approve path
const simpleProject = {
  metadata: { id: 'proj-test', name: 'Ep 1', duration: 60,
    createdAt: '2026-06-24T12:00:00.000Z', updatedAt: '2026-06-24T12:00:00.000Z' },
  scenes: [{
    id: 'scene-1', name: 'Scene 1', isMain: true,
    tracks: [
      {
        id: 'track-v1', name: 'Main Track', type: 'video',
        elements: [
          { id: 'elem-1', type: 'text', name: 'Title', text: 'Hello',
            duration: 5, startTime: 0, transform: { scale: 1, position: { x: 0, y: 0 }, rotate: 0 },
            opacity: 1 },
        ],
        muted: false, volume: 1,
      },
    ],
    bookmarks: [], markers: [],
    createdAt: '2026-06-24T12:00:00.000Z', updatedAt: '2026-06-24T12:00:00.000Z',
  }],
  currentSceneId: 'scene-1',
  settings: { fps: 30, canvasSize: { width: 1920, height: 1080 },
    background: { type: 'color', color: '#000000' } },
  version: 10,
};

// Sample edits
const sampleEdits = [
  {
    id: 'e1',
    type: 'change' as const,
    elementType: 'text',
    description: 'Đổi tiêu đề thành "World"',
    sceneId: 'scene-1',
    trackId: 'track-v1',
    after: { id: 'elem-1', text: 'World' },
  },
  {
    id: 'e2',
    type: 'add' as const,
    elementType: 'effect',
    description: 'Thêm hiệu ứng vignette',
    sceneId: 'scene-1',
    trackId: 'track-v1',
    after: { id: 'elem-new', type: 'effect', name: 'Vignette', duration: 5, startTime: 0 },
  },
];

// ── Validation error tests ─────────────────────────────────────────

describe('POST /api/opencut/review — validation errors', () => {
  it('trả về 400 khi thiếu episodeId', async () => {
    const req = createPostRequest({ decision: 'approve' });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('episodeId');
  });

  it('trả về 400 khi body không phải JSON hợp lệ', async () => {
    const req = new Request('http://localhost/api/opencut/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Invalid JSON');
  });

  it('trả về 400 khi decision không hợp lệ', async () => {
    const req = createPostRequest({ episodeId: 'ep-001', decision: 'maybe' });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('decision');
  });

  it('trả về 400 khi thiếu decision', async () => {
    const req = createPostRequest({ episodeId: 'ep-001' });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('decision');
  });

  it('trả về 400 khi episodeId là string rỗng', async () => {
    const req = createPostRequest({ episodeId: '', decision: 'approve' });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('episodeId');
  });
});

// ── Reject path tests ──────────────────────────────────────────────

describe('POST /api/opencut/review — reject path', () => {
  it('trả về 200 khi reject, không cần đọc file project', async () => {
    const req = createPostRequest({
      episodeId: 'ep-001',
      decision: 'reject',
      edits: sampleEdits,
    });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.decision).toBe('reject');
    expect(body.applied).toBe(0);
    expect(body.rejected).toBe(2);
    // Không đọc file khi reject
    expect(mockReadFile).not.toHaveBeenCalled();
    expect(mockImportProject).not.toHaveBeenCalled();
  });

  it('trả về 200 khi reject không có edits', async () => {
    const req = createPostRequest({
      episodeId: 'ep-001',
      decision: 'reject',
    });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.decision).toBe('reject');
    expect(body.rejected).toBe(0);
  });
});

// ── Approve path tests — success ───────────────────────────────────

describe('POST /api/opencut/review — approve path success', () => {
  it('đọc project JSON, áp dụng edits, gọi importProject', async () => {
    mockReadFile.mockResolvedValueOnce(JSON.stringify(simpleProject));
    mockImportProject.mockResolvedValueOnce({ success: true, projectId: 'proj-test' });

    const req = createPostRequest({
      episodeId: 'ep-001',
      decision: 'approve',
      edits: sampleEdits,
    });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.decision).toBe('approve');
    expect(body.applied).toBeGreaterThanOrEqual(1);
    expect(body.rejected).toBe(0);

    // Xác nhận đã đọc file project
    expect(mockReadFile).toHaveBeenCalledWith(
      expect.stringMatching(/opencut_ep-001\.json$/),
      'utf-8',
    );
    // Xác nhận đã gọi importProject với project đã được chỉnh sửa
    expect(mockImportProject).toHaveBeenCalledOnce();
    const importedProject = mockImportProject.mock.calls[0][0];
    expect(importedProject.scenes).toBeDefined();
  });

  it('áp dụng change edit — sửa element text', async () => {
    mockReadFile.mockResolvedValueOnce(JSON.stringify(simpleProject));
    mockImportProject.mockResolvedValueOnce({ success: true, projectId: 'proj-test' });

    const changeOnlyEdit = [sampleEdits[0]]; // only the change edit
    const req = createPostRequest({
      episodeId: 'ep-001',
      decision: 'approve',
      edits: changeOnlyEdit,
    });
    await routeModule.POST(req);

    // Verify imported project has the changed text
    const importedProject = mockImportProject.mock.calls[0][0];
    const scene = (importedProject.scenes as Record<string, unknown>[])[0];
    const tracks = (scene as Record<string, unknown>).tracks as Record<string, unknown>[];
    const elements = tracks[0].elements as Record<string, unknown>[];
    const changedElement = elements.find((el) => el.id === 'elem-1');
    expect(changedElement).toBeDefined();
    expect((changedElement as Record<string, unknown>).text).toBe('World');
  });

  it('áp dụng add edit — thêm element mới vào track', async () => {
    mockReadFile.mockResolvedValueOnce(JSON.stringify(simpleProject));
    mockImportProject.mockResolvedValueOnce({ success: true, projectId: 'proj-test' });

    const addOnlyEdit = [sampleEdits[1]]; // only the add edit
    const req = createPostRequest({
      episodeId: 'ep-001',
      decision: 'approve',
      edits: addOnlyEdit,
    });
    await routeModule.POST(req);

    const importedProject = mockImportProject.mock.calls[0][0];
    const scene = (importedProject.scenes as Record<string, unknown>[])[0];
    const tracks = (scene as Record<string, unknown>).tracks as Record<string, unknown>[];
    const elements = tracks[0].elements as Record<string, unknown>[];
    const newElement = elements.find((el) => el.id === 'elem-new');
    expect(newElement).toBeDefined();
    expect((newElement as Record<string, unknown>).name).toBe('Vignette');
  });
});

// ── Approve path tests — errors ────────────────────────────────────

describe('POST /api/opencut/review — approve path errors', () => {
  it('trả về 404 khi file project không tồn tại', async () => {
    mockReadFile.mockRejectedValueOnce(
      Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' }),
    );

    const req = createPostRequest({
      episodeId: 'nonexistent',
      decision: 'approve',
      edits: sampleEdits,
    });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toContain('not found');
    expect(body.episodeId).toBe('nonexistent');
  });

  it('trả về 503 khi OpenCut không chạy', async () => {
    mockReadFile.mockResolvedValueOnce(JSON.stringify(simpleProject));
    mockImportProject.mockRejectedValueOnce(new Error('OpenCut not running'));

    const req = createPostRequest({
      episodeId: 'ep-001',
      decision: 'approve',
      edits: sampleEdits,
    });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toContain('OpenCut not running');
  });

  it('trả về 502 khi OpenCut API trả lỗi', async () => {
    mockReadFile.mockResolvedValueOnce(JSON.stringify(simpleProject));
    mockImportProject.mockRejectedValueOnce(new Error('OpenCut API error: 500'));

    const req = createPostRequest({
      episodeId: 'ep-001',
      decision: 'approve',
      edits: sampleEdits,
    });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toContain('Import failed');
  });
});
