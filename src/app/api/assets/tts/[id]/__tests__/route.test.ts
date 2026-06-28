/**
 * Unit tests for GET /api/assets/tts/[id] route.
 *
 * Mocks node:fs to simulate TTS audio files on disk. Follows the pattern from
 * src/app/api/assets/__tests__/route.test.ts: shared `mock`-prefixed mock fns
 * (hoisted so vi.mock factory can reference them), dynamic route import in
 * beforeEach, Web API Request objects.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════
// Mock node:fs — `mock`-prefixed names are hoisted & factory-accessible
// ═══════════════════════════════════════════════════════════════════

const FAKE_BUFFER = Buffer.from('fake-mp3-audio-content');

const mockExistsSync = vi.fn();
const mockStatSync = vi.fn();
const mockReadFileSync = vi.fn();

vi.mock('node:fs', () => ({
	existsSync: mockExistsSync,
	statSync: mockStatSync,
	readFileSync: mockReadFileSync,
}));

// ═══════════════════════════════════════════════════════════════════
// Dynamic route import
// ═══════════════════════════════════════════════════════════════════

type RouteCtx = { params: Promise<{ id: string }> };

let routeModule: {
	GET: (req: Request, ctx: RouteCtx) => Promise<Response>;
};

beforeEach(async () => {
	vi.clearAllMocks();
	// Sensible defaults: file exists with FAKE_BUFFER contents.
	mockExistsSync.mockReturnValue(true);
	mockStatSync.mockReturnValue({ size: FAKE_BUFFER.length });
	mockReadFileSync.mockReturnValue(FAKE_BUFFER);
	routeModule = await import('@/app/api/assets/tts/[id]/route');
});

// ── Helpers ───────────────────────────────────────────────────────

function createRequest(id: string, headers: Record<string, string> = {}): Request {
	return new Request(`http://localhost/api/assets/tts/${encodeURIComponent(id)}`, {
		headers,
	});
}

function ctx(id: string): RouteCtx {
	return { params: Promise.resolve({ id }) };
}

// ── GET /api/assets/tts/[id] ──────────────────────────────────────

describe('GET /api/assets/tts/[id]', () => {
	it('returns 200 with audio/mpeg + Accept-Ranges for a valid id', async () => {
		const res = await routeModule.GET(createRequest('aud_sb019e2499'), ctx('aud_sb019e2499'));

		expect(res.status).toBe(200);
		expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
		expect(res.headers.get('Accept-Ranges')).toBe('bytes');
		expect(res.headers.get('Content-Length')).toBe(String(FAKE_BUFFER.length));
		expect(Buffer.from(await res.arrayBuffer())).toEqual(FAKE_BUFFER);
	});

	it('returns 404 when the TTS file does not exist on disk', async () => {
		mockExistsSync.mockReturnValue(false);

		const res = await routeModule.GET(createRequest('aud_missing'), ctx('aud_missing'));
		const body = await res.json();

		expect(res.status).toBe(404);
		expect(body).toHaveProperty('error');
		expect(mockReadFileSync).not.toHaveBeenCalled();
	});

	it('rejects path-traversal id (..) with 400 before touching the filesystem', async () => {
		const res = await routeModule.GET(createRequest('../secret'), ctx('../secret'));
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body).toHaveProperty('error');
		expect(mockExistsSync).not.toHaveBeenCalled();
		expect(mockReadFileSync).not.toHaveBeenCalled();
	});

	it('rejects id containing a slash with 400', async () => {
		const res = await routeModule.GET(createRequest('a/b'), ctx('a/b'));

		expect(res.status).toBe(400);
		expect(mockExistsSync).not.toHaveBeenCalled();
	});

	it('returns 206 with Content-Range for a Range request', async () => {
		// bytes=0-3 → first 4 bytes
		const res = await routeModule.GET(
			createRequest('aud_sb019e2499', { Range: 'bytes=0-3' }),
			ctx('aud_sb019e2499'),
		);

		expect(res.status).toBe(206);
		expect(res.headers.get('Content-Range')).toBe(
			`bytes 0-3/${FAKE_BUFFER.length}`,
		);
		expect(res.headers.get('Content-Length')).toBe('4');
		expect(Buffer.from(await res.arrayBuffer())).toEqual(FAKE_BUFFER.subarray(0, 4));
	});

	it('returns 206 for an open-ended Range (bytes=4-)', async () => {
		const res = await routeModule.GET(
			createRequest('aud_sb019e2499', { Range: 'bytes=4-' }),
			ctx('aud_sb019e2499'),
		);

		expect(res.status).toBe(206);
		expect(res.headers.get('Content-Range')).toBe(
			`bytes 4-${FAKE_BUFFER.length - 1}/${FAKE_BUFFER.length}`,
		);
	});

	it('returns 500 with generic message on an unexpected read error', async () => {
		mockReadFileSync.mockImplementation(() => {
			throw new Error('EIO');
		});

		const res = await routeModule.GET(createRequest('aud_sb019e2499'), ctx('aud_sb019e2499'));
		const body = await res.json();

		expect(res.status).toBe(500);
		expect(body.error).toBe('Internal server error');
	});
});
