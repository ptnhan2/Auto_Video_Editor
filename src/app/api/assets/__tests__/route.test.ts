/**
 * Unit tests for GET /api/assets route.
 *
 * Follows the pattern from src/__tests__/api/episodes.test.ts:
 * - Mock node:sqlite via vi.mock
 * - Dynamic import route module in beforeEach
 * - Construct Request objects (Web API)
 * - Call handler and assert response status + body
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════
// Mock node:sqlite
// ═══════════════════════════════════════════════════════════════════

const mockStatement = {
  all: vi.fn(),
  get: vi.fn(),
  run: vi.fn(),
};

const mockDb = {
  prepare: vi.fn(() => mockStatement),
  close: vi.fn(),
};

vi.mock('node:sqlite', () => ({
  DatabaseSync: vi.fn(function () {
    return mockDb;
  }),
}));

// ═══════════════════════════════════════════════════════════════════
// Dynamic route import
// ═══════════════════════════════════════════════════════════════════

let routeModule: {
  GET: (req: NextRequest) => Promise<NextResponse>;
};

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockDb.prepare = vi.fn(() => mockStatement);
  routeModule = await import('@/app/api/assets/route');
});

// ── Helpers ───────────────────────────────────────────────────────

function createGetRequest(params?: Record<string, string>): Request {
  const url = new URL('http://localhost/api/assets');
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new Request(url.toString());
}

// Sample asset rows matching AssetRow interface
const sampleAssets = [
  {
    id: '01J001',
    type: 'background',
    prompt: 'Sunset over mountains',
    status: 'READY',
    result_asset_id: 'bg_01J001',
    hash_key: 'abc001',
    created_at: '2026-05-25T10:00:00',
  },
  {
    id: '01J002',
    type: 'background',
    prompt: 'City skyline at night',
    status: 'PENDING',
    result_asset_id: null,
    hash_key: 'abc002',
    created_at: '2026-05-26T12:00:00',
  },
  {
    id: '01J003',
    type: 'expression',
    prompt: 'Happy face expression',
    status: 'READY',
    result_asset_id: 'exp_01J003',
    hash_key: 'abc003',
    created_at: '2026-05-27T08:00:00',
  },
  {
    id: '01J004',
    type: 'sfx',
    prompt: 'Punch sound effect',
    status: 'FAILED',
    result_asset_id: null,
    hash_key: 'abc004',
    created_at: '2026-05-24T15:00:00',
  },
];

// ── GET /api/assets ───────────────────────────────────────────────

describe('GET /api/assets', () => {
  it('returns data array with pagination metadata', async () => {
    mockStatement.all.mockReturnValue(sampleAssets);
    mockStatement.get.mockReturnValue({ total: 42 });

    const req = createGetRequest({ limit: '20', offset: '0' });
    const response = await routeModule.GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: sampleAssets,
      total: 42,
      limit: 20,
      offset: 0,
    });
  });

  it('uses default pagination when no params provided', async () => {
    mockStatement.all.mockReturnValue([]);
    mockStatement.get.mockReturnValue({ total: 0 });

    const req = createGetRequest();
    const response = await routeModule.GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(body.total).toBe(0);
    expect(body.limit).toBe(20);
    expect(body.offset).toBe(0);
  });

  it('clamps limit to max 100', async () => {
    mockStatement.all.mockReturnValue([]);
    mockStatement.get.mockReturnValue({ total: 0 });

    const req = createGetRequest({ limit: '999' });
    const response = await routeModule.GET(req);
    const body = await response.json();

    expect(body.limit).toBe(100);
  });

  it('filters by status=READY', async () => {
    const filtered = sampleAssets.filter((a) => a.status === 'READY');
    mockStatement.all.mockReturnValue(filtered);
    mockStatement.get.mockReturnValue({ total: filtered.length });

    const req = createGetRequest({ status: 'READY' });
    const response = await routeModule.GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.every((r: { status: string }) => r.status === 'READY')).toBe(true);
    expect(body.total).toBe(2);
  });

  it('returns 400 for invalid status value', async () => {
    const req = createGetRequest({ status: 'INVALID' });
    const response = await routeModule.GET(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toHaveProperty('error');
  });

  it('returns 400 for negative limit', async () => {
    const req = createGetRequest({ limit: '-1' });
    const response = await routeModule.GET(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toHaveProperty('error');
  });

  it('returns 400 for negative offset', async () => {
    const req = createGetRequest({ offset: '-5' });
    const response = await routeModule.GET(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toHaveProperty('error');
  });

  it('returns empty data when no assets match filter', async () => {
    mockStatement.all.mockReturnValue([]);
    mockStatement.get.mockReturnValue({ total: 0 });

    const req = createGetRequest({ status: 'READY', type: 'sfx' });
    const response = await routeModule.GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('returns 500 on database error with generic message', async () => {
    mockDb.prepare.mockImplementation(() => {
      throw new Error('SQLITE_CORRUPT');
    });

    const req = createGetRequest();
    const response = await routeModule.GET(req);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Internal server error');
  });
});
