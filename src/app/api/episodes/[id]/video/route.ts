import { NextResponse } from "next/server";
import { DatabaseSync } from "node:sqlite";
import path from "path";

// ── Types ──────────────────────────────────────────────────────────

/** Body gửi từ OpenCut sau khi export MP4 thành công. */
interface VideoSyncBody {
  videoUrl: string;
  duration?: number;
  format?: string;
  filesize?: number;
}

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

// ── Database ───────────────────────────────────────────────────────

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

// ── PATCH Handler ──────────────────────────────────────────────────

/**
 * PATCH /api/episodes/[id]/video
 *
 * Nhận metadata video export từ OpenCut-AI và cập nhật Episode.
 * OpenCut gọi endpoint này sau khi export MP4 thành công.
 *
 * Body JSON: { videoUrl: string, duration?: number, format?: string, filesize?: number }
 *
 * @returns { success: true, episode: EpisodeRow } nếu cập nhật thành công
 * @returns 400 nếu thiếu videoUrl hoặc id không hợp lệ
 * @returns 404 nếu không tìm thấy episode
 * @returns 500 nếu lỗi database
 * @sideEffect UPDATE episodes SET video_url, status, duration, updated_at
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  // --- Parse params ---
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

  // --- Parse body ---
  let body: VideoSyncBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  // --- Validate ---
  if (!body.videoUrl || typeof body.videoUrl !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'videoUrl' (required, string)" },
      { status: 400 },
    );
  }

  if (
    body.duration !== undefined &&
    (typeof body.duration !== "number" || body.duration < 0)
  ) {
    return NextResponse.json(
      { error: "Invalid 'duration' (must be non-negative number)" },
      { status: 400 },
    );
  }

  // --- Update database ---
  try {
    const database = getDb();
    const now = new Date().toISOString();

    // Kiểm tra episode tồn tại
    const existing = database
      .prepare("SELECT id FROM episodes WHERE id = ? AND deleted_at IS NULL")
      .get(episodeId);

    if (!existing) {
      return NextResponse.json(
        { error: "Episode not found" },
        { status: 404 },
      );
    }

    // Cập nhật video_url, status, và duration nếu được cung cấp
    const newDuration = body.duration !== undefined ? body.duration : null;
    database
      .prepare(
        `UPDATE episodes
         SET video_url = ?,
             status = 'exported',
             duration = CASE WHEN ? IS NOT NULL THEN ? ELSE duration END,
             updated_at = ?
         WHERE id = ? AND deleted_at IS NULL`,
      )
      .run(body.videoUrl, newDuration, newDuration, now, episodeId);

    // Đọc lại episode đã cập nhật
    const episode = database
      .prepare(
        `SELECT id, drama_id, episode_number, title, content, script_content,
                description, duration, status, video_url, thumbnail,
                image_config_id, video_config_id, audio_config_id,
                created_at, updated_at
         FROM episodes WHERE id = ?`,
      )
      .get(episodeId) as EpisodeRow;

    return NextResponse.json({ success: true, episode });
  } catch (error) {
    console.error(`[PATCH /api/episodes/${episodeId}/video]`, error);
    return NextResponse.json(
      { error: "Failed to update episode video metadata" },
      { status: 500 },
    );
  }
}
