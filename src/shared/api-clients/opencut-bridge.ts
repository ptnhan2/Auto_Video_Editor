// ── Constants ──────────────────────────────────────────────────────

/**
 * Base URL của OpenCut-AI editor (port 3001).
 * Cấu hình từ Rule K: OpenCut-AI chạy độc lập trên port 3001.
 */
const OPENCUT_BASE_URL = 'http://localhost:3001';

/** Timeout cho mỗi HTTP request đến OpenCut-AI (10 giây). */
const REQUEST_TIMEOUT_MS = 10_000;

// ── Types ──────────────────────────────────────────────────────────

/**
 * Serialized project JSON từ pipeline S7, tương thích OpenCut v10 format.
 * Date fields đã được serialize thành ISO 8601 string.
 */
export interface SerializedProject {
  metadata: { id: string; name: string; [key: string]: unknown };
  scenes: unknown[];
  currentSceneId: string;
  settings: Record<string, unknown>;
  version: number;
}

/** Kết quả thành công từ OpenCut import project API. */
interface ImportProjectResult {
  success: boolean;
  projectId: string;
}

/** Kết quả thành công từ OpenCut import asset API. */
interface ImportAssetResult {
  success: boolean;
  mediaId: string;
}

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Gửi HTTP request đến OpenCut-AI với timeout và error handling.
 * Tự động bắt lỗi network (ECONNREFUSED, timeout) và HTTP non-OK.
 *
 * @param url - Target OpenCut API URL (full path, e.g. /api/projects/import)
 * @param options - Fetch options (method, headers, body)
 * @returns Parsed JSON response body
 * @throws Error với message cụ thể nếu OpenCut không chạy, timeout, hoặc HTTP lỗi
 * @sideEffect Gửi HTTP request qua network đến OpenCut-AI (localhost:3001)
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `OpenCut API error: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    // Phân loại lỗi để trả về message phù hợp cho caller.
    // Dùng error.name thay vì instanceof DOMException vì Node.js không có DOMException.
    if ((error as Error & { name?: string }).name === 'AbortError') {
      throw new Error('OpenCut request timed out');
    }
    if (
      error instanceof TypeError &&
      error.message.includes('fetch')
    ) {
      throw new Error('OpenCut not running');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Import project JSON vào OpenCut-AI editor.
 * Gửi SerializedProject lên OpenCut API để lưu vào IndexedDB storage.
 *
 * @param projectJson - Serialized project JSON object (OpenCut v10 format).
 *   Phải có metadata.id, scenes, currentSceneId, settings, version.
 * @returns Kết quả import gồm projectId của project đã lưu trong OpenCut.
 * @throws Error nếu OpenCut không chạy, request timeout, hoặc API trả HTTP lỗi.
 * @sideEffect Gọi POST http://localhost:3001/api/projects/import
 */
export async function importProject(
  projectJson: SerializedProject,
): Promise<ImportProjectResult> {
  const result = await fetchWithTimeout(
    `${OPENCUT_BASE_URL}/api/projects/import`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: projectJson }),
    },
  );
  return result as ImportProjectResult;
}

/**
 * Upload media file vào OpenCut-AI storage cho một project cụ thể.
 * File được gửi dưới dạng multipart/form-data với các field:
 * file (Blob), projectId, mediaId.
 *
 * @param projectId - ID của project trong OpenCut để gắn asset vào.
 * @param mediaId - Media asset ID (phải khớp với mediaId trong project JSON).
 * @param fileBuffer - Raw binary data của file media (video, audio, image).
 * @returns Kết quả import gồm mediaId đã đăng ký trong OpenCut storage.
 * @throws Error nếu OpenCut không chạy, request timeout, hoặc API trả HTTP lỗi.
 * @sideEffect Gọi POST multipart đến http://localhost:3001/api/media/import
 */
export async function importAsset(
  projectId: string,
  mediaId: string,
  fileBuffer: Uint8Array,
): Promise<ImportAssetResult> {
  const formData = new FormData();
  const blob = new Blob([fileBuffer as BlobPart]);
  formData.append('file', blob, mediaId);
  formData.append('projectId', projectId);
  formData.append('mediaId', mediaId);

  const result = await fetchWithTimeout(
    `${OPENCUT_BASE_URL}/api/media/import`,
    {
      method: 'POST',
      body: formData,
    },
  );
  return result as ImportAssetResult;
}
