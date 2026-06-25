import { NextResponse } from "next/server";
import { DatabaseSync } from "node:sqlite";
import { spawn } from "node:child_process";
import path from "path";

// ── Types ──────────────────────────────────────────────────

/** Episode row từ database. */
interface EpisodeRow {
  id: string;
  content: string | null;
  script_content: string | null;
  status: string;
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

// ── POST Handler ───────────────────────────────────────────

/**
 * POST /api/episodes/[id]/run
 *
 * Trigger pipeline S1-S7 cho episode. Spawn Python subprocess async.
 *
 * Kiểm tra:
 * - Episode tồn tại (404)
 * - Episode có content hoặc script_content (400)
 * - Episode không đang chạy (409 nếu status = scripting hoặc rendering)
 *
 * Nếu tất cả OK: update status thành "scripting", spawn pipeline, return 202.
 * Pipeline process chạy detached — không block response.
 *
 * @returns 202 { accepted: true, episode_id, status } nếu thành công
 * @returns 400 nếu episode không có content
 * @returns 404 nếu episode không tồn tại
 * @returns 409 nếu pipeline đang chạy
 * @returns 500 nếu lỗi spawn process hoặc database
 * @sideEffect UPDATE episodes SET status, spawned python process
 */
export async function POST(
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

    const ep = database
      .prepare(
        "SELECT id, content, script_content, status FROM episodes WHERE id = ? AND deleted_at IS NULL",
      )
      .get(episodeId) as EpisodeRow | undefined;

    if (!ep) {
      return NextResponse.json(
        { error: "Episode not found" },
        { status: 404 },
      );
    }

    if (!ep.content && !ep.script_content) {
      return NextResponse.json(
        { error: "Episode has no content or script" },
        { status: 400 },
      );
    }

    const runningStatuses = ["scripting", "rendering"];
    if (runningStatuses.includes(ep.status)) {
      return NextResponse.json(
        { error: "Pipeline already running for this episode" },
        { status: 409 },
      );
    }

    database
      .prepare(
        "UPDATE episodes SET status = ?, updated_at = datetime('now') WHERE id = ?",
      )
      .run("scripting", episodeId);

    const python = process.platform === "win32" ? "python" : "python3";
    const child = spawn(python, ["scripts/run_pipeline.py", episodeId], {
      detached: true,
      stdio: "ignore",
      cwd: process.cwd(),
    });
    child.unref();

    return NextResponse.json(
      { accepted: true, episode_id: episodeId, status: "scripting" },
      { status: 202 },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[POST /api/episodes/${episodeId}/run]`, msg);
    return NextResponse.json(
      { error: `Failed to start pipeline: ${msg}` },
      { status: 500 },
    );
  }
}
