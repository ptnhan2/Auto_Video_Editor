// ✏️ EDIT ZONE START (line 1)
// ✏️ EDIT ZONE END (line EOF)

"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
// Data fetching — real /api/assets endpoint
// ---------------------------------------------------------------------------

interface ApiAssetRow {
  id: string;
  type: string;
  prompt: string | null;
  status: string;
  result_asset_id: string | null;
  hash_key: string;
  created_at: string;
}

interface ApiAssetsResponse {
  data: ApiAssetRow[];
  total: number;
  limit: number;
  offset: number;
}

function mapApiAsset(row: ApiAssetRow): Asset {
  return {
    id: row.id,
    type: row.type as AssetType,
    prompt: row.prompt ?? "",
    status: row.status as AssetStatus,
    url: row.result_asset_id ?? undefined,
    createdAt: row.created_at,
  };
}

function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch("/api/assets?limit=100");
        if (!res.ok) {
          throw new Error(`Failed to fetch assets (HTTP ${res.status})`);
        }

        const json: ApiAssetsResponse = await res.json();
        if (!cancelled) {
          setAssets(json.data.map(mapApiAsset));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

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
    console.log(`Retry triggered for asset: ${assetId}`);
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
        <ErrorState message={error.message} />
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
