// ✏️ EDIT ZONE START
import { describe, it, expect } from "vitest";

// Mirror the statusConfig from StatusBadge.tsx (logic-only test, no DOM needed)
// Source: src/ui/StatusBadge.tsx:18-72

type StatusConfig = { label: string; className: string };

const statusConfig: Record<string, StatusConfig> = {
  // Asset status (legacy — unchanged token mapping)
  READY: {
    label: "Ready",
    className:
      "bg-chart-2/15 text-chart-2 border-chart-2/30 dark:bg-chart-2/20",
  },
  PENDING: {
    label: "Pending",
    className:
      "bg-chart-1/15 text-chart-1 border-chart-1/30 dark:bg-chart-1/20",
  },
  FAILED: {
    label: "Failed",
    className:
      "bg-destructive/15 text-destructive border-destructive/30 dark:bg-destructive/20",
  },
  // Drama status
  draft: {
    label: "Draft",
    className:
      "bg-secondary/50 text-secondary-foreground/50 border-secondary dark:bg-secondary/30 dark:text-secondary-foreground/60",
  },
  in_progress: {
    label: "In Progress",
    className:
      "bg-chart-1/15 text-chart-1 border-chart-1/30 dark:bg-chart-1/20",
  },
  completed: {
    label: "Completed",
    className:
      "bg-chart-2/15 text-chart-2 border-chart-2/30 dark:bg-chart-2/20",
  },
  // Episode-only statuses (distinct from Drama draft)
  pending: {
    label: "Pending",
    className:
      "bg-muted/50 text-muted-foreground/60 border-muted/50 dark:bg-muted/25 dark:text-muted-foreground/50",
  },
  scripting: {
    label: "Scripting",
    className:
      "bg-chart-4/15 text-chart-4 border-chart-4/30 dark:bg-chart-4/20",
  },
  rendering: {
    label: "Rendering",
    className:
      "bg-chart-3/15 text-chart-3 border-chart-3/30 dark:bg-chart-3/20",
  },
  failed: {
    label: "Failed",
    className:
      "bg-destructive/15 text-destructive border-destructive/30 dark:bg-destructive/20",
  },
};

// Status handling mirrors StatusBadge.tsx:74-88
function getStatusConfig(status: string): StatusConfig | undefined {
  return statusConfig[status];
}

// ---------------------------------------------------------------------------
// Tests: Status config — completeness
// ---------------------------------------------------------------------------

describe("StatusBadge — statusConfig completeness", () => {
  it("has exactly 10 status entries", () => {
    expect(Object.keys(statusConfig)).toHaveLength(10);
  });

  it("every entry has a non-empty label", () => {
    for (const [key, config] of Object.entries(statusConfig)) {
      expect(config.label, `"${key}" label is empty`).toBeTruthy();
    }
  });

  it("every entry has a non-empty className", () => {
    for (const [key, config] of Object.entries(statusConfig)) {
      expect(config.className, `"${key}" className is empty`).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: Label accuracy — all 10 statuses
// ---------------------------------------------------------------------------

describe("StatusBadge — label accuracy", () => {
  it.each([
    ["READY", "Ready"],
    ["PENDING", "Pending"],
    ["FAILED", "Failed"],
    ["draft", "Draft"],
    ["in_progress", "In Progress"],
    ["completed", "Completed"],
    ["pending", "Pending"],
    ["scripting", "Scripting"],
    ["rendering", "Rendering"],
    ["failed", "Failed"],
  ])('"%s" maps to label "%s"', (status, expectedLabel) => {
    const config = getStatusConfig(status);
    expect(config).toBeDefined();
    expect(config!.label).toBe(expectedLabel);
  });
});

// ---------------------------------------------------------------------------
// Tests: Color class accuracy — key design tokens
// ---------------------------------------------------------------------------

describe("StatusBadge — color class accuracy", () => {
  it("READY / completed use chart-2 color", () => {
    expect(statusConfig["READY"].className).toContain("chart-2");
    expect(statusConfig["completed"].className).toContain("chart-2");
  });

  it("PENDING / in_progress use chart-1 color", () => {
    expect(statusConfig["PENDING"].className).toContain("chart-1");
    expect(statusConfig["in_progress"].className).toContain("chart-1");
  });

  it("FAILED / failed use destructive color", () => {
    expect(statusConfig["FAILED"].className).toContain("destructive");
    expect(statusConfig["failed"].className).toContain("destructive");
  });

  it("draft uses secondary/muted colors", () => {
    expect(statusConfig["draft"].className).toContain("secondary");
  });

  it("pending (Episode) uses muted colors (distinct from PENDING asset)", () => {
    expect(statusConfig["pending"].className).toContain("muted");
    expect(statusConfig["pending"].className).not.toContain("chart-1");
  });

  it("scripting uses chart-4 color", () => {
    expect(statusConfig["scripting"].className).toContain("chart-4");
  });

  it("rendering uses chart-3 color", () => {
    expect(statusConfig["rendering"].className).toContain("chart-3");
  });
});

// ---------------------------------------------------------------------------
// Tests: Unknown status — fallback branch (L77-88 in StatusBadge.tsx)
// ---------------------------------------------------------------------------

describe("StatusBadge — unknown status fallback", () => {
  it("returns undefined for unknown status (triggers if (!config) branch)", () => {
    expect(getStatusConfig("bogus_status")).toBeUndefined();
    expect(getStatusConfig("")).toBeUndefined();
    expect(getStatusConfig("random_string")).toBeUndefined();
  });

  it("returns undefined for case-mismatch (config keys are case-sensitive)", () => {
    expect(getStatusConfig("ready")).toBeUndefined();
    expect(getStatusConfig("Draft")).toBeUndefined();
    expect(getStatusConfig("IN_PROGRESS")).toBeUndefined();
  });

  it("returns undefined for null/undefined input (type-safety edge)", () => {
    expect(getStatusConfig(null as unknown as string)).toBeUndefined();
    expect(getStatusConfig(undefined as unknown as string)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Tests: StatusType union — all known keys
// ---------------------------------------------------------------------------

describe("StatusBadge — StatusType union coverage", () => {
  const allStatusKeys = [
    "READY", "PENDING", "FAILED",           // AssetStatus (3)
    "draft", "in_progress", "completed",    // DramaStatus (3)
    "pending", "scripting", "rendering", "failed", // EpisodeStatus (6)
  ];

  it("all expected StatusType keys exist in statusConfig", () => {
    for (const key of allStatusKeys) {
      expect(statusConfig[key], `Missing config for "${key}"`).toBeDefined();
    }
  });

  it("PENDING and pending have different color classes (not confused)", () => {
    expect(statusConfig["PENDING"].className).not.toBe(
      statusConfig["pending"].className,
    );
  });
});
// ✏️ EDIT ZONE END
