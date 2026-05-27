"use client";

import { cn } from "@/lib/utils";

export type AssetStatus = "READY" | "PENDING" | "FAILED";

interface StatusBadgeProps {
  status: AssetStatus;
  className?: string;
}

const statusConfig: Record<
  AssetStatus,
  { label: string; className: string }
> = {
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
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

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
