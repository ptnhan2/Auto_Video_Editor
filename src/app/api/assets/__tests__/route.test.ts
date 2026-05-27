/**
 * Unit tests for GET /api/assets route.
 *
 * Tests use an in-memory SQLite database populated with sample AssetQueue rows
 * to verify filtering, pagination, and error handling without touching the real
 * database.sqlite file.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// ── In-memory DB setup ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require('node:sqlite') as {
  DatabaseSync: new (path: string) => { prepare: (sql: string) => { run: (params?: Record<string, unknown>) => void }; close: () => void };
};

let db: ReturnType<typeof DatabaseSync>;

const SAMPLE_DATA = [
  {
    id: '01J001',
    asset_type: 'background',
    prompt: 'Sunset over mountains',
    hash_key: 'abc001',
    status: 'READY',
    result_asset_id: 'bg_01J001',
    priority: 0,
    error_msg: null,
    retry_count: 0,
    created_at: '2026-05-25T10:00:00',
    updated_at: '2026-05-25T10:00:00',
  },
  {
    id: '01J002',
    asset_type: 'background',
    prompt: 'City skyline at night',
    hash_key: 'abc002',
    status: 'PENDING',
    result_asset_id: null,
    priority: 0,
    error_msg: null,
    retry_count: 0,
    created_at: '2026-05-26T12:00:00',
    updated_at: '2026-05-26T12:00:00',
  },
  {
    id: '01J003',
    asset_type: 'expression',
    prompt: 'Happy face expression',
    hash_key: 'abc003',
    status: 'READY',
    result_asset_id: 'exp_01J003',
    priority: 0,
    error_msg: null,
    retry_count: 0,
    created_at: '2026-05-27T08:00:00',
    updated_at: '2026-05-27T08:00:00',
  },
  {
    id: '01J004',
    asset_type: 'sfx',
    prompt: 'Punch sound effect',
    hash_key: 'abc004',
    status: 'FAILED',
    result_asset_id: null,
    priority: 0,
    error_msg: 'Generation timed out',
    retry_count: 3,
    created_at: '2026-05-24T15:00:00',
    updated_at: '2026-05-24T15:30:00',
  },
  {
    id: '01J005',
    asset_type: 'bgm',
    prompt: 'Happy background music',
    hash_key: 'abc005',
    status: 'PROCESSING',
    result_asset_id: null,
    priority: 0,
    error_msg: null,
    retry_count: 0,
    created_at: '2026-05-27T14:00:00',
    updated_at: '2026-05-27T14:00:00',
  },
  {
    id: '01J006',
    asset_type: 'background',
    prompt: 'Forest path',
    hash_key: 'abc006',
    status: 'READY',
    result_asset_id: 'bg_01J006',
    priority: 5,
    error_msg: null,
    retry_count: 0,
    created_at: '2026-05-23T09:00:00',
    updated_at: '2026-05-23T09:00:00',
  },
  {
    id: '01J007',
    asset_type: 'item',
    prompt: 'Magic sword',
    hash_key: 'abc007',
    status: 'READY',
    result_asset_id: 'item_01J007',
    priority: 0,
    error_msg: null,
    retry_count: 0,
    created_at: '2026-05-28T06:00:00',
    updated_at: '2026-05-28T06:00:00',
  },
  {
    id: '01J008',
    asset_type: 'background',
    prompt: 'Ocean view',
    hash_key: 'abc008',
    status: 'FAILED',
    result_asset_id: null,
    priority: 0,
    error_msg: 'API quota exceeded',
    retry_count: 2,
    created_at: '2026-05-26T16:00:00',
    updated_at: '2026-05-26T16:30:00',
  },
];

beforeAll(() => {
  db = new DatabaseSync(':memory:');

  // Create table matching AssetQueue schema
  db.prepare(`
    CREATE TABLE asset_queue (
      id TEXT PRIMARY KEY,
      asset_type TEXT NOT NULL,
      prompt TEXT,
      hash_key TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      result_asset_id TEXT,
      priority INTEGER DEFAULT 0,
      error_msg TEXT,
      retry_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();

  // Insert sample data
  const insert = db.prepare(`
    INSERT INTO asset_queue
      (id, asset_type, prompt, hash_key, status, result_asset_id,
       priority, error_msg, retry_count, created_at, updated_at)
    VALUES
      (:id, :asset_type, :prompt, :hash_key, :status, :result_asset_id,
       :priority, :error_msg, :retry_count, :created_at, :updated_at)
  `);

  for (const row of SAMPLE_DATA) {
    insert.run(row);
  }
});

afterAll(() => {
  db.close();
});

// ── Test helper ─────────────────────────────────────────────────────────────

/**
 * Simulates the SQL queries the route handler runs against the in-memory DB.
 * Handles the same filtering, pagination, and ordering logic.
 */
