/**
 * Integration tests cho opencut-orchestrator.
 *
 * Kiểm tra: runOpenCutAgent() flow, buildProjectContext() output,
 * MAX_ROUNDS protection, error handling.
 *
 * Mock: Vercel AI SDK generateText, executeToolCall, readFile.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Section: Mocks (TOP-LEVEL — Vitest requirement) ──────────────

vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({
    text: "Timeline đã hoàn thiện. Không cần thêm thay đổi.",
    toolCalls: [],
    toolResults: [],
    steps: [],
    finishReason: "stop",
    usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    totalUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    warnings: [],
    request: {},
    response: { messages: [] },
  }),
  tool: vi.fn((def: Record<string, unknown>) => def),
  stepCountIs: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn().mockResolvedValue(
    JSON.stringify({
      metadata: { id: "proj-001", name: "Test Project" },
      scenes: [
        {
          id: "scene-1",
          name: "Opening",
          tracks: [
            {
              id: "track-video-1",
              type: "video",
              elements: [
                {
                  id: "elem-1",
                  name: "shot1.mp4",
                  type: "video",
                  startTime: 0,
                  duration: 5,
                },
              ],
            },
            {
              id: "track-text-1",
              type: "text",
              elements: [],
            },
          ],
        },
      ],
      currentSceneId: "scene-1",
      settings: {},
      version: 10,
    }),
  ),
}));

vi.mock("@/shared/api-clients/opencut-tool-executor", () => ({
  executeToolCall: vi.fn().mockResolvedValue({
    success: true,
    data: { message: "ok" },
  }),
}));

vi.mock("@/shared/api_clients/vercel-ai", () => ({
  primaryModel: {},
  getModel: vi.fn(() => ({})),
}));

// ── Section: Dynamic imports (after mocks are set up) ────────────

import {
  runOpenCutAgent,
  buildProjectContext,
  MAX_ROUNDS,
  type AgentResult,
} from "../opencut-orchestrator";
import type { SerializedProject } from "@/shared/api-clients/opencut-bridge";

// ── Section: Test fixtures ───────────────────────────────────────

const mockProjectJson: SerializedProject = {
  metadata: { id: "proj-001", name: "Test Project" },
  scenes: [
    {
      id: "scene-1",
      name: "Opening",
      tracks: [
        {
          id: "track-video-1",
          type: "video",
          elements: [
            {
              id: "elem-1",
              name: "shot1.mp4",
              type: "video",
              startTime: 0,
              duration: 5,
            },
          ],
        },
        {
          id: "track-text-1",
          type: "text",
          elements: [],
        },
      ],
    },
    {
      id: "scene-2",
      name: "Middle",
      tracks: [
        {
          id: "track-video-2",
          type: "video",
          elements: [
            {
              id: "elem-2",
              name: "shot2.mp4",
              type: "video",
              startTime: 5,
              duration: 7,
            },
          ],
        },
        {
          id: "track-audio-1",
          type: "audio",
          elements: [
            {
              id: "elem-bgm",
              name: "bgm.mp3",
              type: "audio",
              startTime: 0,
              duration: 12,
              volume: 0.5,
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

const mockUserRequest = "Hãy hoàn thiện timeline cho episode test-001";

// ── Section: buildProjectContext ─────────────────────────────────

describe("buildProjectContext", () => {
  it("returns a string containing project name", () => {
    const ctx = buildProjectContext(mockProjectJson);
    expect(ctx).toContain("Test Project");
  });

  it("returns a string containing scene names", () => {
    const ctx = buildProjectContext(mockProjectJson);
    expect(ctx).toContain("Opening");
    expect(ctx).toContain("Middle");
  });

  it("returns a string containing track info", () => {
    const ctx = buildProjectContext(mockProjectJson);
    expect(ctx).toContain("track-video-1");
    expect(ctx).toContain("video");
    expect(ctx).toContain("text");
  });

  it("returns a string containing element info", () => {
    const ctx = buildProjectContext(mockProjectJson);
    expect(ctx).toContain("shot1.mp4");
    expect(ctx).toContain("bgm.mp3");
  });

  it("contains total element count", () => {
    const ctx = buildProjectContext(mockProjectJson);
    expect(ctx).toMatch(/3 element|3 clip|3 phần/i);
  });
});

// ── Section: runOpenCutAgent ─────────────────────────────────────

describe("runOpenCutAgent", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key";
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("throws if episodeId is empty string", async () => {
    await expect(runOpenCutAgent("", "do something")).rejects.toThrow(
      /episodeId/i,
    );
  });

  it("throws if episodeId is whitespace only", async () => {
    await expect(runOpenCutAgent("   ", "do something")).rejects.toThrow(
      /episodeId/i,
    );
  });

  it("throws if userRequest is empty string", async () => {
    await expect(runOpenCutAgent("ep-001", "")).rejects.toThrow(
      /userRequest/i,
    );
  });

  it("returns AgentResult with expected shape on successful run", async () => {
    const result: AgentResult = await runOpenCutAgent(
      "test-001",
      mockUserRequest,
    );

    expect(result).toHaveProperty("finalSummary");
    expect(result).toHaveProperty("edits");
    expect(result).toHaveProperty("toolResults");
    expect(typeof result.finalSummary).toBe("string");
    expect(Array.isArray(result.edits)).toBe(true);
    expect(Array.isArray(result.toolResults)).toBe(true);
  });
});

// ── Section: MAX_ROUNDS constant ─────────────────────────────────

describe("MAX_ROUNDS", () => {
  it("is defined and positive", () => {
    expect(MAX_ROUNDS).toBeGreaterThan(0);
  });

  it("is not more than 20", () => {
    expect(MAX_ROUNDS).toBeLessThanOrEqual(20);
  });
});
