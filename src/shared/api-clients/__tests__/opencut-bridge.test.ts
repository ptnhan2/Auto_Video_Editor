/**
 * Unit tests cho OpenCut bridge client.
 *
 * Mock global fetch để test HTTP calls mà không cần OpenCut-AI chạy thật.
 * Kiểm tra: POST request structure, success/error response parsing,
 * timeout handling, connection refused fallback.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock global fetch ──────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

let bridge: typeof import('@/shared/api-clients/opencut-bridge');

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockFetch.mockReset();
  bridge = await import('@/shared/api-clients/opencut-bridge');
});

// ── Sample project JSON ────────────────────────────────────────────

const sampleProject = {
  metadata: { id: 'proj-001', name: 'Test Project', duration: 60,
    createdAt: '2026-06-23T12:00:00.000Z', updatedAt: '2026-06-23T12:00:00.000Z' },
  scenes: [{ id: 'scene-1', name: 'Scene 1', isMain: true, tracks: [],
    bookmarks: [], markers: [],
    createdAt: '2026-06-23T12:00:00.000Z', updatedAt: '2026-06-23T12:00:00.000Z' }],
  currentSceneId: 'scene-1',
  settings: { fps: 30, canvasSize: { width: 1920, height: 1080 },
    background: { type: 'color', color: '#000000' } },
  version: 10,
};

// ── importProject tests ────────────────────────────────────────────

describe('importProject', () => {
  it('POSTs project JSON to OpenCut API and returns projectId on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, projectId: 'proj-001' }),
    });

    const result = await bridge.importProject(sampleProject);

    expect(result).toEqual({ success: true, projectId: 'proj-001' });
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/projects/import',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: sampleProject }),
      }),
    );
  });

  it('throws when OpenCut returns non-OK HTTP status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(bridge.importProject(sampleProject)).rejects
      .toThrow('OpenCut API error: 500 Internal Server Error');
  });

  it('throws "OpenCut not running" on connection refused', async () => {
    mockFetch.mockRejectedValueOnce(
      new TypeError('fetch failed', { cause: new Error('ECONNREFUSED') }),
    );

    await expect(bridge.importProject(sampleProject)).rejects
      .toThrow('OpenCut not running');
  });

  it('throws "request timed out" on abort timeout', async () => {
    mockFetch.mockRejectedValueOnce(
      Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }),
    );

    await expect(bridge.importProject(sampleProject)).rejects
      .toThrow('OpenCut request timed out');
  });
});

// ── importAsset tests ──────────────────────────────────────────────

describe('importAsset', () => {
  const testBuffer = new Uint8Array([0x89, 0x50, 0x4E, 0x47]); // PNG header bytes

  it('POSTs media file as FormData to OpenCut API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, mediaId: 'media-001' }),
    });

    const result = await bridge.importAsset('proj-001', 'media-video-shot1', testBuffer);

    expect(result).toEqual({ success: true, mediaId: 'media-001' });
    expect(mockFetch).toHaveBeenCalledOnce();

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3001/api/media/import');
    expect(options.method).toBe('POST');
    expect(options.body).toBeInstanceOf(FormData);

    // Verify FormData contains expected fields
    const formData = options.body as FormData;
    expect(formData.get('projectId')).toBe('proj-001');
    expect(formData.get('mediaId')).toBe('media-video-shot1');
    const file = formData.get('file') as File;
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('media-video-shot1');
    expect(file.size).toBe(testBuffer.length);
  });

  it('throws "OpenCut not running" on network error', async () => {
    mockFetch.mockRejectedValueOnce(
      new TypeError('fetch failed'),
    );

    await expect(
      bridge.importAsset('proj-001', 'media-001', testBuffer),
    ).rejects.toThrow('OpenCut not running');
  });

  it('throws API error on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(
      bridge.importAsset('proj-001', 'media-001', testBuffer),
    ).rejects.toThrow('OpenCut API error: 404 Not Found');
  });
});
