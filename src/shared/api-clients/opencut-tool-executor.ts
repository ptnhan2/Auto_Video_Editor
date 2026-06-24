/**
 * OpenCut Tool Executor — Type-safe dispatch từ Gemini function call sang OpenCut API.
 *
 * Nhận tool call từ AI (Gemini function calling response), route đến handler tương ứng,
 * gọi OpenCut-AI REST API bridge, và trả về ToolResult.
 *
 * Cách dùng với @google/generative-ai:
 * ```ts
 * const functionCalls = response.functionCalls();
 * for (const call of functionCalls) {
 *   const result = await executeToolCall({
 *     name: call.name as OpenCutToolParams["name"],
 *     args: call.args,
 *   });
 *   // Trả result về cho Gemini để nó phản hồi user
 * }
 * ```
 *
 * Rule K (OpenCut-AI Integration): OpenCut-AI chạy trên port 3001,
 * giao tiếp qua REST API bridge.
 */

import type {
  AddClipParams,
  RemoveElementParams,
  SetTransitionParams,
  AddEffectParams,
  AddSubtitleParams,
  AdjustVolumeParams,
  SplitClipParams,
  ExportVideoParams,
  OpenCutToolParams,
} from "@/shared/types/opencut-tools";

// ── Section: Types ──────────────────────────────────────────────

/**
 * Kết quả trả về từ mỗi tool execution.
 * Gồm success flag, data (nếu thành công) hoặc error message (nếu thất bại).
 */
export interface ToolResult {
  /** true nếu OpenCut API trả về HTTP 2xx. */
  success: boolean;
  /** Response data từ OpenCut API (nếu success). */
  data?: Record<string, unknown>;
  /** Error message (nếu API lỗi hoặc network error). */
  error?: string;
}

// ── Section: Constants ──────────────────────────────────────────

/** Base URL của OpenCut-AI REST API bridge (port 3001). */
const OPENCUT_API_BASE = "http://localhost:3001/api";

// ── Section: Helpers ────────────────────────────────────────────

/**
 * Gửi HTTP POST request đến OpenCut-AI API endpoint.
 * Tự động serialize body thành JSON và parse response.
 *
 * @param endpoint - API path (vd: "/timeline/add-clip")
 * @param body - Request body object được serialize thành JSON
 * @returns ToolResult với success flag + data hoặc error message
 * @sideEffect Gửi HTTP POST request đến OpenCut-AI (localhost:3001)
 */
