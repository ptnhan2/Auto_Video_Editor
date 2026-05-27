"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import type { AssetStatus } from "./StatusBadge";
import type { AssetType } from "./FilterBar";

export interface TableAsset {
  id: string;
  type: AssetType;
  prompt: string;
  status: AssetStatus;
  createdAt: string;
}

interface AssetTableProps {
  assets: TableAsset[];
  onRowClick: (asset: TableAsset) => void;
  onRetry: (assetId: string) => void;
}

const TYPE_ICON: Record<AssetType, string> = {
  Background: "BG",
  BGM: "BGM",
  SFX: "SFX",
  Expression: "EXP",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AssetTable({
  assets,
  onRowClick,
  onRetry,
}: AssetTableProps) {
  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">No assets found</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Prompt
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Created
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {assets.map((asset) => (
            <tr
              key={asset.id}
              onClick={() => onRowClick(asset)}
              className={cn(
                "group transition-colors",
                "hover:bg-muted/50 cursor-pointer",
              )}
            >
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 rounded bg-muted px-2 py-0.5 text-xs font-mono font-medium text-muted-foreground">
                  {TYPE_ICON[asset.type]}
                </span>
              </td>
              <td className="px-4 py-3 max-w-[320px]">
                <p className="text-sm text-foreground truncate">
                  {asset.prompt}
                </p>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={asset.status} />
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-muted-foreground tabular-nums">
                  {formatDate(asset.createdAt)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {asset.status === "FAILED" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetry(asset.id);
                    }}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2.5 py-1",
                      "text-xs font-medium",
                      "bg-destructive/10 text-destructive",
                      "hover:bg-destructive/20 transition-colors",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                    )}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Retry
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
