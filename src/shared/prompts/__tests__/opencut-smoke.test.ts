/**
 * SMOKE INTEGRATION TEST — OpenCut System Prompt + Orchestrator.
 *
 * Kiểm tra sâu logic nội bộ mà KHÔNG cần API key hoặc OpenCut-AI đang chạy.
 * Các test này validate code hoạt động đúng trước khi deploy thực tế.
 *
 * Không mock — dùng code thật, data thật (JSON fixture).
 *
 * PREREQUISITES: Không có. Chạy được mọi lúc.
 * FULL INTEGRATION TEST: Cần GOOGLE_GENERATIVE_AI_API_KEY + OpenCut-AI port 3001
 *                        → TODO(#205): opencut-live-integration.test.ts
 */

import { describe, it, expect } from "vitest";
import { ZodError } from "zod";
import {
  AddClipParamsSchema,
  RemoveElementParamsSchema,
  SetTransitionParamsSchema,
  AddEffectParamsSchema,
  AddSubtitleParamsSchema,
  AdjustVolumeParamsSchema,
  SplitClipParamsSchema,
  ExportVideoParamsSchema,
  OPENCUT_TOOL_DECLARATIONS,
} from "@/shared/types/opencut-tools";
import {
  buildProjectContext,
  MAX_ROUNDS,
  type AgentEdit,
  type AgentResult,
} from "../opencut-orchestrator";
import { OPENCUT_SYSTEM_PROMPT } from "../opencut-system-prompt";
import type { SerializedProject } from "@/shared/api-clients/opencut-bridge";

// ── Section: Fixtures ────────────────────────────────────────────

/** Project JSON rỗng — chưa có scene nào. */
const emptyProject: SerializedProject = {
  metadata: { id: "empty-001", name: "Empty Project" },
  scenes: [],
  currentSceneId: "",
  settings: {},
  version: 10,
};

/** Project JSON có 1 scene, 1 track, 0 element. */
const noElementsProject: SerializedProject = {
  metadata: { id: "noel-001", name: "No Elements Project" },
  scenes: [
    {
      id: "scene-1",
      name: "Opening",
      tracks: [{ id: "track-video", type: "video", elements: [] }],
    },
  ],
  currentSceneId: "scene-1",
  settings: {},
  version: 10,
};

/** Project JSON đầy đủ — 2 scenes, nhiều tracks và elements. */
const fullProject: SerializedProject = {
  metadata: { id: "full-001", name: "Full Project" },
  scenes: [
    {
      id: "scene-1",
      name: "Opening",
      tracks: [
        {
          id: "track-video-1",
          type: "video",
          elements: [
            { id: "elem-1", name: "intro.mp4", type: "video", startTime: 0, duration: 5 },
            { id: "elem-2", name: "title.mp4", type: "video", startTime: 5, duration: 3 },
          ],
        },
        {
          id: "track-audio-1",
          type: "audio",
          elements: [
            { id: "elem-bgm", name: "bgm.mp3", type: "audio", startTime: 0, duration: 8, volume: 0.7 },
          ],
        },
      ],
    },
    {
      id: "scene-2",
      name: "Dialogue",
      tracks: [
        {
          id: "track-video-2",
          type: "video",
          elements: [
            { id: "elem-3", name: "dialogue.mp4", type: "video", startTime: 8, duration: 10 },
          ],
        },
        {
          id: "track-text-1",
          type: "text",
          elements: [
            { id: "elem-sub1", name: "Sub 1", type: "text", startTime: 8, duration: 5, content: "Xin chào" },
            { id: "elem-sub2", name: "Sub 2", type: "text", startTime: 13, duration: 5, content: "Tạm biệt" },
          ],
        },
      ],
    },
  ],
  currentSceneId: "scene-1",
  settings: {},
  version: 10,
};

/** Project với transition + effect — kiểm tra extra info trong context. */
const projectWithEffects: SerializedProject = {
  metadata: { id: "fx-001", name: "Effects Project" },
  scenes: [
    {
      id: "scene-1",
      name: "Cinematic",
      tracks: [
        {
          id: "track-video",
          type: "video",
          elements: [
            {
              id: "elem-1",
              name: "shot.mp4",
              type: "video",
              startTime: 0,
              duration: 8,
              transitionOut: { type: "cross-dissolve", duration: 0.5 },
              effects: [{ type: "grain", intensity: 3 }],
            },
          ],
        },
      ],
    },
  ],
  currentSceneId: "scene-1",
  settings: {},
  version: 10,
};

// ── Section: buildProjectContext edge cases ──────────────────────