async function postToOpenCut(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<ToolResult> {
  try {
    const response = await fetch(`${OPENCUT_API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `OpenCut API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error calling OpenCut API",
    };
  }
}

// ── Section: Handlers ───────────────────────────────────────────

/**
 * Thêm video/audio clip vào track trên timeline OpenCut.
 *
 * @param args - AddClipParams: track_id, media_id, clip_type, start_time, duration
 * @returns ToolResult với element_id của clip mới tạo
 * @sideEffect Gọi POST /timeline/add-clip đến OpenCut-AI
 */
async function handleAddClip(args: AddClipParams): Promise<ToolResult> {
  return postToOpenCut("/timeline/add-clip", args);
}

/**
 * Xóa element khỏi timeline OpenCut.
 *
 * @param args - RemoveElementParams: track_id, element_id
 * @returns ToolResult với success flag
 * @sideEffect Gọi POST /timeline/remove-element đến OpenCut-AI
 */
async function handleRemoveElement(args: RemoveElementParams): Promise<ToolResult> {
  return postToOpenCut("/timeline/remove-element", args);
}

/**
 * Đặt transition giữa 2 clip liền kề trên timeline.
 *
 * @param args - SetTransitionParams: element_id, transition_type, duration
 * @returns ToolResult với success flag
 * @sideEffect Gọi POST /timeline/set-transition đến OpenCut-AI
 */
async function handleSetTransition(args: SetTransitionParams): Promise<ToolResult> {
  return postToOpenCut("/timeline/set-transition", args);
}

/**
 * Thêm visual effect vào một element trên timeline.
 *
 * @param args - AddEffectParams: element_id, effect_type, params
 * @returns ToolResult với effect_id của effect mới tạo
 * @sideEffect Gọi POST /effects/add đến OpenCut-AI
 */
async function handleAddEffect(args: AddEffectParams): Promise<ToolResult> {
  return postToOpenCut("/effects/add", args);
}

/**
 * Thêm text subtitle overlay vào text track.
 *
 * @param args - AddSubtitleParams: content, start_time, duration, font_size, color, position
 * @returns ToolResult với element_id của text element mới tạo
 * @sideEffect Gọi POST /timeline/add-subtitle đến OpenCut-AI
 */
async function handleAddSubtitle(args: AddSubtitleParams): Promise<ToolResult> {
  return postToOpenCut("/timeline/add-subtitle", args);
}

/**
 * Chỉnh âm lượng của audio track.
 *
 * @param args - AdjustVolumeParams: track_id, volume (0-2)
 * @returns ToolResult với success flag
 * @sideEffect Gọi POST /timeline/adjust-volume đến OpenCut-AI
 */
async function handleAdjustVolume(args: AdjustVolumeParams): Promise<ToolResult> {
  return postToOpenCut("/timeline/adjust-volume", args);
}

/**
 * Cắt clip thành 2 phần tại vị trí split_time.
 *
 * @param args - SplitClipParams: element_id, split_time (seconds, relative to element start)
 * @returns ToolResult với left_element_id và right_element_id
 * @sideEffect Gọi POST /timeline/split-clip đến OpenCut-AI
 */
async function handleSplitClip(args: SplitClipParams): Promise<ToolResult> {
  return postToOpenCut("/timeline/split-clip", args);
}

/**
 * Export project OpenCut ra file video MP4 hoặc WebM.
 *
 * @param args - ExportVideoParams: project_id, output_format, resolution
 * @returns ToolResult với export_id và status (queued/processing/completed/failed)
 * @sideEffect Gọi POST /export/video đến OpenCut-AI
 */
async function handleExportVideo(args: ExportVideoParams): Promise<ToolResult> {
  return postToOpenCut("/export/video", args);
}

// ── Section: Main Dispatcher ────────────────────────────────────

/**
 * Dispatch một tool call từ AI (Gemini) đến đúng handler và trả về kết quả.
 *
 * Đây là entry point chính: nhận function name + args từ Gemini function calling
 * response, route đến handler tương ứng qua switch exhaustive, gọi OpenCut API,
 * và trả về ToolResult.
 *
 * @param toolCall - Object chứa name (function name) và args (parameters đã parse)
 * @returns ToolResult: { success: boolean, data?, error? }
 * @sideEffect Gửi HTTP POST request đến OpenCut-AI API bridge (localhost:3001)
 *
 * @example
 * ```ts
 * const result = await executeToolCall({
 *   name: "add_clip",
 *   args: { track_id: "t1", media_id: "m1", clip_type: "video", start_time: 0, duration: 5 }
 * });
 * console.log(result.success, result.data?.element_id);
 * ```
 */
export async function executeToolCall(
  toolCall: OpenCutToolParams,
): Promise<ToolResult> {
  switch (toolCall.name) {
    case "add_clip":
      return handleAddClip(toolCall.args);
    case "remove_element":
      return handleRemoveElement(toolCall.args);
    case "set_transition":
      return handleSetTransition(toolCall.args);
    case "add_effect":
      return handleAddEffect(toolCall.args);
    case "add_subtitle":
      return handleAddSubtitle(toolCall.args);
    case "adjust_volume":
      return handleAdjustVolume(toolCall.args);
    case "split_clip":
      return handleSplitClip(toolCall.args);
    case "export_video":
      return handleExportVideo(toolCall.args);
    default: {
      // Exhaustive check: nếu TypeScript không báo lỗi ở đây nghĩa là
      // tất cả các case đã được xử lý (type-safe union exhaustiveness).
      const _exhaustive: never = toolCall;
      return {
        success: false,
        error: `Unknown tool: ${(toolCall as OpenCutToolParams).name}`,
      };
    }
  }
}
