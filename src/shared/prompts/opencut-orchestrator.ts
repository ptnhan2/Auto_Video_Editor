/**
 * OpenCut AI Video Editor — Orchestration Loop.
 *
 * Điều phối vòng lặp AI: đọc pipeline output (project JSON) → build context
 * (kịch bản + timeline state) → gọi Gemini với system prompt + 8 tools →
 * dispatch tool calls qua executeToolCall() → tổng hợp kết quả cho ReviewPanel.
 *
 * Quy trình:
 *   1. Đọc project JSON từ public/scripts/opencut_{episodeId}.json
 *   2. Build system message (OPENCUT_SYSTEM_PROMPT) + project context + user request
 *   3. Gọi Gemini generateText() với tools → LẶP:
 *      a. Nếu có tool calls → dispatch executeToolCall(), gửi kết quả về Gemini
 *      b. Nếu chỉ có text → dừng loop, trả về final summary
 *   4. Trả về AgentResult cho ReviewPanel (Issue #206)
 */

import { readFile } from "node:fs/promises";
import path from "path";
import { generateText, tool, stepCountIs } from "ai";
import { primaryModel } from "@/shared/api_clients/vercel-ai";
import {
  executeToolCall,
  type ToolResult,
} from "@/shared/api-clients/opencut-tool-executor";
import {
  AddClipParamsSchema,
  RemoveElementParamsSchema,
  SetTransitionParamsSchema,
  AddEffectParamsSchema,
  AddSubtitleParamsSchema,
  AdjustVolumeParamsSchema,
  SplitClipParamsSchema,
  ExportVideoParamsSchema,
  type OpenCutToolParams,
} from "@/shared/types/opencut-tools";
import { OPENCUT_SYSTEM_PROMPT } from "./opencut-system-prompt";
import type { SerializedProject } from "@/shared/api-clients/opencut-bridge";

// ── Section: Types ───────────────────────────────────────────────

/**
 * Một proposed edit được AI tạo ra sau khi chạy tool.
 * Gửi đến ReviewPanel (Issue #206) để user approve/reject.
 */
export interface AgentEdit {
  /** Unique ID cho edit này (dùng để track trong review). */
  id: string;
  /** Loại edit: add, remove, change. */
  type: "add" | "remove" | "change";
  /** Loại element bị ảnh hưởng (video, audio, text, transition, effect). */
  elementType: string;
  /** Mô tả bằng tiếng Việt để user hiểu edit này làm gì. */
  description: string;
  /** Scene ID chứa element (nếu có). */
  sceneId?: string;
  /** Track ID chứa element (nếu có). */
  trackId?: string;
  /** Trạng thái trước khi edit (cho remove/change). */
  before?: unknown;
  /** Trạng thái sau khi edit (cho add/change). */
  after?: unknown;
}

/**
 * Kết quả trả về từ runOpenCutAgent() sau khi orchestration loop hoàn tất.
 * Gồm final summary, danh sách proposed edits, và log tất cả tool results.
 */
export interface AgentResult {
  /** Tổng kết cuối cùng từ AI (1-2 câu tiếng Việt). */
  finalSummary: string;
  /** Danh sách proposed edits — gửi đến ReviewPanel. */
  edits: AgentEdit[];
  /** Tất cả tool results đã thực thi trong loop. */
  toolResults: ToolResult[];
}

// ── Section: Constants ───────────────────────────────────────────

/** Số vòng lặp tối đa để tránh infinite loop. */
export const MAX_ROUNDS = 10;

// ── Section: Helpers ─────────────────────────────────────────────

/**
 * Đọc project JSON từ pipeline S7 output.
 * File được tạo bởi S7 Video Compiler tại public/scripts/opencut_{episodeId}.json.
 *
 * @param episodeId - Episode ID để xác định file JSON pipeline output.
 * @returns Parsed SerializedProject object (OpenCut v10 format).
 * @throws Error nếu file không tồn tại hoặc JSON parse lỗi.
 * @sideEffect Đọc file từ filesystem (public/scripts/).
 */
