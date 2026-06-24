/**
 * Unit tests cho OpenCut Tool Executor.
 *
 * Mock global fetch để test HTTP calls mà không cần OpenCut-AI chạy thật.
 * Kiểm tra: type-safe dispatch đến đúng handler, gọi đúng API endpoint,
 * parse success/error response, xử lý unknown function name.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock global fetch ──────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

let executor: typeof import("@/shared/api-clients/opencut-tool-executor");

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockFetch.mockReset();
  executor = await import("@/shared/api-clients/opencut-tool-executor");
});

// ── Helper: mock fetch trả về success ──────────────────────────────

function mockOpenCutSuccess(responseData: Record<string, unknown>) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => responseData,
  });
}

// ── Helper: mock fetch trả về error ────────────────────────────────

function mockOpenCutError(status: number, statusText: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText,
  });
}

// ── Helper: tạo base path cho API endpoint ─────────────────────────

const BASE = "http://localhost:3001/api";

// ── Section: add_clip dispatch ─────────────────────────────────────

describe("executeToolCall — add_clip", () => {
  it("calls POST /api/timeline/add-clip with correct body", async () => {
    mockOpenCutSuccess({ element_id: "elem-new-001" });

    const result = await executor.executeToolCall({
      name: "add_clip",
      args: {
        track_id: "track-video-001",
        media_id: "media-shot1",
        clip_type: "video",
        start_time: 0,
        duration: 5.0,
      },
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ element_id: "elem-new-001" });
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/timeline/add-clip`,
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns success:false on API error", async () => {
    mockOpenCutError(400, "Bad Request");

    const result = await executor.executeToolCall({
      name: "add_clip",
      args: {
        track_id: "t",
        media_id: "m",
        clip_type: "video",
        start_time: 0,
        duration: 1,
      },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("OpenCut API error");
  });
});

// ── Section: remove_element dispatch ────────────────────────────────

describe("executeToolCall — remove_element", () => {
  it("calls POST /api/timeline/remove-element", async () => {
    mockOpenCutSuccess({ success: true });

    const result = await executor.executeToolCall({
      name: "remove_element",
      args: { track_id: "t1", element_id: "e1" },
    });

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/timeline/remove-element`,
      expect.objectContaining({ method: "POST" }),
    );
  });
});

// ── Section: set_transition dispatch ────────────────────────────────

describe("executeToolCall — set_transition", () => {
  it("calls POST /api/timeline/set-transition", async () => {
    mockOpenCutSuccess({ success: true });

    const result = await executor.executeToolCall({
      name: "set_transition",
      args: { element_id: "e1", transition_type: "cross-dissolve" },
    });

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/timeline/set-transition`,
      expect.objectContaining({
        body: expect.stringContaining("cross-dissolve"),
      }),
    );
  });
});

// ── Section: add_effect dispatch ────────────────────────────────────

describe("executeToolCall — add_effect", () => {
  it("calls POST /api/effects/add", async () => {
    mockOpenCutSuccess({ effect_id: "eff-001" });

    const result = await executor.executeToolCall({
      name: "add_effect",
      args: {
        element_id: "e1",
        effect_type: "blur",
        params: { intensity: 5 },
      },
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ effect_id: "eff-001" });
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/effects/add`,
      expect.objectContaining({ method: "POST" }),
    );
  });
});

// ── Section: add_subtitle dispatch ──────────────────────────────────

describe("executeToolCall — add_subtitle", () => {
  it("calls POST /api/timeline/add-subtitle", async () => {
    mockOpenCutSuccess({ element_id: "text-new-001" });

    const result = await executor.executeToolCall({
      name: "add_subtitle",
      args: {
        track_id: "track-text-001",
        content: "Hello",
        start_time: 0,
        duration: 3,
      },
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ element_id: "text-new-001" });
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/timeline/add-subtitle`,
      expect.objectContaining({ method: "POST" }),
    );
  });
});

// ── Section: adjust_volume dispatch ─────────────────────────────────

describe("executeToolCall — adjust_volume", () => {
  it("calls POST /api/timeline/adjust-volume", async () => {
    mockOpenCutSuccess({ success: true });

    const result = await executor.executeToolCall({
      name: "adjust_volume",
      args: { track_id: "track-audio-001", volume: 0.5 },
    });

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/timeline/adjust-volume`,
      expect.objectContaining({
        body: expect.stringContaining("0.5"),
      }),
    );
  });
});

// ── Section: split_clip dispatch ────────────────────────────────────

describe("executeToolCall — split_clip", () => {
  it("calls POST /api/timeline/split-clip", async () => {
    mockOpenCutSuccess({
      left_element_id: "elem-left",
      right_element_id: "elem-right",
    });

    const result = await executor.executeToolCall({
      name: "split_clip",
      args: { element_id: "e1", split_time: 3.5 },
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      left_element_id: "elem-left",
      right_element_id: "elem-right",
    });
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/timeline/split-clip`,
      expect.objectContaining({ method: "POST" }),
    );
  });
});

// ── Section: export_video dispatch ──────────────────────────────────

describe("executeToolCall — export_video", () => {
  it("calls POST /api/export/video", async () => {
    mockOpenCutSuccess({ export_id: "export-001", status: "queued" });

    const result = await executor.executeToolCall({
      name: "export_video",
      args: {
        project_id: "proj-001",
        output_format: "mp4",
        resolution: "1080p",
      },
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ export_id: "export-001", status: "queued" });
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/export/video`,
      expect.objectContaining({ method: "POST" }),
    );
  });
});

// ── Section: Unknown function ───────────────────────────────────────

describe("executeToolCall — unknown function", () => {
  it("returns error for unknown function name", async () => {
    const result = await executor.executeToolCall({
      name: "nonexistent_tool" as "add_clip",
      args: {} as never,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ── Section: Network error handling ─────────────────────────────────

describe("executeToolCall — network error", () => {
  it("returns success:false on fetch rejection", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network down"));

    const result = await executor.executeToolCall({
      name: "remove_element",
      args: { track_id: "t1", element_id: "e1" },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Network down");
  });
});
