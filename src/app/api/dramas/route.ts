// ✏️ EDIT ZONE START
import { NextResponse } from "next/server";
import { DatabaseSync } from "node:sqlite";
import path from "path";

// ═══════════════════════════════════════════
// Drama row (mirrors src/db/schema.py Drama model)
// ═══════════════════════════════════════════
interface DramaRow {
  id: string;
  title: string;
  description: string | null;
  genre: string | null;
  style: string | null;
  total_episodes: number | null;
  total_duration: number | null;
  status: string;
  thumbnail: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
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
// GET /api/dramas
// Returns all non-deleted dramas ordered by created_at DESC
// ═══════════════════════════════════════════
export async function GET() {
  try {
    const database = getDb();

    const dramas = database
      .prepare(
        `SELECT id, title, description, genre, style,
                total_episodes, total_duration, status,
                thumbnail, tags, created_at, updated_at
         FROM dramas
         WHERE deleted_at IS NULL
         ORDER BY created_at DESC`
      )
      .all() as DramaRow[];

    // Map snake_case → camelCase for frontend consumption
    const mapped = dramas.map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      genre: d.genre,
      style: d.style ?? "modern",
      totalEpisodes: d.total_episodes ?? 0,
      totalDuration: d.total_duration ?? 0,
      status: d.status,
      thumbnail: d.thumbnail,
      tags: d.tags,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));

    return NextResponse.json({ dramas: mapped });
  } catch (error) {
    console.error("[GET /api/dramas]", error);
    return NextResponse.json(
      { error: "Failed to fetch dramas" },
      { status: 500 }
    );
  }
}
// ✏️ EDIT ZONE END
