/**
 * Unit tests cho OpenCut AI Tool Calling Schemas.
 *
 * Kiểm tra: Zod schema validation (accept/reject), Gemini function declarations,
 * TypeScript type inference, và z.toJSONSchema() output format.
 */

import { describe, it, expect } from "vitest";
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
} from "./opencut-tools";

// ── Section: add_clip ────────────────────────────────────────────

describe("AddClipParamsSchema", () => {
  const validInput = {
    track_id: "track-video-001",
    media_id: "media-video-shot1",
    clip_type: "video" as const,
    start_time: 10.5,
    duration: 5.0,
  };

  it("accepts valid video clip params", () => {
    const result = AddClipParamsSchema.parse(validInput);
    expect(result.clip_type).toBe("video");
    expect(result.start_time).toBe(10.5);
  });

  it("accepts valid audio clip params with volume", () => {
    const result = AddClipParamsSchema.parse({
      ...validInput,
      clip_type: "audio" as const,
      volume: 0.8,
    });
    expect(result.volume).toBe(0.8);
  });

  it("accepts optional name field", () => {
    const result = AddClipParamsSchema.parse({
      ...validInput,
      name: "My Clip",
    });
    expect(result.name).toBe("My Clip");
  });

  it("rejects missing required fields", () => {
    expect(() => AddClipParamsSchema.parse({})).toThrow();
  });

  it("rejects invalid clip_type", () => {
    expect(() =>
      AddClipParamsSchema.parse({ ...validInput, clip_type: "text" }),
    ).toThrow();
  });

  it("rejects negative start_time", () => {
    expect(() =>
      AddClipParamsSchema.parse({ ...validInput, start_time: -1 }),
    ).toThrow();
  });

  it("rejects zero or negative duration", () => {
    expect(() =>
      AddClipParamsSchema.parse({ ...validInput, duration: 0 }),
    ).toThrow();
  });

  it("rejects volume out of range", () => {
    expect(() =>
      AddClipParamsSchema.parse({
        ...validInput,
        clip_type: "audio",
        volume: 5.0,
      }),
    ).toThrow();
  });
});

// ── Section: remove_element ──────────────────────────────────────

describe("RemoveElementParamsSchema", () => {
  it("accepts valid params", () => {
    const result = RemoveElementParamsSchema.parse({
      track_id: "track-001",
      element_id: "elem-001",
    });
    expect(result.track_id).toBe("track-001");
  });

  it("rejects missing element_id", () => {
    expect(() =>
      RemoveElementParamsSchema.parse({ track_id: "track-001" }),
    ).toThrow();
  });
});

// ── Section: set_transition ──────────────────────────────────────

describe("SetTransitionParamsSchema", () => {
  it("accepts valid transition params", () => {
    const result = SetTransitionParamsSchema.parse({
      element_id: "elem-001",
      transition_type: "cross-dissolve",
    });
    expect(result.transition_type).toBe("cross-dissolve");
  });

  it("accepts all 20 transition types", () => {
    const allTypes = [
      "cross-dissolve", "dip-black", "slide-left", "slide-right",
      "wipe-left", "wipe-right", "zoom", "iris-wipe", "clock-wipe",
      "morph", "glitch", "film-burn", "page-peel", "spin", "push",
      "fade-white", "checkerboard", "dissolve-zoom", "band-slide", "cube-spin",
    ];
    for (const t of allTypes) {
      const result = SetTransitionParamsSchema.parse({
        element_id: "elem-001",
        transition_type: t,
      });
      expect(result.transition_type).toBe(t);
    }
  });

  it("accepts optional duration", () => {
    const result = SetTransitionParamsSchema.parse({
      element_id: "elem-001",
      transition_type: "dip-black",
      duration: 1.5,
    });
    expect(result.duration).toBe(1.5);
  });

  it("rejects invalid transition type", () => {
    expect(() =>
      SetTransitionParamsSchema.parse({
        element_id: "elem-001",
        transition_type: "invalid-type",
      }),
    ).toThrow();
  });
});

// ── Section: add_effect ──────────────────────────────────────────

describe("AddEffectParamsSchema", () => {
  it("accepts valid effect params", () => {
    const result = AddEffectParamsSchema.parse({
      element_id: "elem-001",
      effect_type: "blur",
    });
    expect(result.effect_type).toBe("blur");
  });

  it("accepts all 9 effect types", () => {
    const allTypes = [
      "blur", "grain", "chromatic", "vignette", "glow",
      "shadow", "halftone", "light-leak", "paper-texture",
    ];
    for (const t of allTypes) {
      const result = AddEffectParamsSchema.parse({
        element_id: "elem-001",
        effect_type: t,
      });
      expect(result.effect_type).toBe(t);
    }
  });

  it("accepts optional params object", () => {
    const result = AddEffectParamsSchema.parse({
      element_id: "elem-001",
      effect_type: "blur",
      params: { intensity: 5, radius: 10 },
    });
    expect(result.params).toEqual({ intensity: 5, radius: 10 });
  });

  it("rejects invalid effect type", () => {
    expect(() =>
      AddEffectParamsSchema.parse({
        element_id: "elem-001",
        effect_type: "invalid",
      }),
    ).toThrow();
  });
});

// ── Section: add_subtitle ────────────────────────────────────────

