import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'path';
import { importProject, importAsset } from '@/shared/api-clients/opencut-bridge';
import type { SerializedProject } from '@/shared/api-clients/opencut-bridge';

// ── Types ──────────────────────────────────────────────────────────

/** Kết quả thành công từ import API. */
interface ImportSuccessResponse {
  success: true;
  projectId: string;
}

/** Kết quả lỗi từ import API. */
interface ImportErrorResponse {
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
 * Trích xuất tất cả mediaId duy nhất từ SerializedProject JSON.
 * Duyệt đệ quy scenes → tracks → elements để tìm field `mediaId`
 * trong các element có type `video`, `audio`, hoặc `image`.
 *
 * @param project - SerializedProject JSON object từ pipeline output
 * @returns Mảng các mediaId duy nhất (không trùng lặp)
 */
function extractMediaIds(project: SerializedProject): string[] {
  const ids = new Set<string>();

  for (const scene of project.scenes) {
    const sceneObj = scene as { tracks?: Array<{ elements?: Array<Record<string, unknown>> }> };
    const tracks = sceneObj.tracks ?? [];

    for (const track of tracks) {
      const elements = track.elements ?? [];

      for (const element of elements) {
        const mediaId = element.mediaId;
        if (typeof mediaId === 'string' && mediaId.length > 0) {
          ids.add(mediaId);
        }
      }
    }
  }

  return Array.from(ids);
}

/**
 * Tạo một file buffer rỗng cho media asset import.
 * Khi OpenCut-AI chưa có /api/media/import endpoint (#203),
 * ta gửi placeholder buffer để bridge vẫn hoạt động đúng contract.
 *
 * TODO(#203): Thay thế bằng việc đọc file media thực tế từ disk
 * khi OpenCut-AI có endpoint nhận upload media.
 *
 * @param mediaId - Media asset ID để tạo filename
 * @returns Uint8Array buffer (placeholder — không chứa dữ liệu thật)
 */
function createPlaceholderBuffer(mediaId: string): Uint8Array {
  // Placeholder: tạo buffer rỗng. Sau #203 sẽ đọc file thật từ disk.
  void mediaId;
  return new Uint8Array(0);
}

// ── POST Handler ───────────────────────────────────────────────────

/**
 * POST /api/opencut/import
 *
 * Nhận `episodeId` từ request body, đọc file pipeline output JSON
 * (`public/scripts/opencut_{episodeId}.json`), extract media references,
 * upload từng asset vào OpenCut-AI storage, rồi import project JSON.
 *
 * Request body: `{ episodeId: string }`
 *
 * Response:
 * - 200: `{ success: true, projectId: string }` — import thành công
 * - 400: `{ error: string }` — thiếu episodeId hoặc JSON không hợp lệ
 * - 404: `{ error: string, episodeId: string }` — file pipeline output không tồn tại
 * - 502: `{ error: string }` — OpenCut API trả lỗi
 * - 503: `{ error: string }` — OpenCut-AI không chạy
 *
 * @sideEffect
 *   - Đọc file public/scripts/opencut_{episodeId}.json từ filesystem
 *   - Gọi HTTP POST đến OpenCut-AI internal API (localhost:3001) qua bridge
 *     để import media assets và project JSON
 */
export async function POST(req: Request): Promise<Response> {
  // ── Parse request body ──
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' } satisfies ImportErrorResponse,
      { status: 400 },
    );
  }

  const { episodeId } = body;
  if (!episodeId || typeof episodeId !== 'string' || episodeId.length === 0) {
    return NextResponse.json(
      { error: "Missing 'episodeId' in request body" } satisfies ImportErrorResponse,
      { status: 400 },
    );
  }

  // ── Đọc pipeline output JSON ──
  let projectJson: SerializedProject;
  try {
    projectJson = await readPipelineOutput(episodeId);
  } catch (err) {
    const message = (err as Error).message;

    if (message.startsWith('Project file not found')) {
      return NextResponse.json(
        { error: message, episodeId } satisfies ImportErrorResponse,
        { status: 404 },
      );
    }
    if (message.startsWith('Invalid project JSON')) {
      return NextResponse.json(
        { error: message } satisfies ImportErrorResponse,
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: `Failed to read project: ${message}` } satisfies ImportErrorResponse,
      { status: 500 },
    );
  }

  // ── Import media assets trước (để OpenCut resolve mediaId) ──
  const mediaIds = extractMediaIds(projectJson);
  const projectId = projectJson.metadata?.id ?? 'unknown';

  for (const mediaId of mediaIds) {
    try {
      // TODO(#203): Đọc file media thực tế từ disk thay vì placeholder buffer
      // khi OpenCut-AI có /api/media/import endpoint.
      const fileBuffer = createPlaceholderBuffer(mediaId);
      await importAsset(projectId, mediaId, fileBuffer);
    } catch {
      // Graceful degradation: asset upload fail không block project import.
      // Log warning để debug nếu cần, nhưng không crash.
      console.warn(`[import] Failed to upload asset: ${mediaId}`);
    }
  }

  // ── Import project JSON vào OpenCut ──
  try {
    const result = await importProject(projectJson);
    return NextResponse.json(
      { success: true, projectId: result.projectId } satisfies ImportSuccessResponse,
      { status: 200 },
    );
  } catch (err) {
    const message = (err as Error).message;

    // Phân loại lỗi theo message từ bridge (opencut-bridge.ts)
    if (message.includes('OpenCut not running') || message.includes('fetch')) {
      return NextResponse.json(
        { error: 'OpenCut not running' } satisfies ImportErrorResponse,
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: `OpenCut import failed: ${message}` } satisfies ImportErrorResponse,
      { status: 502 },
    );
  }
}
