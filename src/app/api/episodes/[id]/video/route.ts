import { NextResponse } from "next/server";
import { DatabaseSync } from "node:sqlite";
import path from "path";

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Body gá»­i tá»« OpenCut sau khi export MP4 thÃ nh cÃ´ng. */
interface VideoSyncBody {
  videoUrl: string;
  duration?: number;
  format?: string;
  filesize?: number;
}

/** Episode row tá»« database (khá»›p vá»›i schema.py Episode model). */
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

// â”€â”€ Database â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

let db: DatabaseSync | null = null;

/**
 * Láº¥y singleton káº¿t ná»‘i SQLite.
 * DÃ¹ng WAL mode cho concurrent reads tá»‘t hÆ¡n.
 *
 * @returns DatabaseSync instance (reused across requests)
 * @sideEffect Má»Ÿ file database.sqlite náº¿u chÆ°a má»Ÿ
 */
function getDb(): DatabaseSync {
  if (!db) {
    const dbPath = path.join(process.cwd(), "database.sqlite");
    db = new DatabaseSync(dbPath);
    db.exec("PRAGMA journal_mode=WAL");
  }
  return db;
}

// â”€â”€ PATCH Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * PATCH /api/episodes/[id]/video
 *
 * Nháº­n metadata video export tá»« OpenCut-AI vÃ  cáº­p nháº­t Episode.
 * OpenCut gá»i endpoint nÃ y sau khi export MP4 thÃ nh cÃ´ng.
 *
 * Body JSON: { videoUrl: string, duration?: number, format?: string, filesize?: number }
 *
 * @returns { success: true, episode: EpisodeRow } náº¿u cáº­p nháº­t thÃ nh cÃ´ng
 * @returns 400 náº¿u thiáº¿u videoUrl hoáº·c id khÃ´ng há»£p lá»‡
 * @returns 404 náº¿u khÃ´ng tÃ¬m tháº¥y episode
 * @returns 500 náº¿u lá»—i database
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

    // Kiá»ƒm tra episode tá»“n táº¡i
    const existing = database
      .prepare("SELECT id FROM episodes WHERE id = ? AND deleted_at IS NULL")
      .get(episodeId);

    if (!existing) {
      return NextResponse.json(
        { error: "Episode not found" },
        { status: 404 },
      );
    }

    // Cáº­p nháº­t video_url, status, vÃ  duration náº¿u Ä‘Æ°á»£c cung cáº¥p
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

    // Äá»c láº¡i episode Ä‘Ã£ cáº­p nháº­t
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
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[PATCH /api/episodes/${episodeId}/video]`, msg);
    return NextResponse.json(
      { error: `Database error: ${msg}` },
      { status: 500 },
    );
  }
}
