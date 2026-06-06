// ✏️ EDIT ZONE START
import { describe, it, expect } from "vitest";

// Đã viết implementation thực tế cho derivePipelineSteps
import { derivePipelineSteps } from "../ui/episode-detail";

describe("derivePipelineSteps", () => {
  const ts = "2026-06-06T12:00:00Z";

  it("draft status → all steps pending", () => {
    const steps = derivePipelineSteps({ status: "draft", updatedAt: ts });
    expect(steps.every((s: any) => s.status === "pending")).toBe(true);
    expect(steps.every((s: any) => s.timestamp === null)).toBe(true);
  });

  it("pending status → all steps pending", () => {
    const steps = derivePipelineSteps({ status: "pending", updatedAt: ts });
    expect(steps.every((s: any) => s.status === "pending")).toBe(true);
  });

  it("scripting status → S1 completed, S2 in_progress, rest pending", () => {
    const steps = derivePipelineSteps({ status: "scripting", updatedAt: ts });
    expect(steps[0].status).toBe("completed");
    expect(steps[1].status).toBe("in_progress");
    expect(steps.slice(2).every((s: any) => s.status === "pending")).toBe(true);
  });

  it("rendering status → S1-S5 completed, S6-S7 pending", () => {
    const steps = derivePipelineSteps({ status: "rendering", updatedAt: ts });
    expect(steps.slice(0, 5).every((s: any) => s.status === "completed")).toBe(true);
    expect(steps[5].status).toBe("pending");
    expect(steps[6].status).toBe("pending");
  });

  it("completed status → all steps completed", () => {
    const steps = derivePipelineSteps({ status: "completed", updatedAt: ts });
    expect(steps.every((s: any) => s.status === "completed")).toBe(true);
  });

  it("failed status → S1-S3 completed, S4 failed, rest pending", () => {
    const steps = derivePipelineSteps({ status: "failed", updatedAt: ts });
    expect(steps[0].status).toBe("completed");
    expect(steps[1].status).toBe("completed");
    expect(steps[2].status).toBe("completed");
    expect(steps[3].status).toBe("failed");
    expect(steps[4].status).toBe("pending");
    expect(steps[5].status).toBe("pending");
    expect(steps[6].status).toBe("pending");
  });

  it("completed steps have timestamp, pending steps have null timestamp", () => {
    const steps = derivePipelineSteps({ status: "scripting", updatedAt: ts });
    expect(steps[0].timestamp).toBe(ts);
    expect(steps[1].timestamp).toBe(ts);
    expect(steps[2].timestamp).toBeNull();
  });

  it("all 7 steps are present", () => {
    const steps = derivePipelineSteps({ status: "draft", updatedAt: ts });
    expect(steps).toHaveLength(7);
    expect(steps.map((s: any) => s.id)).toEqual(["S1", "S2", "S3", "S4", "S5", "S6", "S7"]);
  });

  it("unknown status falls back to all pending", () => {
    const steps = derivePipelineSteps({ status: "unknown_status", updatedAt: ts });
    expect(steps.every((s: any) => s.status === "pending")).toBe(true);
  });
});
// ✏️ EDIT ZONE END