describe("AddSubtitleParamsSchema", () => {
  const validInput = {
    track_id: "track-text-001",
    content: "Hello World",
    start_time: 0,
    duration: 3.0,
  };

  it("accepts valid subtitle params", () => {
    const result = AddSubtitleParamsSchema.parse(validInput);
    expect(result.content).toBe("Hello World");
  });

  it("accepts optional font_size and color", () => {
    const result = AddSubtitleParamsSchema.parse({
      ...validInput,
      font_size: 72,
      color: "#FF0000",
    });
    expect(result.font_size).toBe(72);
    expect(result.color).toBe("#FF0000");
  });

  it("accepts optional position coordinates", () => {
    const result = AddSubtitleParamsSchema.parse({
      ...validInput,
      position_x: 960,
      position_y: 920,
    });
    expect(result.position_x).toBe(960);
    expect(result.position_y).toBe(920);
  });

  it("rejects empty content", () => {
    expect(() =>
      AddSubtitleParamsSchema.parse({ ...validInput, content: "" }),
    ).toThrow();
  });

  it("rejects invalid hex color", () => {
    expect(() =>
      AddSubtitleParamsSchema.parse({ ...validInput, color: "red" }),
    ).toThrow();
  });

  it("rejects negative start_time", () => {
    expect(() =>
      AddSubtitleParamsSchema.parse({ ...validInput, start_time: -1 }),
    ).toThrow();
  });
});

// ── Section: adjust_volume ───────────────────────────────────────

describe("AdjustVolumeParamsSchema", () => {
  it("accepts valid volume params", () => {
    const result = AdjustVolumeParamsSchema.parse({
      track_id: "track-audio-001",
      volume: 0.5,
    });
    expect(result.volume).toBe(0.5);
  });

  it("accepts boundary values 0 and 2", () => {
    expect(AdjustVolumeParamsSchema.parse({ track_id: "t", volume: 0 }).volume).toBe(0);
    expect(AdjustVolumeParamsSchema.parse({ track_id: "t", volume: 2 }).volume).toBe(2);
  });

  it("rejects volume below 0", () => {
    expect(() =>
      AdjustVolumeParamsSchema.parse({ track_id: "t", volume: -0.1 }),
    ).toThrow();
  });

  it("rejects volume above 2", () => {
    expect(() =>
      AdjustVolumeParamsSchema.parse({ track_id: "t", volume: 2.1 }),
    ).toThrow();
  });
});

// ── Section: split_clip ──────────────────────────────────────────

describe("SplitClipParamsSchema", () => {
  it("accepts valid split params", () => {
    const result = SplitClipParamsSchema.parse({
      element_id: "elem-001",
      split_time: 3.5,
    });
    expect(result.split_time).toBe(3.5);
  });

  it("rejects zero or negative split_time", () => {
    expect(() =>
      SplitClipParamsSchema.parse({ element_id: "e", split_time: 0 }),
    ).toThrow();
    expect(() =>
      SplitClipParamsSchema.parse({ element_id: "e", split_time: -1 }),
    ).toThrow();
  });
});

// ── Section: export_video ────────────────────────────────────────

describe("ExportVideoParamsSchema", () => {
  it("accepts valid export params", () => {
    const result = ExportVideoParamsSchema.parse({ project_id: "proj-001" });
    expect(result.project_id).toBe("proj-001");
  });

  it("accepts optional output_format and resolution", () => {
    const result = ExportVideoParamsSchema.parse({
      project_id: "proj-001",
      output_format: "webm",
      resolution: "720p",
    });
    expect(result.output_format).toBe("webm");
    expect(result.resolution).toBe("720p");
  });

  it("rejects invalid output_format", () => {
    expect(() =>
      ExportVideoParamsSchema.parse({ project_id: "p", output_format: "gif" }),
    ).toThrow();
  });

  it("rejects invalid resolution", () => {
    expect(() =>
      ExportVideoParamsSchema.parse({ project_id: "p", resolution: "4k" }),
    ).toThrow();
  });
});

// ── Section: Gemini Function Declarations ────────────────────────

describe("OPENCUT_TOOL_DECLARATIONS", () => {
  it("contains exactly 8 function declarations", () => {
    expect(OPENCUT_TOOL_DECLARATIONS).toHaveLength(8);
  });

  it("each declaration has name, description, and parameters", () => {
    for (const decl of OPENCUT_TOOL_DECLARATIONS) {
      expect(decl).toHaveProperty("name");
      expect(decl).toHaveProperty("description");
      expect(decl).toHaveProperty("parameters");
      expect(typeof decl.name).toBe("string");
      expect(typeof decl.description).toBe("string");
      expect(typeof decl.parameters).toBe("object");
    }
  });

  it("all function names use snake_case", () => {
    const names = OPENCUT_TOOL_DECLARATIONS.map((d) => d.name);
    for (const name of names) {
      expect(name).toMatch(/^[a-z][a-z_]+$/);
    }
  });

  it("all function names are unique", () => {
    const names = OPENCUT_TOOL_DECLARATIONS.map((d) => d.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("parameters is a valid JSON Schema object with type and properties", () => {
    for (const decl of OPENCUT_TOOL_DECLARATIONS) {
      const params = decl.parameters as Record<string, unknown>;
      expect(params.type).toBe("object");
      expect(params.properties).toBeTruthy();
      expect(typeof params.properties).toBe("object");
    }
  });

  it("function names match expected set", () => {
    const names = OPENCUT_TOOL_DECLARATIONS.map((d) => d.name).sort();
    expect(names).toEqual([
      "add_clip",
      "add_effect",
      "add_subtitle",
      "adjust_volume",
      "export_video",
      "remove_element",
      "set_transition",
      "split_clip",
    ]);
  });
});
