// ✏️ EDIT ZONE START (line 1)
// ✏️ EDIT ZONE END (line EOF)

"use client";

import { useState, useMemo, useCallback } from "react";
import type { AssetType, AssetFilterStatus } from "@/ui/FilterBar";
import { FilterBar } from "@/ui/FilterBar";
import type { TableAsset } from "@/ui/AssetTable";
import { AssetTable } from "@/ui/AssetTable";
import type { PreviewAsset } from "@/ui/AssetPreviewModal";
import { AssetPreviewModal } from "@/ui/AssetPreviewModal";
import type { AssetStatus } from "@/ui/StatusBadge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Asset {
  id: string;
  type: AssetType;
  prompt: string;
  status: AssetStatus;
  createdAt: string;
  url?: string;
}

// ---------------------------------------------------------------------------
// Mock data — swap with /api/assets when Worker #164 delivers the endpoint
// ---------------------------------------------------------------------------

const MOCK_ASSETS: Asset[] = [
  {
    id: "ast-001",
    type: "Background",
    prompt: "Sunset city skyline with warm orange tones and silhoutted buildings",
    status: "READY",
    createdAt: "2026-05-20T08:30:00Z",
    url: "https://picsum.photos/seed/sunset-city/800/450",
  },
  {
    id: "ast-002",
    type: "Background",
    prompt: "Cozy coffee shop interior with soft morning light through windows",
    status: "READY",
    createdAt: "2026-05-19T14:15:00Z",
    url: "https://picsum.photos/seed/cozy-coffee/800/450",
  },
  {
    id: "ast-003",
    type: "Background",
    prompt: "Futuristic neon-lit alleyway after rain, cyberpunk aesthetic",
    status: "PENDING",
    createdAt: "2026-05-25T09:00:00Z",
  },
  {
    id: "ast-004",
    type: "Background",
    prompt: "Medieval castle ruins on a foggy hillside at dawn",
    status: "FAILED",
    createdAt: "2026-05-18T22:45:00Z",
  },
  {
    id: "ast-005",
    type: "BGM",
    prompt: "Upbeat lo-fi chillhop instrumental with jazzy piano and light drums",
    status: "READY",
    createdAt: "2026-05-21T11:00:00Z",
  },
  {
    id: "ast-006",
    type: "BGM",
    prompt: "Suspenseful orchestral buildup with strings and low brass",
    status: "PENDING",
    createdAt: "2026-05-26T07:20:00Z",
  },
  {
    id: "ast-007",
    type: "BGM",
    prompt: "Gentle acoustic guitar ambient pad for nature documentary",
    status: "FAILED",
    createdAt: "2026-05-17T16:30:00Z",
  },
  {
    id: "ast-008",
    type: "SFX",
    prompt: "Heavy wooden door creaking open slowly, reverb tail",
    status: "READY",
    createdAt: "2026-05-22T13:45:00Z",
  },
  {
    id: "ast-009",
    type: "SFX",
    prompt: "Digital glitch stutter effect for tech transition",
    status: "READY",
    createdAt: "2026-05-23T10:10:00Z",
  },
  {
    id: "ast-010",
    type: "SFX",
    prompt: "Magical sparkle burst with rising chime tones",
    status: "FAILED",
    createdAt: "2026-05-15T19:00:00Z",
  },
  {
    id: "ast-011",
    type: "Expression",
    prompt: "Character smile variant — warm, genuine, eyes slightly squinted",
    status: "READY",
    createdAt: "2026-05-24T08:55:00Z",
    url: "https://picsum.photos/seed/warm-smile/400/400",
  },
  {
    id: "ast-012",
    type: "Expression",
    prompt: "Surprised expression with raised eyebrows and wide eyes",
    status: "PENDING",
    createdAt: "2026-05-27T06:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Custom hook — simulates /api/assets fetch
// ---------------------------------------------------------------------------

function useAssets() {
  // In production, replace with:
  // const { data, error, isLoading } = useSWR('/api/assets', fetcher)
  const [assets] = useState<Asset[]>(MOCK_ASSETS);
  const isLoading = false;
  const error = null;

  return { assets, isLoading, error };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AssetDashboardPage() {
  const { assets, isLoading, error } = useAssets();

  // Filter state
  const [typeFilter, setTypeFilter] = useState<AssetType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<AssetFilterStatus>("ALL");

  // Preview modal state
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Computed: filtered assets
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (typeFilter !== "ALL" && a.type !== typeFilter) return false;
      if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
      return true;
    });
  }, [assets, typeFilter, statusFilter]);

  // Computed: status counters (based on type filter only, to show baseline)
  const counts = useMemo(() => {
    const typeFiltered =
      typeFilter === "ALL"
        ? assets
        : assets.filter((a) => a.type === typeFilter);
    return {
      total: typeFiltered.length,
      ready: typeFiltered.filter((a) => a.status === "READY").length,
      pending: typeFiltered.filter((a) => a.status === "PENDING").length,
      failed: typeFiltered.filter((a) => a.status === "FAILED").length,
    };
  }, [assets, typeFilter]);

  // Handlers
  const handleRowClick = useCallback((asset: TableAsset) => {
    const full = assets.find((a) => a.id === asset.id);
    if (full) {
      setPreviewAsset(full);
      setModalOpen(true);
    }
  }, [assets]);

  const handleRetry = useCallback((assetId: string) => {
    // TODO: POST /api/assets/{assetId}/retry when endpoint is ready
    alert(`Retry triggered for asset: ${assetId}`);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setPreviewAsset(null);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <AssetDashboardShell>
        <LoadingSkeleton />
      </AssetDashboardShell>
    );
  }

  // Error state
  if (error) {
    return (
      <AssetDashboardShell>
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : "Failed to load assets"
          }
        />
      </AssetDashboardShell>
    );
  }

  return (
    <AssetDashboardShell>
      <FilterBar
        selectedType={typeFilter}
        selectedStatus={statusFilter}
        onTypeChange={setTypeFilter}
        onStatusChange={setStatusFilter}
        counts={counts}
      />
      <AssetTable
        assets={filteredAssets}
        onRowClick={handleRowClick}
        onRetry={handleRetry}
      />
      <AssetPreviewModal
        asset={previewAsset}
        open={modalOpen}
        onClose={handleCloseModal}
      />
    </AssetDashboardShell>
  );
}

// ---------------------------------------------------------------------------
// Layout shell — wraps children with consistent page chrome
// ---------------------------------------------------------------------------

function AssetDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Asset Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse and manage generated assets
        </p>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border px-4 py-3"
          >
            <div className="h-5 w-12 rounded bg-muted" />
            <div className="h-4 flex-1 rounded bg-muted" />
            <div className="h-5 w-16 rounded-full bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-7 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-16 text-center">
      <p className="text-sm font-medium text-destructive">
        Something went wrong
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
