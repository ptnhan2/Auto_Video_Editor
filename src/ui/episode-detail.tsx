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
  ExternalLink,
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

function derivePipelineSteps(episode: Episode): PipelineStep[] {
  const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const status = episode.status;

  if (status === "completed") {
    return PIPELINE_STEPS.map((step) => ({ ...step, status: "completed" as StepStatus, timestamp: now }));
  }
  if (status === "failed") {
    return PIPELINE_STEPS.map((step, i) => ({
      ...step,
      status: i <= 2 ? "completed" : i === 3 ? "failed" : "pending",
      timestamp: i <= 3 ? now : null,
    }));
  }
  if (status === "scripting") {
    return PIPELINE_STEPS.map((step, i) => ({
      ...step,
      status: i === 0 ? "completed" : "pending",
      timestamp: i === 0 ? now : null,
    }));
  }
  if (status === "rendering") {
    return PIPELINE_STEPS.map((step, i) => ({
      ...step,
      status: i <= 3 ? "completed" : "pending",
      timestamp: i <= 3 ? now : null,
    }));
  }
  return PIPELINE_STEPS.map((step) => ({ ...step, status: "pending" as StepStatus, timestamp: null }));
}

interface EpisodeDetailProps {
  episodeId: string;
}

export function EpisodeDetail({ episodeId }: EpisodeDetailProps) {
  const [data, setData] = useState<DataState>({ status: "loading" });
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

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
  }, [episodeId, refreshKey]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
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
        <EpisodeContent episode={data.episode} drama={data.drama} onRefresh={handleRefresh} />
      )}
    </div>
  );
}

function EpisodeContent({
  episode,
  drama,
  onRefresh,
}: {
  episode: Episode;
  drama: Drama | null;
  onRefresh?: () => void;
}) {
  const pipelineSteps = useMemo(() => derivePipelineSteps(episode), [episode]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-10 animate-in fade-in duration-500">
      <div className="lg:col-span-2 space-y-6">
        <InfoCard episode={episode} drama={drama} />
        <AssetList />
      </div>
      <div className="lg:col-span-3">
        <PipelineStepper steps={pipelineSteps} episodeId={episode.id} status={episode.status} onRefresh={onRefresh} />
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
      {drama && (
        <div className="flex items-center gap-2">
          <Clapperboard className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
            {drama.title}
          </span>
        </div>
      )}

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

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">
            Episode {episode.episodeNumber}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">
            {formatDuration(episode.duration)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">
            Created {formatDate(episode.createdAt)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <span className="text-sm text-muted-foreground">Status</span>
        <StatusBadge status={episode.status} />
      </div>
    </div>
  );
}

function AssetList() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">
        Assets
      </h3>
      <p className="text-xs text-muted-foreground">
        Assets for this episode will appear here once the pipeline starts.
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        No assets yet — run pipeline to produce audio, visual and storyboard assets.
      </p>
    </div>
  );
}

function PipelineStepper({
  steps,
  episodeId,
  status,
  onRefresh,
}: {
  steps: PipelineStep[];
  episodeId: string;
  status: string;
  onRefresh?: () => void;
}) {
  const [isRunning, setIsRunning] = useState(false);

  const handleRunPipeline = async () => {
    setIsRunning(true);
    try {
      const res = await fetch(`/api/episodes/${episodeId}/run`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to start pipeline");
        setIsRunning(false);
        return;
      }
    } catch {
      alert("Network error");
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/episodes/${episodeId}`);
        if (!res.ok) return;
        const { episode } = await res.json();
        if (episode?.status === "completed" || episode?.status === "failed") {
          setIsRunning(false);
        }
        onRefresh?.();
      } catch {
        /* ignore polling errors */
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning, episodeId, onRefresh]);

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
          disabled={isRunning}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          {isRunning ? "Running..." : "Run Pipeline"}
        </button>
        <button
          type="button"
          onClick={() => {
            const jsonUrl = `${window.location.origin}/api/opencut/json/${episodeId}`;
            window.open(`http://localhost:3001/editor/new?import=${encodeURIComponent(jsonUrl)}`, "_blank");
          }}
          disabled={status !== "completed"}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open in Editor
        </button>
      </div>

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

function StepRow({ step, isLast }: { step: PipelineStep; isLast: boolean }) {
  const iconMap: Record<StepStatus, React.ReactNode> = {
    completed: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    in_progress: <Loader2 className="h-5 w-5 animate-spin text-blue-500" />,
    failed: <AlertCircle className="h-5 w-5 text-red-500" />,
    pending: <Circle className="h-5 w-5 text-muted-foreground/30" />,
  };

  const statusLabel: Record<StepStatus, string> = {
    completed: "Finished",
    in_progress: "Running...",
    failed: "Failed",
    pending: "Awaiting pipeline trigger",
  };

  return (
    <div className="flex gap-4 pb-5 relative">
      <div className="flex flex-col items-center">
        <div className="rounded-full bg-card p-0.5">
          {iconMap[step.status]}
        </div>
        {!isLast && (
          <div
            className={cn(
              "w-0.5 flex-1 mt-2",
              step.status === "completed" ? "bg-green-500" : "bg-border"
            )}
          />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-card-foreground">
            {step.id}: {step.label}
          </p>
          {step.timestamp && (
            <span className="text-xs text-muted-foreground">
              {statusLabel[step.status]} {step.status === "completed" ? `at ${step.timestamp}` : ""}
            </span>
          )}
        </div>
        {step.status === "pending" && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {statusLabel[step.status]}
          </p>
        )}
      </div>
    </div>
  );
}

type DataState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; episode: Episode; drama: Drama | null };

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 space-y-8 animate-pulse">
      <div className="h-4 w-24 bg-muted rounded" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 bg-muted rounded-xl" />
          <div className="h-48 bg-muted rounded-xl" />
        </div>
        <div className="lg:col-span-3">
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-4" />
        <p className="text-sm text-destructive">{message}</p>
      </div>
    </div>
  );
}