async function readProjectJson(episodeId: string): Promise<SerializedProject> {
  const filePath = path.join(
    process.cwd(),
    "public",
    "scripts",
    `opencut_${episodeId}.json`,
  );

  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === "ENOENT") {
      throw new Error(
        `Pipeline output not found for episode "${episodeId}". ` +
          `Expected: public/scripts/opencut_${episodeId}.json. ` +
          `Run S7 Video Compiler first.`,
      );
    }
    throw new Error(
      `Failed to read project file: ${(err as Error).message}`,
    );
  }

  try {
    return JSON.parse(raw) as SerializedProject;
  } catch (err) {
    throw new Error(
      `Invalid project JSON for episode "${episodeId}": ${(err as Error).message}`,
    );
  }
}

/**
 * Build context string từ project JSON để gửi cho Gemini.
 * Tóm tắt timeline state: có bao nhiêu scene, track, element, vị trí thời gian.
 * Gemini dùng context này để so sánh với kịch bản và đề xuất chỉnh sửa.
 *
 * @param project - SerializedProject JSON object từ pipeline output.
 * @returns String context mô tả trạng thái timeline hiện tại.
 */
export function buildProjectContext(project: SerializedProject): string {
  const lines: string[] = [];
  lines.push(`## Timeline State: ${project.metadata.name}`);

  let totalElements = 0;
  const scenes =
    (project.scenes as Array<Record<string, unknown>>) ?? [];

  for (const scene of scenes) {
    const sceneName = scene.name ?? scene.id;
    lines.push(`\n### Scene: ${sceneName}`);

    const tracks =
      (scene.tracks as Array<Record<string, unknown>>) ?? [];
    for (const track of tracks) {
      const trackType = track.type ?? "unknown";
      const trackId = track.id;
      const elements =
        (track.elements as Array<Record<string, unknown>>) ?? [];

      totalElements += elements.length;

      if (elements.length === 0) {
        lines.push(`  - Track [${trackType}] ${trackId}: (trống)`);
        continue;
      }

      lines.push(
        `  - Track [${trackType}] ${trackId}: ${elements.length} element(s)`,
      );
      for (const el of elements) {
        const elName = el.name ?? el.id;
        const startTime = el.startTime ?? 0;
        const duration = el.duration ?? "?";
        const extra: string[] = [];
        if (el.volume !== undefined) extra.push(`volume=${el.volume}`);
        if (el.transitionOut)
          extra.push(
            `transition=${(el.transitionOut as Record<string, unknown>)?.type}`,
          );
        if (el.effects)
          extra.push(`effects=${(el.effects as Array<unknown>).length}`);

        const extraStr = extra.length > 0 ? ` [${extra.join(", ")}]` : "";
        lines.push(
          `    - "${elName}" @${startTime}s (${duration}s)${extraStr}`,
        );
      }
    }
  }

  lines.push(
    `\nTổng: ${scenes.length} scene(s), ${totalElements} element(s) trên timeline.`,
  );
  return lines.join("\n");
}

/**
 * Chuyển một tool call từ Gemini sang định dạng AgentEdit để gửi đến ReviewPanel.
 *
 * @param toolName - Tên tool đã được gọi (vd: "add_clip").
 * @param args - Arguments đã parse từ tool call.
 * @param result - Kết quả thực thi tool (từ executeToolCall).
 * @returns AgentEdit object để user review.
 */
