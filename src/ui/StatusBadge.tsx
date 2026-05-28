// ✏️ EDIT ZONE START (1-EOF)
"use client";

import { cn } from "@/lib/utils";
import type { DramaStatus, EpisodeStatus } from "@/shared/types/episode";

export type AssetStatus = "READY" | "PENDING" | "FAILED";
export type { DramaStatus, EpisodeStatus };
export type StatusType = AssetStatus | DramaStatus | EpisodeStatus;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

type StatusConfig = { label: string; className: string };

const statusConfig: Record<StatusType, StatusConfig> = {
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

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  if (!config) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
          "bg-muted text-muted-foreground border-muted",
          className,
        )}
      >
        {status}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
// ✏️ EDIT ZONE END (1-EOF)
