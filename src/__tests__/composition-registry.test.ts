// ✏️ EDIT ZONE START
import { describe, it, expect } from "vitest";
import { COMPOSITIONS } from "@/ui/composition-registry";

// ---------------------------------------------------------------------------
// Tests: Composition registry — completeness & data integrity
// ---------------------------------------------------------------------------

describe("composition-registry — completeness", () => {
  it("has exactly 6 composition entries", () => {
    expect(COMPOSITIONS).toHaveLength(6);
  });

  it("every entry has a non-empty id", () => {
    for (const comp of COMPOSITIONS) {
      expect(comp.id, `Entry with label "${comp.label}" has empty id`).toBeTruthy();
    }
  });

  it("every entry has a non-empty label", () => {
    for (const comp of COMPOSITIONS) {
      expect(comp.label, `Entry with id "${comp.id}" has empty label`).toBeTruthy();
    }
  });

  it("every id is unique", () => {
    const ids = COMPOSITIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("composition-registry — metadata accuracy", () => {
  it.each([
    ["AutoVideoEditor", 1920, 1080, 30, 300],
    ["PuppetPreview", 1080, 1920, 30, 300],
    ["ActionSequence", 1080, 1920, 30, 600],
    ["ExpressionTest", 500, 500, 30, 150],
    ["AIStoryCompiler", 1920, 1080, 30, 600],
    ["WaddleEngineTest", 1920, 1080, 30, 300],
  ])(
    '"%s" has width=%i, height=%i, fps=%i, duration=%i',
    (id, width, height, fps, duration) => {
      const comp = COMPOSITIONS.find((c) => c.id === id);
      expect(comp).toBeDefined();
      expect(comp!.width).toBe(width);
      expect(comp!.height).toBe(height);
      expect(comp!.fps).toBe(fps);
      expect(comp!.durationInFrames).toBe(duration);
    },
  );
});

describe("composition-registry — component import function", () => {
  it("every entry has a component function", () => {
    for (const comp of COMPOSITIONS) {
      expect(typeof comp.component).toBe("function");
    }
  });

  it("component function returns a Promise (catch to prevent unhandled rejection)", async () => {
    for (const comp of COMPOSITIONS) {
      const result = comp.component();
      expect(result).toBeInstanceOf(Promise);
      // Catch rejection — remotion imports can't resolve in vitest/jsdom,
      // but we only care that the function returns a Promise
      await result.catch(() => {});
    }
  });
});

describe("composition-registry — lookup by id", () => {
  it("finds existing composition by id", () => {
    const main = COMPOSITIONS.find((c) => c.id === "AutoVideoEditor");
    expect(main).toBeDefined();
    expect(main!.label).toBe("Main (1920×1080)");
  });

  it("returns undefined for non-existent composition id", () => {
    const notFound = COMPOSITIONS.find((c) => c.id === "NonExistent");
    expect(notFound).toBeUndefined();
  });
});
// ✏️ EDIT ZONE END