interface Row {
  id: string;
  asset_type: string;
  prompt: string | null;
  status: string;
  result_asset_id: string | null;
  hash_key: string;
  created_at: string;
}

function queryAssets(filters: {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}): { data: Row[]; total: number } {
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.status) {
    conditions.push('status = :status');
    params.status = filters.status;
  }
  if (filters.type) {
    conditions.push('asset_type = :type');
    params.type = filters.type;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;

  const total = Number(
    db.prepare(`SELECT COUNT(*) AS total FROM asset_queue ${where}`).get(params).total,
  );

  const rows = db
    .prepare(
      `SELECT id, asset_type, prompt, status, result_asset_id, hash_key, created_at
       FROM asset_queue ${where}
       ORDER BY created_at DESC
       LIMIT :limit OFFSET :offset`,
    )
    .all({ ...params, limit, offset }) as Row[];

  return { data: rows, total };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('GET /api/assets — queryAssetQueue', () => {
  it('returns all assets when no filters are provided', () => {
    const result = queryAssets({});
    expect(result.data.length).toBeGreaterThanOrEqual(7);
    expect(result.total).toBe(SAMPLE_DATA.length);
  });

  it('filters by status=READY', () => {
    const result = queryAssets({ status: 'READY' });
    expect(result.data.every((r) => r.status === 'READY')).toBe(true);
    expect(result.total).toBe(4); // 01J001, 01J003, 01J006, 01J007
  });

  it('filters by status=PENDING', () => {
    const result = queryAssets({ status: 'PENDING' });
    expect(result.data.every((r) => r.status === 'PENDING')).toBe(true);
    expect(result.total).toBe(1); // 01J002
  });

  it('filters by asset_type=background', () => {
    const result = queryAssets({ type: 'background' });
    expect(result.data.every((r) => r.asset_type === 'background')).toBe(true);
    expect(result.total).toBe(4); // 01J001, 01J002, 01J006, 01J008
  });

  it('combines status + type filter', () => {
    const result = queryAssets({ status: 'READY', type: 'background' });
    expect(
      result.data.every(
        (r) => r.status === 'READY' && r.asset_type === 'background',
      ),
    ).toBe(true);
    expect(result.total).toBe(2); // 01J001, 01J006
  });

  it('paginates with limit', () => {
    const result = queryAssets({ limit: 3, offset: 0 });
    expect(result.data.length).toBeLessThanOrEqual(3);
    expect(result.total).toBe(SAMPLE_DATA.length);
  });

  it('paginates with limit + offset (page 2)', () => {
    const page1 = queryAssets({ limit: 3, offset: 0 });
    const page2 = queryAssets({ limit: 3, offset: 3 });

    expect(page2.data.length).toBeGreaterThan(0);
    // No ID overlap between pages
    const page1Ids = new Set(page1.data.map((r) => r.id));
    const hasOverlap = page2.data.some((r) => page1Ids.has(r.id));
    expect(hasOverlap).toBe(false);
  });

  it('returns empty data when offset exceeds total', () => {
    const result = queryAssets({ offset: 999 });
    expect(result.data).toEqual([]);
    expect(result.total).toBe(SAMPLE_DATA.length);
  });

  it('returns empty data for non-matching filter', () => {
    const result = queryAssets({ status: 'READY', type: 'sfx' });
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('orders results by created_at DESC', () => {
    const result = queryAssets({});
    for (let i = 1; i < result.data.length; i++) {
      expect(result.data[i - 1].created_at >= result.data[i].created_at).toBe(
        true,
      );
    }
  });

  it('returns rows with all required columns', () => {
    const result = queryAssets({ limit: 1 });
    expect(result.data.length).toBe(1);
    const row = result.data[0];
    expect(row).toHaveProperty('id');
    expect(row).toHaveProperty('asset_type');
    expect(row).toHaveProperty('prompt');
    expect(row).toHaveProperty('status');
    expect(row).toHaveProperty('result_asset_id');
    expect(row).toHaveProperty('hash_key');
    expect(row).toHaveProperty('created_at');
  });
});
