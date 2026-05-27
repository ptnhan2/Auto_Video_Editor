"use client";

import { cn } from "@/lib/utils";
import { X, Filter } from "lucide-react";
import type { AssetStatus } from "./StatusBadge";
import { StatusBadge } from "./StatusBadge";

export type AssetType = "Background" | "BGM" | "SFX" | "Expression";
export type AssetFilterStatus = AssetStatus | "ALL";

interface FilterBarProps {
  selectedType: AssetType | "ALL";
  selectedStatus: AssetFilterStatus;
  onTypeChange: (type: AssetType | "ALL") => void;
  onStatusChange: (status: AssetFilterStatus) => void;
  counts: {
    total: number;
    ready: number;
    pending: number;
    failed: number;
  };
}

const TYPE_OPTIONS: { value: AssetType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Types" },
  { value: "Background", label: "Background" },
  { value: "BGM", label: "BGM" },
  { value: "SFX", label: "SFX" },
  { value: "Expression", label: "Expression" },
];

const STATUS_OPTIONS: { value: AssetFilterStatus; label: string }[] = [
  { value: "ALL", label: "All Status" },
  { value: "READY", label: "Ready" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
];

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={id}
        className="text-xs font-medium text-muted-foreground whitespace-nowrap"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-8 rounded-md border border-input bg-background px-2.5 pr-7",
          "text-sm text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
          "appearance-none cursor-pointer",
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
          backgroundPosition: "right 0.25rem center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "1.25rem 1.25rem",
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CounterChip({
  label,
  count,
  variant,
}: {
  label: string;
  count: number;
  variant: "ready" | "pending" | "failed";
}) {
  const variantClass = {
    ready: "bg-chart-2/10 text-chart-2",
    pending: "bg-chart-1/10 text-chart-1",
    failed: "bg-destructive/10 text-destructive",
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
        variantClass,
      )}
    >
      <span className="font-mono tabular-nums">{count}</span>
      <span className="opacity-80">{label}</span>
    </span>
  );
}

export function FilterBar({
  selectedType,
  selectedStatus,
  onTypeChange,
  onStatusChange,
  counts,
}: FilterBarProps) {
  const hasActiveFilters =
    selectedType !== "ALL" || selectedStatus !== "ALL";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <SelectField
          id="filter-type"
          label="Type"
          value={selectedType}
          options={TYPE_OPTIONS}
          onChange={(v) => onTypeChange(v as AssetType | "ALL")}
        />
        <SelectField
          id="filter-status"
          label="Status"
          value={selectedStatus}
          options={STATUS_OPTIONS}
          onChange={(v) => onStatusChange(v as AssetFilterStatus)}
        />
        {hasActiveFilters && (
          <button
            onClick={() => {
              onTypeChange("ALL");
              onStatusChange("ALL");
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <CounterChip label="Total" count={counts.total} variant="ready" />
        <CounterChip label="Ready" count={counts.ready} variant="ready" />
        <CounterChip
          label="Pending"
          count={counts.pending}
          variant="pending"
        />
        <CounterChip label="Failed" count={counts.failed} variant="failed" />
      </div>
    </div>
  );
}
