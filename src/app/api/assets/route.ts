/**
 * GET /api/assets — Query assets table with filter + pagination.
 *
 * Query params:
 *   status?      - Filter by derived status: READY (deleted_at IS NULL), FAILED (deleted_at IS NOT NULL),
 *                  PENDING/PROCESSING returns empty (not applicable)
 *   type?        - Filter by asset type: background, expression, item, sfx, bgm, ...
 *   limit?       - Max items per page (default 20, max 100)
 *   offset?      - Pagination offset (default 0)
 */

import { NextResponse } from 'next/server';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

// ── Constants ──────────────────────────────────────────────────────────────

const DB_FILENAME = 'database.sqlite';

const VALID_STATUSES = ['PENDING', 'PROCESSING', 'READY', 'FAILED'] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// ── Helpers ────────────────────────────────────────────────────────────────

function isValidStatus(value: string): value is ValidStatus {
  return (VALID_STATUSES as readonly string[]).includes(value);
}

interface AssetRow {
  id: string;
  type: string;
  prompt: string | null;
  status: string;
  result_asset_id: string | null;
  hash_key: string;
  created_at: string;
}

// ── Database connection (lazy singleton) ─────────────────────────────────

let _db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!_db) {
    const dbPath = path.resolve(process.cwd(), DB_FILENAME);
    _db = new DatabaseSync(dbPath, { open: true, readonly: true });
  }
  return _db;
}

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);

  // -- Parse query params --

  const rawStatus = searchParams.get('status');
  const assetType = searchParams.get('type');
  const limitStr = searchParams.get('limit');
  const offsetStr = searchParams.get('offset');

  // -- Validate status --

  if (rawStatus !== null && !isValidStatus(rawStatus)) {
    return NextResponse.json(
      {
        error: `Invalid status '${rawStatus}'. Valid values: ${VALID_STATUSES.join(', ')}`,
      },
      { status: 400 },
    );
  }

  // -- Parse & validate limit --

  let limit = DEFAULT_LIMIT;
  if (limitStr !== null) {
    const parsed = parseInt(limitStr, 10);
    if (isNaN(parsed) || parsed < 1) {
      return NextResponse.json(
        { error: 'Limit must be a positive integer' },
        { status: 400 },
      );
    }
    limit = Math.min(parsed, MAX_LIMIT);
  }

  // -- Parse & validate offset --

  let offset = 0;
  if (offsetStr !== null) {
    const parsed = parseInt(offsetStr, 10);
    if (isNaN(parsed) || parsed < 0) {
      return NextResponse.json(
        { error: 'Offset must be a non-negative integer' },
        { status: 400 },
      );
    }
    offset = parsed;
  }

  // -- Build SQL query --

  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (rawStatus !== null) {
    if (rawStatus === 'READY') {
      conditions.push('deleted_at IS NULL');
    } else if (rawStatus === 'FAILED') {
      conditions.push('deleted_at IS NOT NULL');
    } else {
      conditions.push('1 = 0');
    }
  } else {
    conditions.push('deleted_at IS NULL');
  }

  if (assetType !== null) {
    conditions.push('type = :type');
    params.type = assetType;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const db = getDb();

    // Count total matching rows (without pagination)
    const countSql = `SELECT COUNT(*) AS total FROM assets ${whereClause}`;
    const countResult = db.prepare(countSql).get(params) as { total: number };
    const total = countResult.total;

    // Fetch paginated rows from assets table
    const dataSql = `
      SELECT
        id,
        type,
        COALESCE(description, name, '') AS prompt,
        CASE WHEN deleted_at IS NULL THEN 'READY' ELSE 'FAILED' END AS status,
        COALESCE(image_gen_id, video_gen_id, url) AS result_asset_id,
        id AS hash_key,
        created_at
      FROM assets
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT :limit OFFSET :offset
    `;

    const rows = db.prepare(dataSql).all({
      ...params,
      limit,
      offset,
    }) as unknown as AssetRow[];

    return NextResponse.json({
      data: rows,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('GET /api/assets error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
