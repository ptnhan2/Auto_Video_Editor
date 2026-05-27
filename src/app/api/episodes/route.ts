import { NextResponse } from "next/server";
import { DatabaseSync } from "node:sqlite";
import crypto from "crypto";
import path from "path";

// ═══════════════════════════════════════════
// Episode type (mirrors src/db/schema.py Episode model)
// ═══════════════════════════════════════════
interface EpisodeRow {
  id: string;
  drama_id: string;
  episode_number: number;
  title: string;
  content: string | null;
  script_content: string | null;
  description: string | null;
  duration: number;
  status: string;
  video_url: string | null;
  thumbnail: string | null;
  image_config_id: string | null;
  video_config_id: string | null;
  audio_config_id: string | null;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════
// ULID generator (matches src/shared/id_generator.py generate_ulid)
// Format: {timestamp_ms_hex:12}{random_hex:20} = 32 chars total
// TODO: Extract to src/shared/id_generator.ts for reuse across routes
// ═══════════════════════════════════════════
function generateUlid(): string {
  const timestamp = Date.now();
  const timestampHex = timestamp.toString(16).padStart(12, "0");
  const randomHex = crypto.randomBytes(10).toString("hex");
  return `${timestampHex}${randomHex}`;
}

// ═══════════════════════════════════════════
// Database connection (lazy singleton)
// ═══════════════════════════════════════════
let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!db) {
    const dbPath = path.join(process.cwd(), "database.sqlite");
    db = new DatabaseSync(dbPath);
    db.exec("PRAGMA journal_mode=WAL");
  }
  return db;
}

// ═══════════════════════════════════════════
// GET /api/episodes?page=1&limit=50
// Returns non-deleted episodes ordered by created_at DESC
// ═══════════════════════════════════════════
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10) || 50));
    const offset = (page - 1) * limit;

    const database = getDb();

    const episodes = database
      .prepare(
        `SELECT id, drama_id, episode_number, title, content, script_content,
                description, duration, status, video_url, thumbnail,
                image_config_id, video_config_id, audio_config_id,
                created_at, updated_at
         FROM episodes
         WHERE deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(limit, offset) as EpisodeRow[];

    // Get total count for pagination metadata
    const totalRow = database
      .prepare("SELECT COUNT(*) as count FROM episodes WHERE deleted_at IS NULL")
      .get() as { count: number };
    const total = totalRow?.count ?? 0;

    return NextResponse.json({
      episodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/episodes]", error);
    return NextResponse.json(
      { error: "Failed to fetch episodes" },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════
// POST /api/episodes
// Creates a new episode from drama_id + input text
// Required: drama_id (max 36), episode_number (positive int), title (max 255)
// Optional: content, description
// ═══════════════════════════════════════════
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  try {
    const { drama_id, episode_number, title, content, description } = body;

    // --- Input validation ---
    if (!drama_id || typeof drama_id !== "string" || drama_id.length > 36) {
      return NextResponse.json(
        { error: "Missing or invalid 'drama_id' (string, max 36 chars)" },
        { status: 400 }
      );
    }
    if (
      episode_number === undefined ||
      typeof episode_number !== "number" ||
      !Number.isInteger(episode_number) ||
      episode_number < 1
    ) {
      return NextResponse.json(
        { error: "Missing or invalid 'episode_number' (must be positive integer)" },
        { status: 400 }
      );
    }
    if (!title || typeof title !== "string" || title.length > 255) {
      return NextResponse.json(
        { error: "Missing or invalid 'title' (string, max 255 chars)" },
        { status: 400 }
      );
    }

    const database = getDb();
    const id = generateUlid();
    const now = new Date().toISOString();

    database
      .prepare(
        `INSERT INTO episodes (id, drama_id, episode_number, title, content, description, status, duration, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'draft', 0, ?, ?)`
      )
      .run(id, drama_id, episode_number, title, content ?? null, description ?? null, now, now);

    const episode = database
      .prepare(
        `SELECT id, drama_id, episode_number, title, content, script_content,
                description, duration, status, video_url, thumbnail,
                image_config_id, video_config_id, audio_config_id,
                created_at, updated_at
         FROM episodes WHERE id = ?`
      )
      .get(id) as EpisodeRow;

    return NextResponse.json({ episode }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/episodes]", error);
    return NextResponse.json(
      { error: "Failed to create episode" },
      { status: 500 }
    );
  }
}
