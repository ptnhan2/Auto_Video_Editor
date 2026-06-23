/**
 * Unit tests cho POST /api/opencut/import route handler.
 *
 * Mock node:fs/promises (readFile) và opencut-bridge (importProject, importAsset)
 * để test độc lập toàn bộ flow import project từ pipeline output.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock fs/promises ──────────────────────────────────────────────

const mockReadFile = vi.fn();
vi.mock('node:fs/promises', () => ({
  readFile: mockReadFile,
}));

// ── Mock bridge ────────────────────────────────────────────────────

const mockImportProject = vi.fn();
const mockImportAsset = vi.fn();
vi.mock('@/shared/api-clients/opencut-bridge', () => ({
  importProject: mockImportProject,
  importAsset: mockImportAsset,
}));

let routeModule: {
  POST: (req: Request) => Promise<Response>;
};

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  routeModule = await import('@/app/api/opencut/import/route');
});

// ── Helpers ───────────────────────────────────────────────────────

function createPostRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/opencut/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Sample project JSON đơn giản (không có media)
const simpleProject = {
  metadata: { id: 'proj-simple', name: 'Ep 1', duration: 60,
    createdAt: '2026-06-23T12:00:00.000Z', updatedAt: '2026-06-23T12:00:00.000Z' },
  scenes: [{ id: 'scene-1', name: 'Scene 1', isMain: true, tracks: [],
    bookmarks: [], markers: [],
    createdAt: '2026-06-23T12:00:00.000Z', updatedAt: '2026-06-23T12:00:00.000Z' }],
  currentSceneId: 'scene-1',
  settings: { fps: 30, canvasSize: { width: 1920, height: 1080 },
    background: { type: 'color', color: '#000000' } },
  version: 10,
};

// Sample project JSON có media references (để test asset import)
const projectWithMedia = {
  metadata: { id: 'proj-media', name: 'Ep 2', duration: 120,
    createdAt: '2026-06-23T12:00:00.000Z', updatedAt: '2026-06-23T12:00:00.000Z' },
  scenes: [{
    id: 'scene-1', name: 'Scene 1', isMain: true,
    tracks: [
      {
        id: 'track-v1', name: 'Main Track', color: 'default', type: 'video',
        elements: [
          { id: 'elem-1', type: 'video', mediaId: 'media-video-shot1', name: 'Shot 1',
            duration: 10, startTime: 0, trimStart: 0, trimEnd: 0,
            transform: { scale: 1, position: { x: 0, y: 0 }, rotate: 0 },
            opacity: 1, muted: false },
        ],
        isMain: true, muted: false, hidden: false, volume: 1,
      },
      {
        id: 'track-a1', name: 'Dialogue', color: 'green', type: 'audio',
        elements: [
          { id: 'elem-audio', type: 'audio', mediaId: 'media-tts-voice1', name: 'Voice',
            duration: 5, startTime: 0, trimStart: 0, trimEnd: 0,
            sourceType: 'upload', volume: 1, muted: false, playbackRate: 1 },
        ],
        muted: false, volume: 1, pan: 0,
      },
      {
        id: 'track-a2', name: 'BGM', color: 'blue', type: 'audio',
        elements: [
          { id: 'elem-bgm', type: 'audio', mediaId: 'media-bgm-theme1', name: 'Theme',
            duration: 120, startTime: 0, trimStart: 0, trimEnd: 0,
            sourceType: 'upload', volume: 0.3, muted: false, playbackRate: 1 },
        ],
        muted: false, volume: 1, pan: 0,
      },
    ],
    bookmarks: [], markers: [],
    createdAt: '2026-06-23T12:00:00.000Z', updatedAt: '2026-06-23T12:00:00.000Z',
  }],
  currentSceneId: 'scene-1',
  settings: { fps: 30, canvasSize: { width: 1920, height: 1080 },
    background: { type: 'color', color: '#000000' } },
  version: 10,
};

// ── Basic error cases ─────────────────────────────────────────────

describe('POST /api/opencut/import — validation errors', () => {
  it('returns 400 when episodeId is missing', async () => {
    const req = createPostRequest({});
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('episodeId');
  });

  it('returns 400 when body is not valid JSON', async () => {
    const req = new Request('http://localhost/api/opencut/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Invalid JSON');
  });

  it('returns 400 when episodeId is empty string', async () => {
    const req = createPostRequest({ episodeId: '' });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('episodeId');
  });

  it('returns 404 when project file does not exist', async () => {
    mockReadFile.mockRejectedValueOnce(
      Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' }),
    );

    const req = createPostRequest({ episodeId: 'nonexistent' });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toContain('not found');
    expect(body.episodeId).toBe('nonexistent');
  });

  it('returns 400 when JSON is malformed', async () => {
    mockReadFile.mockResolvedValueOnce('not valid json {{{');

    const req = createPostRequest({ episodeId: 'ep-bad' });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Invalid project JSON');
  });
});

// ── OpenCut communication errors ──────────────────────────────────

describe('POST /api/opencut/import — OpenCut errors', () => {
  it('returns 503 when OpenCut bridge throws connection error', async () => {
    mockReadFile.mockResolvedValueOnce(JSON.stringify(simpleProject));
    mockImportProject.mockRejectedValueOnce(new Error('OpenCut not running'));

    const req = createPostRequest({ episodeId: 'ep-001' });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toContain('OpenCut not running');
  });

  it('returns 502 when OpenCut API returns error', async () => {
    mockReadFile.mockResolvedValueOnce(JSON.stringify(simpleProject));
    mockImportProject.mockRejectedValueOnce(new Error('OpenCut API error: 500'));

    const req = createPostRequest({ episodeId: 'ep-001' });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toContain('OpenCut import failed');
  });
});

// ── Success path ──────────────────────────────────────────────────

describe('POST /api/opencut/import — success', () => {
  it('reads project JSON, calls importProject, returns projectId', async () => {
    mockReadFile.mockResolvedValueOnce(JSON.stringify(simpleProject));
    mockImportProject.mockResolvedValueOnce({ success: true, projectId: 'proj-simple' });

    const req = createPostRequest({ episodeId: 'ep-001' });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, projectId: 'proj-simple' });
    // Cross-platform: Windows dùng `\`, Unix dùng `/`
    expect(mockReadFile).toHaveBeenCalledWith(
      expect.stringMatching(/opencut_ep-001\.json$/),
      'utf-8',
    );
    expect(mockImportProject).toHaveBeenCalledWith(simpleProject);
  });

  it('extracts mediaIds from project JSON and calls importAsset for each', async () => {
    mockReadFile.mockResolvedValueOnce(JSON.stringify(projectWithMedia));
    mockImportAsset.mockResolvedValue({ success: true, mediaId: 'x' });
    mockImportProject.mockResolvedValueOnce({ success: true, projectId: 'proj-media' });

    const req = createPostRequest({ episodeId: 'ep-002' });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, projectId: 'proj-media' });

    // Verify importAsset was called for each unique mediaId (3 unique)
    const expectedMediaIds = ['media-video-shot1', 'media-tts-voice1', 'media-bgm-theme1'];
    expect(mockImportAsset).toHaveBeenCalledTimes(expectedMediaIds.length);

    for (const mediaId of expectedMediaIds) {
      expect(mockImportAsset).toHaveBeenCalledWith(
        'proj-media',
        mediaId,
        expect.any(Uint8Array),
      );
    }
  });

  it('succeeds even when some assets fail to upload (graceful degradation)', async () => {
    mockReadFile.mockResolvedValueOnce(JSON.stringify(projectWithMedia));
    // First asset fails, others succeed
    mockImportAsset
      .mockRejectedValueOnce(new Error('OpenCut not running'))
      .mockResolvedValueOnce({ success: true, mediaId: 'media-tts-voice1' })
      .mockResolvedValueOnce({ success: true, mediaId: 'media-bgm-theme1' });
    mockImportProject.mockResolvedValueOnce({ success: true, projectId: 'proj-media' });

    const req = createPostRequest({ episodeId: 'ep-002' });
    const response = await routeModule.POST(req);
    const body = await response.json();

    // Project import still succeeds despite asset failure
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.projectId).toBe('proj-media');

    // All 3 assets were attempted
    expect(mockImportAsset).toHaveBeenCalledTimes(3);
    // Project still imported
    expect(mockImportProject).toHaveBeenCalled();
  });
});
