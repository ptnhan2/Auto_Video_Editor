/**
 * Unit tests cho OPENCUT_SYSTEM_PROMPT.
 *
 * Kiểm tra: prompt không rỗng, chứa tất cả tên tool, chứa quy tắc review,
 * chứa hướng dẫn chọn transition/effect, chứa định dạng output.
 */

import { describe, it, expect } from "vitest";
import { OPENCUT_SYSTEM_PROMPT } from "../opencut-system-prompt";

// ── Section: OPENCUT_SYSTEM_PROMPT ───────────────────────────────

describe("OPENCUT_SYSTEM_PROMPT", () => {
  it("is non-empty string longer than 500 chars", () => {
    expect(typeof OPENCUT_SYSTEM_PROMPT).toBe("string");
    expect(OPENCUT_SYSTEM_PROMPT.length).toBeGreaterThan(500);
  });

  it("mentions all 8 tool names", () => {
    const toolNames = [
      "add_clip", "remove_element", "set_transition",
      "add_effect", "add_subtitle", "adjust_volume",
      "split_clip", "export_video",
    ];
    for (const name of toolNames) {
      expect(OPENCUT_SYSTEM_PROMPT).toContain(name);
    }
  });

  it("mentions review-before-apply rule", () => {
    expect(OPENCUT_SYSTEM_PROMPT).toMatch(/review|duyệt|approve/i);
  });

  it("contains transition selection guidance", () => {
    expect(OPENCUT_SYSTEM_PROMPT).toMatch(
      /transition|cross-dissolve|mood|tempo|chuyển cảnh/i,
    );
  });

  it("contains effect selection guidance", () => {
    expect(OPENCUT_SYSTEM_PROMPT).toMatch(
      /effect|blur|grain|atmosphere|không khí/i,
    );
  });

  it("specifies output format (explanation + function call)", () => {
    expect(OPENCUT_SYSTEM_PROMPT).toMatch(
      /function call|tool call|giải thích|explain/i,
    );
  });

  it("is exportable and importable as constant", () => {
    // Already verified by import above not throwing
    expect(OPENCUT_SYSTEM_PROMPT).toBeDefined();
  });
});
