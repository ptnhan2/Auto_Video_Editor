import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Types (mirrors the usage in page.tsx)
// ---------------------------------------------------------------------------

type AssetType = "Background" | "BGM" | "SFX" | "Expression";
type AssetStatus = "READY" | "PENDING" | "FAILED";

interface Asset {
  id: string;
  type: AssetType;
  prompt: string;
  status: AssetStatus;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Status badge config (mirrors StatusBadge.tsx logic)
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<AssetStatus, string> = {
  READY: "Ready",
  PENDING: "Pending",
  FAILED: "Failed",
};

function getStatusClass(status: AssetStatus): string {
  const map: Record<AssetStatus, string> = {
    READY: "bg-chart-2/15 text-chart-2 border-chart-2/30",
    PENDING: "bg-chart-1/15 text-chart-1 border-chart-1/30",
    FAILED: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return map[status];
}

// ---------------------------------------------------------------------------
// Filtering logic (mirrors page.tsx useMemo)
// ---------------------------------------------------------------------------

function filterAssets(
  assets: Asset[],
  typeFilter: AssetType | "ALL",
  statusFilter: AssetStatus | "ALL",
): Asset[] {
  return assets.filter((a) => {
    if (typeFilter !== "ALL" && a.type !== typeFilter) return false;
    if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
    return true;
  });
}

function computeCounts(
  assets: Asset[],
  typeFilter: AssetType | "ALL",
): { total: number; ready: number; pending: number; failed: number } {
  const base =
    typeFilter === "ALL"
      ? assets
      : assets.filter((a) => a.type === typeFilter);
  return {
    total: base.length,
    ready: base.filter((a) => a.status === "READY").length,
    pending: base.filter((a) => a.status === "PENDING").length,
    failed: base.filter((a) => a.status === "FAILED").length,
  };
}

// ---------------------------------------------------------------------------
// Type icon shorthand (mirrors AssetTable.tsx)
// ---------------------------------------------------------------------------

function getTypeIcon(type: AssetType): string {
  const icons: Record<AssetType, string> = {
    Background: "BG",
    BGM: "BGM",
    SFX: "SFX",
    Expression: "EXP",
  };
  return icons[type];
}

// ---------------------------------------------------------------------------
// Audio type detection (mirrors AssetPreviewModal.tsx)
// ---------------------------------------------------------------------------

function isAudioType(type: AssetType): boolean {
  return type === "BGM" || type === "SFX";
}

// ===========================================================================
// Mock data (mirrors page.tsx MOCK_ASSETS)
// ===========================================================================

const MOCK_ASSETS: Asset[] = [
  {
    id: "ast-001",
    type: "Background",
    prompt: "Sunset city skyline",
    status: "READY",
    createdAt: "2026-05-20T08:30:00Z",
  },
  {
    id: "ast-002",
    type: "BGM",
    prompt: "Upbeat lo-fi chillhop",
    status: "READY",
    createdAt: "2026-05-21T11:00:00Z",
  },
  {
    id: "ast-003",
    type: "Background",
    prompt: "Cyberpunk alleyway",
    status: "PENDING",
    createdAt: "2026-05-25T09:00:00Z",
  },
  {
    id: "ast-004",
    type: "SFX",
    prompt: "Door creaking open",
    status: "FAILED",
    createdAt: "2026-05-17T16:30:00Z",
  },
  {
    id: "ast-005",
    type: "Expression",
    prompt: "Character smile variant",
    status: "READY",
    createdAt: "2026-05-24T08:55:00Z",
  },
  {
    id: "ast-006",
    type: "BGM",
    prompt: "Suspenseful orchestral buildup",
    status: "FAILED",
    createdAt: "2026-05-19T14:15:00Z",
  },
  {
    id: "ast-007",
    type: "SFX",
    prompt: "Digital glitch stutter",
    status: "READY",
    createdAt: "2026-05-22T13:45:00Z",
  },
  {
    id: "ast-008",
    type: "Expression",
    prompt: "Surprised expression",
    status: "PENDING",
    createdAt: "2026-05-27T06:00:00Z",
  },
];

// ===========================================================================
// Tests: Status Badge
// ===========================================================================

describe("StatusBadge logic", () => {
  it("maps READY to label 'Ready'", () => {
    expect(STATUS_LABELS["READY"]).toBe("Ready");
  });

  it("maps PENDING to label 'Pending'", () => {
    expect(STATUS_LABELS["PENDING"]).toBe("Pending");
  });

  it("maps FAILED to label 'Failed'", () => {
    expect(STATUS_LABELS["FAILED"]).toBe("Failed");
  });

  it("READY uses chart-2 color class", () => {
    expect(getStatusClass("READY")).toContain("chart-2");
  });

  it("PENDING uses chart-1 color class", () => {
    expect(getStatusClass("PENDING")).toContain("chart-1");
  });

  it("FAILED uses destructive color class", () => {
    expect(getStatusClass("FAILED")).toContain("destructive");
  });

  it("all statuses have valid config", () => {
    const statuses: AssetStatus[] = ["READY", "PENDING", "FAILED"];
    for (const s of statuses) {
      expect(STATUS_LABELS[s]).toBeTruthy();
      expect(getStatusClass(s)).toBeTruthy();
    }
  });
});

// ===========================================================================
// Tests: Filtering
// ===========================================================================

describe("filterAssets", () => {
  it("returns all assets when filters are ALL/ALL", () => {
    const result = filterAssets(MOCK_ASSETS, "ALL", "ALL");
    expect(result).toHaveLength(MOCK_ASSETS.length);
  });

  it("filters by type correctly", () => {
    const result = filterAssets(MOCK_ASSETS, "BGM", "ALL");
    expect(result).toHaveLength(2);
    expect(result.every((a) => a.type === "BGM")).toBe(true);
  });

  it("filters by status correctly", () => {
    const result = filterAssets(MOCK_ASSETS, "ALL", "FAILED");
    expect(result).toHaveLength(2);
    expect(result.every((a) => a.status === "FAILED")).toBe(true);
  });

  it("filters by both type and status", () => {
    const result = filterAssets(MOCK_ASSETS, "BGM", "FAILED");
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("BGM");
    expect(result[0].status).toBe("FAILED");
  });

  it("returns empty array for non-matching combination", () => {
    const result = filterAssets(MOCK_ASSETS, "Expression", "FAILED");
    expect(result).toHaveLength(0);
  });

  it("does not mutate original array", () => {
    const copy = [...MOCK_ASSETS];
    filterAssets(MOCK_ASSETS, "BGM", "ALL");
    expect(MOCK_ASSETS).toEqual(copy);
  });
});

// ===========================================================================
// Tests: Counters
// ===========================================================================

describe("computeCounts", () => {
  it("counts totals across all assets", () => {
    const counts = computeCounts(MOCK_ASSETS, "ALL");
    expect(counts.total).toBe(8);
    expect(counts.ready + counts.pending + counts.failed).toBe(counts.total);
  });

  it("counts READY correctly", () => {
    const counts = computeCounts(MOCK_ASSETS, "ALL");
    expect(counts.ready).toBe(4); // ast-001, ast-002, ast-005, ast-007
  });

  it("counts PENDING correctly", () => {
    const counts = computeCounts(MOCK_ASSETS, "ALL");
    expect(counts.pending).toBe(2); // ast-003, ast-008
  });

  it("counts FAILED correctly", () => {
    const counts = computeCounts(MOCK_ASSETS, "ALL");
    expect(counts.failed).toBe(2); // ast-004, ast-006
  });

  it("counts filtered by type", () => {
    const counts = computeCounts(MOCK_ASSETS, "BGM");
    expect(counts.total).toBe(2);
    expect(counts.ready).toBe(1);
    expect(counts.failed).toBe(1);
    expect(counts.pending).toBe(0);
  });

  it("returns zero counts for empty array", () => {
    const counts = computeCounts([], "ALL");
    expect(counts.total).toBe(0);
    expect(counts.ready).toBe(0);
    expect(counts.pending).toBe(0);
    expect(counts.failed).toBe(0);
  });
});

// ===========================================================================
// Tests: Type & Audio helpers
// ===========================================================================

describe("getTypeIcon", () => {
  it("returns correct abbreviations for all types", () => {
    expect(getTypeIcon("Background")).toBe("BG");
    expect(getTypeIcon("BGM")).toBe("BGM");
    expect(getTypeIcon("SFX")).toBe("SFX");
    expect(getTypeIcon("Expression")).toBe("EXP");
  });
});

describe("isAudioType", () => {
  it("returns true for BGM", () => {
    expect(isAudioType("BGM")).toBe(true);
  });

  it("returns true for SFX", () => {
    expect(isAudioType("SFX")).toBe(true);
  });

  it("returns false for Background", () => {
    expect(isAudioType("Background")).toBe(false);
  });

  it("returns false for Expression", () => {
    expect(isAudioType("Expression")).toBe(false);
  });
});
