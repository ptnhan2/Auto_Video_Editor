/**
 * OpenCut AI Tool Calling Schemas — Zod + Gemini Function Declarations.
 *
 * Định nghĩa 8 function schemas để Gemini có thể điều khiển OpenCut-AI editor
 * thông qua function calling. Mỗi schema bao gồm:
 *   - Zod validation schema (runtime validation)
 *   - TypeScript type (compile-time type safety, auto-inferred from Zod)
 *   - Gemini function declaration (name + description + JSON Schema parameters)
 *
 * Rule E (AI-First API Design): sử dụng semantic names, strict enums,
 * và high-level mô tả để LLM dễ hiểu và gọi đúng.
 */

import { z } from "zod";

// ── Section: Constants ──────────────────────────────────────────

/** 20 OpenCut transition types (from opencut_integration_guide.md §2.6 TransitionData). */
const TRANSITION_TYPES = [
  "cross-dissolve", "dip-black", "slide-left", "slide-right",
  "wipe-left", "wipe-right", "zoom", "iris-wipe", "clock-wipe",
  "morph", "glitch", "film-burn", "page-peel", "spin", "push",
  "fade-white", "checkerboard", "dissolve-zoom", "band-slide", "cube-spin",
] as const;

/** 9 atmosphere/visual effect types (from Rule K: Atmosphere Effects). */
const EFFECT_TYPES = [
  "blur", "grain", "chromatic", "vignette", "glow",
  "shadow", "halftone", "light-leak", "paper-texture",
] as const;

/** Định dạng output được hỗ trợ khi export. */
const OUTPUT_FORMATS = ["mp4", "webm"] as const;

/** Độ phân giải xuất video. */
const EXPORT_RESOLUTIONS = ["1080p", "720p", "480p"] as const;

/** Loại clip được hỗ trợ khi thêm vào track. */
const CLIP_TYPES = ["video", "audio"] as const;

// ── Section: Parameter Schemas ──────────────────────────────────

/**
 * Schema tham số cho function add_clip.
 * Thêm một video hoặc audio clip vào track trên timeline OpenCut.
 */
export const AddClipParamsSchema = z.object({
  track_id: z
    .string()
    .min(1)
    .describe("Target track ID on the timeline (UUID)."),
  media_id: z
    .string()
    .min(1)
    .describe("Media asset ID in OpenCut storage."),
  clip_type: z
    .enum(CLIP_TYPES)
    .describe("Type of clip to add: video or audio."),
  start_time: z
    .number()
    .min(0)
    .describe("Start position on timeline in seconds."),
  duration: z
    .number()
    .positive()
    .describe("Display duration in seconds."),
  name: z
    .string()
    .optional()
    .describe("Display name shown on timeline."),
  volume: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .describe("Volume level 0-2 (audio clips only, default 1.0)."),
});

/**
 * Schema tham số cho function remove_element.
 * Xóa một element (clip, text, effect) khỏi timeline.
 */
export const RemoveElementParamsSchema = z.object({
  track_id: z
    .string()
    .min(1)
    .describe("Track ID containing the element to remove."),
  element_id: z
    .string()
    .min(1)
    .describe("Element ID to remove from the timeline."),
});

/**
 * Schema tham số cho function set_transition.
 * Đặt hiệu ứng chuyển cảnh giữa 2 clip liền kề trên timeline.
 */
export const SetTransitionParamsSchema = z.object({
  element_id: z
    .string()
    .min(1)
    .describe("Element to set transition on (placed on its transitionOut field)."),
  transition_type: z
    .enum(TRANSITION_TYPES)
    .describe("OpenCut transition type (20 available types)."),
  duration: z
    .number()
    .min(0.1)
    .max(5)
    .optional()
    .describe("Transition duration in seconds (default 0.5)."),
});

/**
 * Schema tham số cho function add_effect.
 * Thêm visual effect (blur, grain, glow...) vào một element trên timeline.
 */
