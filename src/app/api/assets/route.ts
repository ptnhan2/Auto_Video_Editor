/**
 * GET /api/assets — Query AssetQueue with filter + pagination.
 *
 * Query params:
 *   status?      - Filter by status: PENDING, PROCESSING, READY, FAILED
 *   type?        - Filter by asset_type: background, expression, item, sfx, bgm, ...
 *   limit?       - Max items per page (default 20, max 100)
 *   offset?      - Pagination offset (default 0)
 *
 * TODO(#164-episode): When AssetQueue schema gains an `episode_id` column,
 *   add `episode_id?` query param filter.
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';

// ── Types for node:sqlite (not in @types/node@20) ──────────────────────────

interface SqliteRow {
  [column: string]: unknown;
}

interface SqliteStatement {
  all(params?: Record<string, unknown>): SqliteRow[];
  get(params?: Record<string, unknown>): SqliteRow;
}

interface SqliteDatabase {
  prepare(sql: string): SqliteStatement;
  close(): void;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require('node:sqlite') as {
  DatabaseSync: new (path: string, opts?: { open?: boolean }) => SqliteDatabase;
};

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
  asset_type: string;
  prompt: string | null;
  status: string;
  result_asset_id: string | null;
  hash_key: string;
  created_at: string;
}

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);

  // -- Parse query params --

  const rawStatus = searchParams.get('status');
  const assetType = searchParams.get('type');
  const limitStr = searchParams.get('limit');
  const offsetStr = searchParams.get('offset');

  // episode_id accepted but not yet filterable — see TODO at top of file

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
    conditions.push('status = :status');
    params.status = rawStatus;
  }

  if (assetType !== null) {
    conditions.push('asset_type = :type');
    params.type = assetType;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const dbPath = path.resolve(process.cwd(), DB_FILENAME);
  let db: SqliteDatabase | undefined;

  try {
    db = new DatabaseSync(dbPath, { open: true });

    // Count total matching rows (without pagination)
    const countSql = `SELECT COUNT(*) AS total FROM asset_queue ${whereClause}`;
    const countResult = db.prepare(countSql).get(params);
    const total = Number(countResult.total);

    // Fetch paginated rows
    const dataSql = `
      SELECT
        id,
        asset_type,
        prompt,
        status,
        result_asset_id,
        hash_key,
        created_at
      FROM asset_queue
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT :limit OFFSET :offset
    `;

    const rows = db.prepare(dataSql).all({
      ...params,
      limit,
      offset,
    }) as AssetRow[];

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
  } finally {
    if (db) {
      db.close();
    }
  }
}
