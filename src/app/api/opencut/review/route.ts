import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'path';
import { importProject } from '@/shared/api-clients/opencut-bridge';
import type { SerializedProject } from '@/shared/api-clients/opencut-bridge';

// ✏️ EDIT ZONE START

// ── Types ──────────────────────────────────────────────────────────

/** Một thay đổi được AI đề xuất (add / remove / change element trong project). */
interface ProposedEdit {
  id: string;
  type: 'add' | 'remove' | 'change';
  elementType: string;
  description: string;
  sceneId?: string;
  trackId?: string;
  before?: unknown;
  after?: unknown;
}

/** Kết quả thành công từ review API. */
interface ReviewSuccessResponse {
  success: true;
  episodeId: string;
  decision: 'approve' | 'reject';
  applied: number;
  rejected: number;
}

/** Kết quả lỗi từ review API. */
interface ReviewErrorResponse {
  error: string;
  episodeId?: string;
}

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Đọc và parse project JSON từ pipeline S7 output file.
 * File được tạo bởi S7 Video Compiler tại `public/scripts/opencut_{episodeId}.json`.
 *
 * @param episodeId - Episode ID để xác định file JSON pipeline output
 * @returns Parsed SerializedProject object (OpenCut v10 format)
 * @throws Error nếu file không tồn tại (ENOENT) hoặc JSON parse lỗi
 * @sideEffect Đọc file từ filesystem (public/scripts/)
 */
async function readPipelineOutput(episodeId: string): Promise<SerializedProject> {
  const filePath = path.join(
    process.cwd(),
    'public',
    'scripts',
    `opencut_${episodeId}.json`,
  );

  let raw: string;
  try {
    raw = await readFile(filePath, 'utf-8');
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === 'ENOENT') {
      throw new Error(`Project file not found for episode: ${episodeId}`);
    }
    throw new Error(`Failed to read project file: ${(err as Error).message}`);
  }

  try {
    return JSON.parse(raw) as SerializedProject;
  } catch (err) {
    throw new Error(`Invalid project JSON: ${(err as Error).message}`);
  }
}

/**
 * Áp dụng danh sách proposed edits vào SerializedProject JSON.
 * Hỗ trợ 3 loại edit: add (thêm element), remove (xóa element), change (sửa element).
 *
 * @param project - SerializedProject JSON object gốc
 * @param edits - Danh sách proposed edits từ AI
 * @returns Số lượng edit đã áp dụng thành công
 * @sideEffect Mutates project object (in-place) — thay đổi scenes/tracks/elements
 */
function applyEdits(project: SerializedProject, edits: ProposedEdit[]): number {
  let applied = 0;

  for (const edit of edits) {
    try {
      switch (edit.type) {
        case 'add': {
          if (edit.sceneId && edit.trackId && edit.after) {
            const scene = (project.scenes as Array<Record<string, unknown>>).find(
              (s) => (s as Record<string, unknown>).id === edit.sceneId,
            );
            if (scene) {
              const tracks = (scene as Record<string, unknown>).tracks as Array<Record<string, unknown>>;
              const track = tracks?.find((t) => (t as Record<string, unknown>).id === edit.trackId);
              if (track) {
                const elements = ((track as Record<string, unknown>).elements as Array<unknown>) ?? [];
                elements.push(edit.after);
                (track as Record<string, unknown>).elements = elements;
                applied++;
              }
            }
          }
          break;
        }
        case 'remove': {
          if (edit.sceneId && edit.trackId && edit.before) {
            const scene = (project.scenes as Array<Record<string, unknown>>).find(
              (s) => (s as Record<string, unknown>).id === edit.sceneId,
            );
            if (scene) {
              const tracks = (scene as Record<string, unknown>).tracks as Array<Record<string, unknown>>;
              const track = tracks?.find((t) => (t as Record<string, unknown>).id === edit.trackId);
              if (track) {
                const elements = ((track as Record<string, unknown>).elements as Array<Record<string, unknown>>) ?? [];
                const beforeId = (edit.before as Record<string, unknown>)?.id;
                (track as Record<string, unknown>).elements = elements.filter(
                  (el) => (el as Record<string, unknown>).id !== beforeId,
                );
                applied++;
              }
            }
          }
          break;
        }
        case 'change': {
          if (edit.sceneId && edit.trackId && edit.after) {
            const scene = (project.scenes as Array<Record<string, unknown>>).find(
              (s) => (s as Record<string, unknown>).id === edit.sceneId,
            );
            if (scene) {
              const tracks = (scene as Record<string, unknown>).tracks as Array<Record<string, unknown>>;
              const track = tracks?.find((t) => (t as Record<string, unknown>).id === edit.trackId);
              if (track) {
                const elements = ((track as Record<string, unknown>).elements as Array<Record<string, unknown>>) ?? [];
                const afterId = (edit.after as Record<string, unknown>)?.id;
                const idx = elements.findIndex((el) => (el as Record<string, unknown>).id === afterId);
                if (idx >= 0) {
                  elements[idx] = { ...elements[idx], ...(edit.after as Record<string, unknown>) };
                  applied++;
                }
              }
            }
          }
          break;
        }
      }
    } catch {
      // Bỏ qua edit lỗi, tiếp tục với edit tiếp theo
      console.warn(`[review] Failed to apply edit: ${edit.id}`);
    }
  }

  return applied;
}