export const AddEffectParamsSchema = z.object({
  element_id: z
    .string()
    .min(1)
    .describe("Target element ID to apply the effect to."),
  effect_type: z
    .enum(EFFECT_TYPES)
    .describe("Effect type identifier (9 available types)."),
  params: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("Effect-specific parameters, e.g. { intensity: 5 }."),
});

/**
 * Schema tham số cho function add_subtitle.
 * Thêm text subtitle overlay vào text track với font, màu, vị trí tùy chỉnh.
 */
export const AddSubtitleParamsSchema = z.object({
  track_id: z
    .string()
    .min(1)
    .describe("Target text track ID."),
  content: z
    .string()
    .min(1)
    .describe("Subtitle text content."),
  start_time: z
    .number()
    .min(0)
    .describe("Start time on timeline in seconds."),
  duration: z
    .number()
    .positive()
    .describe("Display duration in seconds."),
  font_size: z
    .number()
    .min(8)
    .max(200)
    .optional()
    .describe("Font size in pixels (default 48)."),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .describe("Text color in hex format (default #FFFFFF)."),
  position_x: z
    .number()
    .optional()
    .describe("X position on 1920×1080 canvas (default 960 = center)."),
  position_y: z
    .number()
    .optional()
    .describe("Y position on 1920×1080 canvas (default 920 = bottom)."),
});

/**
 * Schema tham số cho function adjust_volume.
 * Chỉnh âm lượng của một audio track (0 = mute, 1 = normal, 2 = doubled).
 */
export const AdjustVolumeParamsSchema = z.object({
  track_id: z
    .string()
    .min(1)
    .describe("Target audio track ID."),
  volume: z
    .number()
    .min(0)
    .max(2)
    .describe("New volume level 0-2 (1.0 = normal)."),
});

/**
 * Schema tham số cho function split_clip.
 * Cắt một clip thành 2 phần tại vị trí thời gian chỉ định.
 */
export const SplitClipParamsSchema = z.object({
  element_id: z
    .string()
    .min(1)
    .describe("Element ID to split."),
  split_time: z
    .number()
    .positive()
    .describe("Split point relative to element start, in seconds."),
});

/**
 * Schema tham số cho function export_video.
 * Export project OpenCut ra file video MP4 hoặc WebM.
 */
export const ExportVideoParamsSchema = z.object({
  project_id: z
    .string()
    .min(1)
    .describe("Project ID to export."),
  output_format: z
    .enum(OUTPUT_FORMATS)
    .optional()
    .describe("Output format (default mp4)."),
  resolution: z
    .enum(EXPORT_RESOLUTIONS)
    .optional()
    .describe("Export resolution (default 1080p)."),
});

// ── Section: TypeScript Types ───────────────────────────────────

/** Parameters for the add_clip tool. */
export type AddClipParams = z.infer<typeof AddClipParamsSchema>;

/** Parameters for the remove_element tool. */
export type RemoveElementParams = z.infer<typeof RemoveElementParamsSchema>;

/** Parameters for the set_transition tool. */
export type SetTransitionParams = z.infer<typeof SetTransitionParamsSchema>;

/** Parameters for the add_effect tool. */
export type AddEffectParams = z.infer<typeof AddEffectParamsSchema>;

/** Parameters for the add_subtitle tool. */
export type AddSubtitleParams = z.infer<typeof AddSubtitleParamsSchema>;

/** Parameters for the adjust_volume tool. */
export type AdjustVolumeParams = z.infer<typeof AdjustVolumeParamsSchema>;

/** Parameters for the split_clip tool. */
export type SplitClipParams = z.infer<typeof SplitClipParamsSchema>;

/** Parameters for the export_video tool. */
export type ExportVideoParams = z.infer<typeof ExportVideoParamsSchema>;

// ── Section: Union Type for Tool Dispatch ───────────────────────

/**
 * Union type của tất cả các tool call.
 * Dùng để type-safe dispatch trong executor với exhaustive check.
 */
