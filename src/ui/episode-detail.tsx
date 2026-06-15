// ✏️ EDIT ZONE START (1-EOF)
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clapperboard,
  Clock,
  Calendar,
  Hash,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Circle,
  Play,
  FileText,
  Scissors,
  Layout,
  Volume2,
  Eye,
  Music,
  Film,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Episode, Drama } from "@/shared/types/episode";
import { mapEpisodeRow } from "@/shared/mappers";
import { StatusBadge } from "./StatusBadge";

// ── Pipeline step types ──

export type StepStatus = "pending" | "in_progress" | "completed" | "failed";

export interface PipelineStepDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  index: number; // S1=0 ... S7=6
}

export interface PipelineStep extends PipelineStepDef {
  status: StepStatus;
  timestamp: string | null;
}

const PIPELINE_STEPS: PipelineStepDef[] = [
  { id: "S1", label: "Script Rewriter", icon: FileText, index: 0 },
  { id: "S2", label: "Extractor", icon: Scissors, index: 1 },
  { id: "S3", label: "Storyboard Breaker", icon: Layout, index: 2 },
  { id: "S4", label: "Audio / TTS", icon: Volume2, index: 3 },
  { id: "S5", label: "Visual Director", icon: Eye, index: 4 },
  { id: "S6", label: "Sound / VFX", icon: Music, index: 5 },
  { id: "S7", label: "Video Compiler", icon: Film, index: 6 },
];

/**
 * Derives pipeline steps and their status/timestamps from overall episode status.
 * (Vietnam: Docstring chi tiết mô tả hàm xử lý theo Rule I)
 * @param episode - The Episode object to calculate steps from
 * @returns Array of 7 PipelineStep objects with statuses and timestamps
 */
export function derivePipelineSteps(episode: { status: string; updatedAt: string }): PipelineStep[] {
  const { status } = episode;

  // Determine step statuses based on overall status
  return PIPELINE_STEPS.map((def) => {
    let stepStatus: StepStatus = "pending";

    if (status === "scripting") {
      if (def.index === 0) stepStatus = "completed";
      else if (def.index === 1) stepStatus = "in_progress";
    } else if (status === "rendering") {
      if (def.index <= 4) stepStatus = "completed";
    } else if (status === "completed") {
      stepStatus = "completed";
    } else if (status === "failed") {
      if (def.index <= 2) stepStatus = "completed";
      else if (def.index === 3) stepStatus = "failed";
    }

    return {
      ...def,
      status: stepStatus,
      timestamp: stepStatus !== "pending" ? episode.updatedAt : null,
    };
  });
}

// ── UI Data fetching ──

type DataState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; episode: Episode; drama: Drama | null };

interface EpisodeDetailProps {
  episodeId: string;
}

/**
 * EpisodeDetail main component displaying episode metadata and its pipeline tracker.
 * (Vietnam: Component hiển thị chi tiết episode cùng thanh trạng thái pipeline stepper)
 * @param props.episodeId - ID of the episode to load
 * @returns React Element for the Episode Detail screen
 */
export function EpisodeDetail({ episodeId }: EpisodeDetailProps) {
  const [data, setData] = useState<DataState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [epRes, dramaRes] = await Promise.all([
          fetch("/api/episodes?limit=100"),
          fetch("/api/dramas"),
        ]);
        if (!epRes.ok) throw new Error(`HTTP ${epRes.status}`);
        const json = await epRes.json();
        const dramas: Drama[] = dramaRes.ok
          ? (await dramaRes.json()).dramas ?? []
          : [];
        const rows: Record<string, unknown>[] = json.episodes ?? [];
        const found = rows.find((r) => r.id === episodeId);

        if (!found) {
          if (!cancelled) {
            setData({ status: "error", message: "Episode not found." });
          }
          return;
        }

        const episode = mapEpisodeRow(found, dramas);
        const drama = dramas.find((d) => d.id === episode.dramaId) ?? null;

        if (!cancelled) {
          setData({ status: "success", episode, drama });
        }
      } catch (err) {
        console.error("[EpisodeDetail] Fetch error:", err);
        if (!cancelled) {
          setData({ status: "error", message: "Failed to load episode." });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [episodeId]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Episodes
      </Link>

      {data.status === "loading" && <DetailSkeleton />}
      {data.status === "error" && <ErrorDisplay message={data.message} />}
      {data.status === "success" && (
        <EpisodeContent episode={data.episode} drama={data.drama} />
      )}
    </div>
  );
}

function EpisodeContent({
  episode,
  drama,
}: {
  episode: Episode;
  drama: Drama | null;
}) {
  const pipelineSteps = useMemo(() => derivePipelineSteps(episode), [episode]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-10 animate-in fade-in duration-500">
      {/* Left column: Info card */}
      <div className="lg:col-span-2 space-y-6">
        <InfoCard episode={episode} drama={drama} />
        <AssetList />
      </div>

      {/* Right column: Pipeline stepper */}
      <div className="lg:col-span-3">
        <PipelineStepper steps={pipelineSteps} episodeId={episode.id} />
      </div>
    </div>
  );
}