// ── POST Handler ───────────────────────────────────────────────────

/**
 * POST /api/opencut/review
 *
 * Nhận quyết định review từ user (approve/reject) kèm danh sách proposed edits.
 * Nếu approve → áp dụng edits vào project JSON rồi import lại vào OpenCut.
 * Nếu reject → discard edits, không thay đổi gì.
 *
 * Request body: `{ episodeId: string, decision: "approve" | "reject", edits?: ProposedEdit[] }`
 *
 * Response:
 * - 200: `{ success: true, episodeId, decision, applied, rejected }`
 * - 400: `{ error: string }` — thiếu episodeId hoặc decision không hợp lệ
 * - 404: `{ error: string, episodeId }` — file pipeline output không tồn tại
 * - 500: `{ error: string }` — lỗi internal
 *
 * @sideEffect
 *   - Khi approve: đọc file public/scripts/opencut_{episodeId}.json,
 *     áp dụng edits, gọi importProject() để import vào OpenCut-AI
 *   - Khi reject: không có side effect (chỉ log)
 */
export async function POST(req: Request): Promise<Response> {
  // ── Parse request body ──
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' } satisfies ReviewErrorResponse,
      { status: 400 },
    );
  }

  const { episodeId, decision, edits } = body;

  if (!episodeId || typeof episodeId !== 'string' || episodeId.length === 0) {
    return NextResponse.json(
      { error: "Missing 'episodeId' in request body" } satisfies ReviewErrorResponse,
      { status: 400 },
    );
  }

  if (decision !== 'approve' && decision !== 'reject') {
    return NextResponse.json(
      { error: "Missing or invalid 'decision'. Must be 'approve' or 'reject'." } satisfies ReviewErrorResponse,
      { status: 400 },
    );
  }

  // ── Reject path: discard edits, không cần đọc file ──
  if (decision === 'reject') {
    const editList = Array.isArray(edits) ? edits : [];
    return NextResponse.json(
      {
        success: true,
        episodeId: episodeId as string,
        decision: 'reject',
        applied: 0,
        rejected: editList.length,
      } satisfies ReviewSuccessResponse,
      { status: 200 },
    );
  }

  // ── Approve path: đọc project, áp dụng edits, import ──
  const editList = (Array.isArray(edits) ? edits : []) as ProposedEdit[];

  let projectJson: SerializedProject;
  try {
    projectJson = await readPipelineOutput(episodeId as string);
  } catch (err) {
    const message = (err as Error).message;
    if (message.startsWith('Project file not found')) {
      return NextResponse.json(
        { error: message, episodeId: episodeId as string } satisfies ReviewErrorResponse,
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: message } satisfies ReviewErrorResponse,
      { status: 500 },
    );
  }

  // Áp dụng edits vào project JSON
  const applied = applyEdits(projectJson, editList);

  // Import project đã chỉnh sửa vào OpenCut
  try {
    await importProject(projectJson);
    return NextResponse.json(
      {
        success: true,
        episodeId: episodeId as string,
        decision: 'approve',
        applied,
        rejected: 0,
      } satisfies ReviewSuccessResponse,
      { status: 200 },
    );
  } catch (err) {
    const message = (err as Error).message;
    if (message.includes('OpenCut not running') || message.includes('fetch')) {
      return NextResponse.json(
        { error: 'OpenCut not running — edits applied locally but not imported' } satisfies ReviewErrorResponse,
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: `Import failed: ${message}` } satisfies ReviewErrorResponse,
      { status: 502 },
    );
  }
}

// ✏️ EDIT ZONE END
