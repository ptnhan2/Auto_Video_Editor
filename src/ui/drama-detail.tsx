// ✏️ EDIT ZONE START
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Film, Loader2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Episode, Drama } from "@/shared/types/episode";
import { mapEpisodeRow } from "@/shared/mappers";
import { StatusBadge } from "@/ui/StatusBadge";
import { EpisodeCard } from "@/ui/episode-card";

// ── Data state ──

type DataState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; drama: Drama; episodes: Episode[] };

// ── Main component ──

interface DramaDetailProps {
  dramaId: string;
}

/**
 * DramaDetail component — hiển thị chi tiết drama + danh sách episodes thuộc drama đó.
 * @param dramaId - ID của drama cần hiển thị
 */
export function DramaDetail({ dramaId }: DramaDetailProps) {
  const [data, setData] = useState<DataState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [dramaRes, epRes] = await Promise.all([
          fetch("/api/dramas"),
          fetch("/api/episodes?limit=100"),
        ]);

        if (!dramaRes.ok) throw new Error(`Drama API HTTP ${dramaRes.status}`);
        if (!epRes.ok) throw new Error(`Episode API HTTP ${epRes.status}`);

        const dramaJson = await dramaRes.json();
        const epJson = await epRes.json();

        const dramas: Drama[] = dramaJson.dramas ?? [];
        const drama = dramas.find((d) => d.id === dramaId);

        if (!drama) {
          if (!cancelled) setData({ status: "error", message: "Drama not found." });
          return;
        }

        const rows: Record<string, unknown>[] = epJson.episodes ?? [];
        const episodes: Episode[] = rows
          .map((r) => mapEpisodeRow(r, dramas))
          .filter((ep) => ep.dramaId === dramaId);

        if (!cancelled) setData({ status: "success", drama, episodes });
      } catch (err) {
        console.error("[DramaDetail]", err);
        if (!cancelled) setData({ status: "error", message: "Failed to load drama." });
      }
    }

    load();
    return () => { cancelled = true; };
  }, [dramaId]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      {data.status === "loading" && <Skeleton />}
      {data.status === "error" && <ErrorDisplay message={data.message} />}
      {data.status === "success" && <DramaContent drama={data.drama} episodes={data.episodes} />}
    </div>
  );
}

// ── Success state ──

function DramaContent({ drama, episodes }: { drama: Drama; episodes: Episode[] }) {
  const formatDuration = (sec: number): string => {
    const m = Math.round(sec / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r > 0 ? `${h}h ${r}m` : `${h}h`;
  };

  const formatDate = (iso: string): string =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Drama info card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-card-foreground leading-snug">
              {drama.title}
            </h1>
            {drama.genre && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {drama.genre}
              </p>
            )}
          </div>
          <StatusBadge status={drama.status} />
        </div>

        {drama.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {drama.description}
          </p>
        )}

        <div className="grid grid-cols-3 gap-4 border-t border-b border-border py-4">
          <div className="text-center">
            <p className="text-xl font-bold text-card-foreground">{drama.totalEpisodes}</p>
            <p className="text-xs text-muted-foreground">Episodes</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-card-foreground">{formatDuration(drama.totalDuration)}</p>
            <p className="text-xs text-muted-foreground">Duration</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-card-foreground">{formatDate(drama.createdAt)}</p>
            <p className="text-xs text-muted-foreground">Created</p>
          </div>
        </div>
      </div>

      {/* Episodes list */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Film className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Episodes</h2>
        </div>
        {episodes.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">No episodes yet for this drama.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {episodes.map((ep) => (
              <Link key={ep.id} href={`/episodes/${ep.id}`} className="block">
                <EpisodeCard episode={ep} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Skeleton ──

function Skeleton() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-sm">
        <div className="h-7 w-2/3 rounded bg-muted animate-pulse" />
        <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-3 gap-4 border-t border-b border-border py-4">
          <div className="h-8 rounded bg-muted animate-pulse" />
          <div className="h-8 rounded bg-muted animate-pulse" />
          <div className="h-8 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-5 w-24 rounded bg-muted animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
              <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-3 w-16 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Error ──

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-16 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">Something went wrong</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground leading-relaxed">{message}</p>
      <Link href="/" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
    </div>
  );
}
// ✏️ EDIT ZONE END