export type OpenCutToolParams =
  | { name: "add_clip"; args: AddClipParams }
  | { name: "remove_element"; args: RemoveElementParams }
  | { name: "set_transition"; args: SetTransitionParams }
  | { name: "add_effect"; args: AddEffectParams }
  | { name: "add_subtitle"; args: AddSubtitleParams }
  | { name: "adjust_volume"; args: AdjustVolumeParams }
  | { name: "split_clip"; args: SplitClipParams }
  | { name: "export_video"; args: ExportVideoParams };

// ── Section: Gemini Function Declarations ───────────────────────

/**
 * Gemini Function Declaration format.
 * Mỗi declaration gồm name, description, và parameters (JSON Schema).
 * Dùng trực tiếp với Gemini Function Calling API.
 */
export interface GeminiFunctionDeclaration {
  /** Function name (snake_case) — Gemini gọi function này khi cần. */
  name: string;
  /** 1-2 câu mô tả bằng tiếng Anh để Gemini biết khi nào nên gọi function này. */
  description: string;
  /** JSON Schema object mô tả parameters của function. */
  parameters: Record<string, unknown>;
}

/**
 * Helper: chuyển một Zod schema thành Gemini function declaration.
 * Dùng z.toJSONSchema() (Zod v4) để generate JSON Schema tự động.
 *
 * @param name - Function name (snake_case) cho Gemini function calling.
 * @param description - 1-2 câu mô tả bằng tiếng Anh.
 * @param schema - Zod schema định nghĩa parameters của function.
 * @returns GeminiFunctionDeclaration sẵn sàng đưa vào tool config.
 */
function toGeminiDeclaration(
  name: string,
  description: string,
  schema: z.ZodType<Record<string, unknown>>,
): GeminiFunctionDeclaration {
  const jsonSchema = z.toJSONSchema(schema);
  // Bỏ $schema field (không cần thiết cho Gemini API)
  const { $schema: _schema, ...rest } = jsonSchema as Record<string, unknown> & {
    $schema?: unknown;
  };
  void _schema; // intentionally strip $schema from Gemini parameters
  return { name, description, parameters: rest };
}

/**
 * Danh sách 8 function declarations cho Gemini Function Calling.
 * Import array này và truyền vào Gemini tool config để AI có thể
 * gọi các function điều khiển OpenCut editor.
 *
 * Cách dùng với @google/generative-ai:
 * ```ts
 * const model = genAI.getGenerativeModel({
 *   model: "gemini-2.5-flash",
 *   tools: [{ functionDeclarations: OPENCUT_TOOL_DECLARATIONS }],
 * });
 * ```
 */
export const OPENCUT_TOOL_DECLARATIONS: GeminiFunctionDeclaration[] = [
  toGeminiDeclaration(
    "add_clip",
    "Add a video or audio clip to a specific track on the OpenCut timeline. Use this when the user wants to insert new media into the project.",
    AddClipParamsSchema,
  ),
  toGeminiDeclaration(
    "remove_element",
    "Remove an element (clip, text, effect) from the timeline by its element ID and track ID.",
    RemoveElementParamsSchema,
  ),
  toGeminiDeclaration(
    "set_transition",
    "Set a transition effect between two adjacent clips on the timeline. The transition is applied to the specified element's transitionOut field.",
    SetTransitionParamsSchema,
  ),
  toGeminiDeclaration(
    "add_effect",
    "Apply a visual effect (blur, grain, glow, vignette, etc.) to a video or image element on the timeline.",
    AddEffectParamsSchema,
  ),
  toGeminiDeclaration(
    "add_subtitle",
    "Add a text subtitle overlay to a text track at a specific time position with customizable font, color, and position.",
    AddSubtitleParamsSchema,
  ),
  toGeminiDeclaration(
    "adjust_volume",
    "Adjust the volume level of an audio track. 0.0 = silent, 1.0 = normal, 2.0 = doubled.",
    AdjustVolumeParamsSchema,
  ),
  toGeminiDeclaration(
    "split_clip",
    "Split a clip into two separate clips at a specified time point relative to the clip's start.",
    SplitClipParamsSchema,
  ),
  toGeminiDeclaration(
    "export_video",
    "Export the current OpenCut project to an MP4 or WebM video file at the specified resolution.",
    ExportVideoParamsSchema,
  ),
];