describe("buildProjectContext — edge cases", () => {
  it("handles empty project (no scenes)", () => {
    const ctx = buildProjectContext(emptyProject);
    expect(ctx).toContain("Empty Project");
    expect(ctx).toContain("0 scene(s)");
    expect(ctx).toContain("0 element(s)");
  });

  it("handles project with empty tracks", () => {
    const ctx = buildProjectContext(noElementsProject);
    expect(ctx).toContain("No Elements Project");
    expect(ctx).toContain("(trống)");
    expect(ctx).toContain("0 element(s)");
  });

  it("counts elements correctly in full project", () => {
    const ctx = buildProjectContext(fullProject);
    // 2 video + 1 audio + 2 text = 6 elements (text elements are also counted)
    expect(ctx).toContain("6 element(s)");
  });

  it("includes transition and effect info", () => {
    const ctx = buildProjectContext(projectWithEffects);
    expect(ctx).toContain("transition=cross-dissolve");
    expect(ctx).toContain("effects=1");
  });

  it("handles project with null/undefined scenes (defensive)", () => {
    const badProject = { metadata: { id: "x", name: "X" }, scenes: null, currentSceneId: "", settings: {}, version: 10 } as unknown as SerializedProject;
    const ctx = buildProjectContext(badProject);
    // Should not throw, should produce something
    expect(typeof ctx).toBe("string");
    expect(ctx.length).toBeGreaterThan(0);
  });

  it("handles project with tracks containing null/undefined elements", () => {
    const badProject: SerializedProject = {
      metadata: { id: "x", name: "X" },
      scenes: [{ id: "s1", name: "S1", tracks: [{ id: "t1", type: "video", elements: null as unknown as unknown[] }] }],
      currentSceneId: "s1",
      settings: {},
      version: 10,
    };
    const ctx = buildProjectContext(badProject);
    expect(ctx).toContain("0 element(s)");
  });

  it("output is deterministic (same input → same output)", () => {
    const ctx1 = buildProjectContext(fullProject);
    const ctx2 = buildProjectContext(fullProject);
    expect(ctx1).toBe(ctx2);
  });
});

// ── Section: Zod Schema Compatibility ────────────────────────────

describe("OpenCut Tool Schemas — Zod validation", () => {
  it("add_clip rejects missing track_id", () => {
    expect(() =>
      AddClipParamsSchema.parse({ media_id: "m1", clip_type: "video", start_time: 0, duration: 5 }),
    ).toThrow(ZodError);
  });

  it("add_clip rejects invalid clip_type", () => {
    expect(() =>
      AddClipParamsSchema.parse({ track_id: "t1", media_id: "m1", clip_type: "image", start_time: 0, duration: 5 }),
    ).toThrow(ZodError);
  });

  it("add_clip rejects negative start_time", () => {
    expect(() =>
      AddClipParamsSchema.parse({ track_id: "t1", media_id: "m1", clip_type: "video", start_time: -1, duration: 5 }),
    ).toThrow(ZodError);
  });

  it("add_clip accepts audio clip with volume", () => {
    const result = AddClipParamsSchema.parse({
      track_id: "t1", media_id: "m1", clip_type: "audio", start_time: 0, duration: 5, volume: 0.8,
    });
    expect(result.volume).toBe(0.8);
  });

  it("set_transition rejects invalid transition_type", () => {
    expect(() =>
      SetTransitionParamsSchema.parse({ element_id: "e1", transition_type: "invalid-transition" }),
    ).toThrow(ZodError);
  });

  it("set_transition accepts valid transition with duration", () => {
    const result = SetTransitionParamsSchema.parse({
      element_id: "e1", transition_type: "cross-dissolve", duration: 1.5,
    });
    expect(result.duration).toBe(1.5);
  });

  it("add_effect rejects invalid effect_type", () => {
    expect(() =>
      AddEffectParamsSchema.parse({ element_id: "e1", effect_type: "invalid-effect" }),
    ).toThrow(ZodError);
  });

  it("add_subtitle rejects empty content", () => {
    expect(() =>
      AddSubtitleParamsSchema.parse({ track_id: "t1", content: "", start_time: 0, duration: 5 }),
    ).toThrow(ZodError);
  });

  it("add_subtitle rejects invalid color format", () => {
    expect(() =>
      AddSubtitleParamsSchema.parse({ track_id: "t1", content: "Hi", start_time: 0, duration: 5, color: "red" }),
    ).toThrow(ZodError);
  });

  it("add_subtitle accepts valid hex color", () => {
    const result = AddSubtitleParamsSchema.parse({
      track_id: "t1", content: "Hi", start_time: 0, duration: 5, color: "#FF0000",
    });
    expect(result.color).toBe("#FF0000");
  });

  it("adjust_volume rejects volume > 2", () => {
    expect(() =>
      AdjustVolumeParamsSchema.parse({ track_id: "t1", volume: 3 }),
    ).toThrow(ZodError);
  });

  it("split_clip rejects zero split_time", () => {
    expect(() =>
      SplitClipParamsSchema.parse({ element_id: "e1", split_time: 0 }),
    ).toThrow(ZodError);
  });

  it("export_video accepts optional format and resolution", () => {
    const result = ExportVideoParamsSchema.parse({ project_id: "p1" });
    expect(result.output_format).toBeUndefined();
    expect(result.resolution).toBeUndefined();
  });

  it("export_video accepts full params", () => {
    const result = ExportVideoParamsSchema.parse({
      project_id: "p1", output_format: "mp4", resolution: "1080p",
    });
    expect(result.output_format).toBe("mp4");
    expect(result.resolution).toBe("1080p");
  });
});

