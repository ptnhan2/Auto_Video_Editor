import { TripleScriptEngine } from "./triple-script-engine";
import { describe, test, expect, vi, beforeEach, Mock, afterAll } from "vitest";
import { generateObject } from "ai";
import * as models from "@/lib/vercel-ai";

vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

vi.mock("@/lib/vercel-ai", () => ({
  primaryModel: { modelId: "primary" },
  fallbackModel: { modelId: "fallback" },
}));

describe("TripleScriptEngine", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const mockOutput = {
    audio: [
      { 
        id: "a1", 
        startTime: 0, 
        endTime: 2, 
        text: "Hello world.", 
        speakerId: "s1",
        metadata: { tone: "Excited", emotion: "Happy", volume: 1, speed: 1 }
      },
    ],
    visual: [],
    persona: [],
  };

  test("should decompose a raw script using primary model and check moderation", async () => {
    const engine = new TripleScriptEngine();
    const rawScript = "Hello world.";

    (generateObject as Mock).mockResolvedValue({ object: mockOutput });
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ flagged: false, categories: {}, category_scores: {} }]
      }),
    });

    const result = await engine.decompose(rawScript);

    expect(result.audio).toEqual(mockOutput.audio);
    expect(result.moderation?.flagged).toBe(false);
    expect(generateObject).toHaveBeenCalledWith(expect.objectContaining({
      model: models.primaryModel,
      prompt: expect.stringContaining(rawScript),
    }));
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.openai.com/v1/moderation",
      expect.any(Object)
    );
  });

  test("should failover to fallback when primary fails", async () => {
    const engine = new TripleScriptEngine();
    const rawScript = "Trigger fallback.";

    (generateObject as Mock)
      .mockRejectedValueOnce(new Error("Safety Blocked"))
      .mockResolvedValueOnce({ object: mockOutput });

    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ flagged: false, categories: {}, category_scores: {} }]
      }),
    });

    const result = await engine.decompose(rawScript);

    expect(result.audio).toEqual(mockOutput.audio);
    expect(generateObject).toHaveBeenCalledTimes(2);
    expect(generateObject).toHaveBeenNthCalledWith(1, expect.objectContaining({
      model: models.primaryModel,
    }));
    expect(generateObject).toHaveBeenNthCalledWith(2, expect.objectContaining({
      model: models.fallbackModel,
    }));

    const history = engine.getFailoverHistory();
    expect(history).toHaveLength(1);
    expect(history[0].error).toBe("Safety Blocked");
  });

  test("should identify flagged segments when moderation fails", async () => {
    const engine = new TripleScriptEngine();
    const rawScript = "Bad content.";

    (generateObject as Mock).mockResolvedValue({ object: mockOutput });
    
    // First call for overall check returns flagged
    // Second call for segment check (a1) returns flagged
    (global.fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ flagged: true, categories: { hate: true }, category_scores: { hate: 0.99 } }]
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ flagged: true, categories: { hate: true }, category_scores: { hate: 0.99 } }]
        }),
      });

    const result = await engine.decompose(rawScript);

    expect(result.moderation?.flagged).toBe(true);
    expect(result.moderation?.flaggedSegments).toHaveLength(1);
    expect(result.moderation?.flaggedSegments[0]).toEqual({
      layer: 'audio',
      id: 'a1',
      categories: ['hate'],
    });
  });
});
