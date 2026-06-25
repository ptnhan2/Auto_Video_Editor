import { NextResponse } from "next/server";
import { DatabaseSync } from "node:sqlite";
import path from "path";

// ── Types ──────────────────────────────────────────────────

/** Episode row từ database (khớp với schema.py Episode model). */
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

// ── Database ───────────────────────────────────────────────

let db: DatabaseSync | null = null;

/**
 * Lấy singleton kết nối SQLite.
 * Dùng WAL mode cho concurrent reads tốt hơn.
 *
 * @returns DatabaseSync instance (reused across requests)
 * @sideEffect Mở file database.sqlite nếu chưa mở
 */
function getDb(): DatabaseSync {
  if (!db) {
    const dbPath = path.join(process.cwd(), "database.sqlite");
    db = new DatabaseSync(dbPath);
    db.exec("PRAGMA journal_mode=WAL");
  }
  return db;
}

// ── GET Handler ────────────────────────────────────────────

/**
 * GET /api/episodes/[id]
 *
 * Trả về thông tin chi tiết của 1 episode.
 * Dùng cho polling pipeline status real-time.
 *
 * @returns 200 với { episode: EpisodeRow } nếu tìm thấy
 * @returns 404 nếu episode không tồn tại hoặc đã bị xoá mềm
 * @returns 500 nếu lỗi database
 * @sideEffect SELECT từ SQLite episodes table (read-only)
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let episodeId: string;
  try {
    const resolved = await params;
    episodeId = resolved.id;
  } catch {
    return NextResponse.json(
      { error: "Invalid episode ID in URL" },
      { status: 400 },
    );
  }

  if (!episodeId || typeof episodeId !== "string") {
    return NextResponse.json(
      { error: "Episode ID is required" },
      { status: 400 },
    );
  }

  try {
    const database = getDb();
    const row = database
      .prepare(
        `SELECT id, drama_id, episode_number, title, content, script_content,
                description, duration, status, video_url, thumbnail,
                image_config_id, video_config_id, audio_config_id,
                created_at, updated_at
         FROM episodes WHERE id = ? AND deleted_at IS NULL`,
      )
      .get(episodeId) as EpisodeRow | undefined;

    if (!row) {
      return NextResponse.json(
        { error: "Episode not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ episode: row });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[GET /api/episodes/${episodeId}]`, msg);
    return NextResponse.json(
      { error: `Database error: ${msg}` },
      { status: 500 },
    );
  }
}
