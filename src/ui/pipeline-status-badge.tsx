// ✏️ EDIT ZONE START
import type { DramaStatus, EpisodeStatus } from "@/shared/types/episode";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors shrink-0",
  {
    variants: {
      variant: {
        draft: "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
        pending: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400",
        in_progress: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
        scripting: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300",
        rendering: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300",
        completed: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
        failed: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
      },
    },
    defaultVariants: {
      variant: "draft",
    },
  },
);

const statusVariantMap: Record<DramaStatus | EpisodeStatus, VariantProps<typeof badgeVariants>["variant"]> = {
  draft: "draft",
  in_progress: "in_progress",
  completed: "completed",
  pending: "pending",
  scripting: "scripting",
  rendering: "rendering",
  failed: "failed",
};

const statusLabelMap: Record<DramaStatus | EpisodeStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
  pending: "Pending",
  scripting: "Scripting",
  rendering: "Rendering",
  failed: "Failed",
};

export interface PipelineStatusBadgeProps {
  status: DramaStatus | EpisodeStatus;
}

export function PipelineStatusBadge({ status }: PipelineStatusBadgeProps) {
  const variant = statusVariantMap[status] ?? "draft";
  const label = statusLabelMap[status] ?? status;

  return <span className={badgeVariants({ variant })}>{label}</span>;
}
// ✏️ EDIT ZONE END