// ── Section: Gemini Function Declarations ────────────────────────

describe("OPENCUT_TOOL_DECLARATIONS", () => {
  it("has exactly 8 declarations", () => {
    expect(OPENCUT_TOOL_DECLARATIONS).toHaveLength(8);
  });

  it("each declaration has name, description, parameters", () => {
    for (const decl of OPENCUT_TOOL_DECLARATIONS) {
      expect(decl).toHaveProperty("name");
      expect(decl).toHaveProperty("description");
      expect(decl).toHaveProperty("parameters");
      expect(typeof decl.name).toBe("string");
      expect(typeof decl.description).toBe("string");
      expect(typeof decl.parameters).toBe("object");
    }
  });

  it("all names are snake_case and unique", () => {
    const names = OPENCUT_TOOL_DECLARATIONS.map((d) => d.name);
    const unique = new Set(names);
    expect(unique.size).toBe(8);
    for (const name of names) {
      expect(name).toMatch(/^[a-z_]+$/);
    }
  });

  it("parameters is a valid JSON Schema (has type field)", () => {
    for (const decl of OPENCUT_TOOL_DECLARATIONS) {
      const params = decl.parameters as Record<string, unknown>;
      // Zod toJSONSchema produces { type: "object", properties: {...}, required: [...] }
      expect(params.type).toBe("object");
      expect(params).toHaveProperty("properties");
      expect(params.properties).toBeTypeOf("object");
    }
  });

  it("each tool has a distinct description (not copy-paste)", () => {
    const descriptions = OPENCUT_TOOL_DECLARATIONS.map((d) => d.description);
    const unique = new Set(descriptions);
    expect(unique.size).toBe(8);
  });
});

// ── Section: System Prompt Quality ───────────────────────────────

describe("OPENCUT_SYSTEM_PROMPT — quality checks", () => {
  it("contains all 20 transition types", () => {
    const transitions = [
      "cross-dissolve", "dip-black", "slide-left", "slide-right",
      "wipe-left", "wipe-right", "zoom", "iris-wipe", "clock-wipe",
      "morph", "glitch", "film-burn", "page-peel", "spin", "push",
      "fade-white", "checkerboard", "dissolve-zoom", "band-slide", "cube-spin",
    ];
    for (const t of transitions) {
      expect(OPENCUT_SYSTEM_PROMPT).toContain(t);
    }
  });

  it("contains all 9 effect types", () => {
    const effects = [
      "blur", "grain", "chromatic", "vignette", "glow",
      "shadow", "halftone", "light-leak", "paper-texture",
    ];
    for (const e of effects) {
      expect(OPENCUT_SYSTEM_PROMPT).toContain(e);
    }
  });

  it("has mood-based transition selection table", () => {
    // Check content without dotAll flag (/s) — use [\s\S] instead
    const prompt = OPENCUT_SYSTEM_PROMPT;
    expect(prompt).toMatch(/Nhẹ nhàng[\s\S]*cross-dissolve/);
    expect(prompt).toMatch(/Nhanh[\s\S]*hành động[\s\S]*slide/);
    expect(prompt).toMatch(/Kịch tính[\s\S]*bất ngờ[\s\S]*zoom/);
  });

  it("has atmosphere-based effect selection table", () => {
    const prompt = OPENCUT_SYSTEM_PROMPT;
    expect(prompt).toMatch(/Hoài niệm[\s\S]*grain/);
    expect(prompt).toMatch(/Căng thẳng[\s\S]*chromatic/);
    expect(prompt).toMatch(/Mộng mơ[\s\S]*blur/);
  });

  it("limits to 5 function calls per turn", () => {
    expect(OPENCUT_SYSTEM_PROMPT).toContain("5 function calls");
  });

  it("asks user before export", () => {
    expect(OPENCUT_SYSTEM_PROMPT).toMatch(/Không tự ý export|không.*export.*chưa.*yêu cầu/i);
  });
});

// ── Section: MAX_ROUNDS ──────────────────────────────────────────

describe("MAX_ROUNDS", () => {
  it("is within safe range (1-20)", () => {
    expect(MAX_ROUNDS).toBeGreaterThanOrEqual(1);
    expect(MAX_ROUNDS).toBeLessThanOrEqual(20);
  });

  it("is 10 by default", () => {
    expect(MAX_ROUNDS).toBe(10);
  });
});

// ── Section: Constraint: no hardcoded secrets/URLs ───────────────

describe("No hardcoded secrets", () => {
  it("system prompt does not contain API key patterns", () => {
    expect(OPENCUT_SYSTEM_PROMPT).not.toMatch(/AIza[0-9A-Za-z\-_]{35}/);
    expect(OPENCUT_SYSTEM_PROMPT).not.toMatch(/sk-[0-9a-f]{20,}/);
  });

  it("system prompt does not contain localhost URLs (that's for executor, not prompt)", () => {
    expect(OPENCUT_SYSTEM_PROMPT).not.toContain("localhost");
  });
});