function toolCallToEdit(
  toolName: string,
  args: Record<string, unknown>,
  result: ToolResult,
): AgentEdit {
  const editId = `edit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const descriptionMap: Record<
    string,
    { elementType: string; desc: string }
  > = {
    add_clip: {
      elementType: "clip",
      desc: `Thêm ${args.clip_type} clip "${args.name ?? args.media_id}" vào track ${args.track_id}`,
    },
    remove_element: {
      elementType: "element",
      desc: `Xóa element ${args.element_id} khỏi track ${args.track_id}`,
    },
    set_transition: {
      elementType: "transition",
      desc: `Đặt transition ${args.transition_type} cho element ${args.element_id}`,
    },
    add_effect: {
      elementType: "effect",
      desc: `Thêm effect ${args.effect_type} cho element ${args.element_id}`,
    },
    add_subtitle: {
      elementType: "text",
      desc: `Thêm subtitle "${String(args.content).slice(0, 40)}..." vào track ${args.track_id}`,
    },
    adjust_volume: {
      elementType: "audio",
      desc: `Chỉnh âm lượng track ${args.track_id} → ${args.volume}`,
    },
    split_clip: {
      elementType: "clip",
      desc: `Cắt clip ${args.element_id} tại ${args.split_time}s`,
    },
    export_video: {
      elementType: "export",
      desc: `Export project ${args.project_id} → MP4`,
    },
  };

  const info = descriptionMap[toolName] ?? {
    elementType: "unknown",
    desc: `Tool call: ${toolName}`,
  };

  return {
    id: editId,
    type: "add",
    elementType: info.elementType,
    description: info.desc,
    after: result.data ?? undefined,
  };
}

// ── Section: Tool Definitions for Vercel AI SDK ──────────────────

/**
 * Build tool definitions cho Vercel AI SDK generateText() với execute functions.
 * SDK sẽ tự động gọi execute → gửi kết quả về model → loop cho đến khi model
 * không gọi tool nữa hoặc đạt MAX_ROUNDS steps.
 *
 * Mỗi execute wrapper dispatch sang executeToolCall() để gọi OpenCut API,
 * đồng thời ghi nhận kết quả vào edits[] và toolResults[].
 *
 * @param edits - Mutable array để tích lũy AgentEdit.
 * @param toolResults - Mutable array để tích lũy ToolResult.
 * @returns Record<string, Tool> với execute functions cho Vercel AI SDK.
 */
function buildOpenCutToolsWithExecute(
  edits: AgentEdit[],
  toolResults: ToolResult[],
) {
  /** Helper: wrap executeToolCall + ghi nhận edit/result. */
  const wrap = (toolName: string) => ({
    execute: async (args: Record<string, unknown>) => {
      const toolCall: OpenCutToolParams = {
        name: toolName,
        args,
      } as OpenCutToolParams;

      const result = await executeToolCall(toolCall);
      toolResults.push(result);

      const edit = toolCallToEdit(toolName, args, result);
      edits.push(edit);

      return result.success
        ? (result.data ?? { message: "ok" })
        : { error: result.error ?? "Unknown error" };
    },
  });

  return {
    add_clip: tool({
      description:
        "Add a video or audio clip to a specific track on the OpenCut timeline. Use when inserting new media into the project.",
      inputSchema: AddClipParamsSchema,
      ...wrap("add_clip"),
    }),
    remove_element: tool({
      description:
        "Remove an element (clip, text, effect) from the timeline by its element ID and track ID.",
      inputSchema: RemoveElementParamsSchema,
      ...wrap("remove_element"),
    }),
    set_transition: tool({
      description:
        "Set a transition effect between two adjacent clips on the timeline. The transition is applied to the specified element's transitionOut field.",
      inputSchema: SetTransitionParamsSchema,
      ...wrap("set_transition"),
    }),
    add_effect: tool({
      description:
        "Apply a visual effect (blur, grain, glow, vignette, etc.) to a video or image element on the timeline.",
      inputSchema: AddEffectParamsSchema,
      ...wrap("add_effect"),
    }),
    add_subtitle: tool({
      description:
        "Add a text subtitle overlay to a text track at a specific time position with customizable font, color, and position.",
      inputSchema: AddSubtitleParamsSchema,
      ...wrap("add_subtitle"),
    }),
    adjust_volume: tool({
      description:
        "Adjust the volume level of an audio track. 0.0 = silent, 1.0 = normal, 2.0 = doubled.",
      inputSchema: AdjustVolumeParamsSchema,
      ...wrap("adjust_volume"),
    }),
    split_clip: tool({
      description:
        "Split a clip into two separate clips at a specified time point relative to the clip's start.",
      inputSchema: SplitClipParamsSchema,
      ...wrap("split_clip"),
    }),
    export_video: tool({
      description:
        "Export the current OpenCut project to an MP4 or WebM video file at the specified resolution.",
      inputSchema: ExportVideoParamsSchema,
      ...wrap("export_video"),
    }),
  };
}

// ── Section: Main Orchestrator ───────────────────────────────────

/**
 * Chạy AI Video Editor agent cho một episode.
 *
 * Đây là entry point chính: đọc pipeline output, build context, gọi Gemini
 * với system prompt + 8 tools, dispatch tool calls, và trả về final plan
 * cho ReviewPanel (Issue #206).
 *
 * @param episodeId - Episode ID để đọc file pipeline output public/scripts/opencut_{id}.json.
 * @param userRequest - Yêu cầu của user (vd: "Hoàn thiện timeline", "Thêm transition cho tất cả scene").
 * @returns AgentResult với finalSummary, proposed edits, và tool results log.
 * @throws Error nếu episodeId hoặc userRequest rỗng, hoặc pipeline output không tồn tại.
 * @sideEffect
 *   - Đọc file từ filesystem (public/scripts/).
 *   - Gọi Gemini API (Google Generative AI) qua Vercel AI SDK.
 *   - Gọi OpenCut-AI REST API (localhost:3001) qua executeToolCall().
 */
export async function runOpenCutAgent(
  episodeId: string,
  userRequest: string,
): Promise<AgentResult> {
  // ── Validate input ──
  const trimmedEpisodeId = episodeId.trim();
  const trimmedRequest = userRequest.trim();

  if (trimmedEpisodeId.length === 0) {
    throw new Error("episodeId is required and must not be empty.");
  }
  if (trimmedRequest.length === 0) {
    throw new Error("userRequest is required and must not be empty.");
  }

  // ── Bước 1: Đọc pipeline output ──
  const projectJson = await readProjectJson(trimmedEpisodeId);
  const projectContext = buildProjectContext(projectJson);

  // ── Bước 2: Build system prompt ──
  const systemMessage = `${OPENCUT_SYSTEM_PROMPT}\n\n${projectContext}`;

  const edits: AgentEdit[] = [];
  const toolResults: ToolResult[] = [];
  let finalText = "";

  // ── Bước 3: Orchestration — để Vercel AI SDK tự loop tool calling ──
  // SDK sẽ tự gọi generateText → execute tools → gửi kết quả → repeat
  // cho đến khi model không gọi tool nữa hoặc đạt MAX_ROUNDS steps.
  try {
    const response = await generateText({
      model: primaryModel,
      system: systemMessage,
      prompt: trimmedRequest,
      tools: buildOpenCutToolsWithExecute(edits, toolResults),
      stopWhen: stepCountIs(MAX_ROUNDS),
    });

    finalText = response.text;
  } catch (err) {
    // Nếu Gemini hoặc tool execution lỗi, trả về những gì đã làm được
    const errorMsg = err instanceof Error ? err.message : String(err);
    finalText = `Lỗi trong quá trình xử lý: ${errorMsg}. Đã thực thi ${toolResults.length} tool call(s), ${edits.length} edit(s) được đề xuất.`;
  }

  // ── Fallback nếu loop hết mà không có final text ──
  if (!finalText && edits.length > 0) {
    finalText = `Đã chạy ${MAX_ROUNDS} vòng và đề xuất ${edits.length} thay đổi. Vui lòng kiểm tra ReviewPanel để duyệt.`;
  } else if (!finalText) {
    finalText = "Không có thay đổi nào được đề xuất. Timeline có thể đã hoàn thiện.";
  }

  return {
    finalSummary: finalText,
    edits,
    toolResults,
  };
}