function InfoCard({ episode, drama }: { episode: Episode; drama: Drama | null }) {
  const formatDuration = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatDate = (iso: string): string => {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-sm">
      {/* Drama name */}
      {drama && (
        <div className="flex items-center gap-2">
          <Clapperboard className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
            {drama.title}
          </span>
        </div>
      )}

      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-card-foreground leading-snug">
          Ep {episode.episodeNumber}: {episode.title}
        </h1>
        {episode.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {episode.description}
          </p>
        )}
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-4 border-t border-b border-border py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Hash className="h-4 w-4 shrink-0" />
          <span>Episode {episode.episodeNumber}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0" />
          <span>{formatDuration(episode.duration)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground col-span-2">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>Created {formatDate(episode.createdAt)}</span>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-sm font-medium text-muted-foreground">Status</span>
        <StatusBadge status={episode.status} />
      </div>
    </div>
  );
}

function PipelineStepper({
  steps,
  episodeId,
}: {
  steps: PipelineStep[];
  episodeId: string;
}) {
  const handleRunPipeline = () => {
    // TODO: POST /api/pipeline/run when API is ready
    console.log("Pipeline triggered for", episodeId);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-bold text-card-foreground">
            Pipeline Status
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track video production progress
          </p>
        </div>
        <button
          type="button"
          onClick={handleRunPipeline}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 active:scale-95 transition-all shadow-sm"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          Run Pipeline
        </button>
      </div>

      {/* Vertical stepper */}
      <div className="relative pl-1">
        {steps.map((step, i) => (
          <StepRow
            key={step.id}
            step={step}
            isLast={i === steps.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

const stepColorMap: Record<StepStatus, { iconClass: string; lineClass: string }> = {
  pending: {
    iconClass: "text-muted-foreground/40 bg-muted/50 border-border dark:bg-muted/20",
    lineClass: "bg-border",
  },
  in_progress: {
    iconClass: "text-chart-1 bg-chart-1/15 border-chart-1/30 dark:bg-chart-1/20",
    lineClass: "bg-chart-1/20",
  },
  completed: {
    iconClass: "text-chart-2 bg-chart-2/15 border-chart-2/30 dark:bg-chart-2/20",
    lineClass: "bg-chart-2/20",
  },
  failed: {
    iconClass: "text-destructive bg-destructive/15 border-destructive/30 dark:bg-destructive/20",
    lineClass: "bg-destructive/20",
  },
};

function StepRow({ step, isLast }: { step: PipelineStep; isLast: boolean }) {
  const colors = stepColorMap[step.status];
  const IconComp = step.icon;
  const formatTs = (ts: string | null): string => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex gap-4">
      {/* Connector line + icon column */}
      <div className="flex flex-col items-center">
        {/* Icon circle */}
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-solid transition-colors duration-200",
            colors.iconClass,
          )}
        >
          {step.status === "completed" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : step.status === "failed" ? (
            <AlertCircle className="h-4 w-4" />
          ) : step.status === "in_progress" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
        </div>
        {/* Vertical line */}
        {!isLast && (
          <div className={cn("w-0.5 flex-grow min-h-[1.75rem] my-1", colors.lineClass)} />
        )}
      </div>

      {/* Label + timestamp */}
      <div className="pb-6 flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2">
          <IconComp
            className={cn(
              "h-4 w-4 shrink-0",
              step.status === "pending" ? "text-muted-foreground/40" : "text-card-foreground",
            )}
          />
          <p
            className={cn(
              "text-sm font-semibold leading-none",
              step.status === "pending" ? "text-muted-foreground/50" : "text-card-foreground",
            )}
          >
            {step.id}: {step.label}
          </p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground font-medium">
          {step.status === "pending" && "Awaiting pipeline trigger"}
          {step.status === "in_progress" && "Processing assets..."}
          {step.status === "completed" && `Finished at ${formatTs(step.timestamp)}`}
          {step.status === "failed" && `Failed at ${formatTs(step.timestamp)}`}
        </p>
      </div>
    </div>
  );
}

function AssetList() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm">
      <h3 className="text-sm font-bold text-card-foreground">Assets</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Assets for this episode will appear here once the pipeline starts.
      </p>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
        <p className="text-xs text-muted-foreground font-medium">
          No assets yet — run pipeline to produce audio, visual and storyboard assets.
        </p>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-10 animate-in fade-in duration-500">
      {/* Info card skeleton */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-sm">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-b border-border py-4">
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-6 w-24 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm">
          <div className="h-5 w-16 rounded bg-muted animate-pulse" />
          <div className="h-24 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
      {/* Stepper skeleton */}
      <div className="lg:col-span-3">
        <div className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-sm">
          <div className="h-6 w-32 rounded bg-muted animate-pulse" />
          <div className="space-y-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 w-36 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-16 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">
        Something went wrong
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {message}
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Episodes
      </Link>
    </div>
  );
}
// ✏️ EDIT ZONE END (1-EOF)
