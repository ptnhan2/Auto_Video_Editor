// ✏️ EDIT ZONE START
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Film, Loader2 } from "lucide-react";
import type { Episode, Drama } from "@/shared/types/episode";
import { DramaCard } from "./drama-card";
import { EpisodeCard } from "./episode-card";
import { CreateEpisodeForm } from "./create-episode-form";

type DataState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; episodes: Episode[]; dramas: Drama[] };

/** Map API snake_case row → camelCase Episode */
function mapEpisodeRow(row: Record<string, unknown>, dramas: Drama[]): Episode {
  return {
    id: row.id as string,
    dramaId: (row.drama_id ?? "") as string,
    dramaTitle: dramas.find((d) => d.id === (row.drama_id as string))?.title,
    episodeNumber: (row.episode_number ?? 1) as number,
    title: (row.title ?? "") as string,
    content: (row.content ?? null) as string | null,
    scriptContent: (row.script_content ?? null) as string | null,
    description: (row.description ?? null) as string | null,
    duration: (row.duration ?? 0) as number,
    status: (row.status ?? "draft") as Episode["status"],
    videoUrl: (row.video_url ?? null) as string | null,
    thumbnail: (row.thumbnail ?? null) as string | null,
    createdAt: (row.created_at ?? "") as string,
    updatedAt: (row.updated_at ?? "") as string,
  };
}

export function LandingClient() {
  const [data, setData] = useState<DataState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [epRes, dramaRes] = await Promise.all([
          fetch("/api/episodes?limit=50"),
          fetch("/api/dramas"),
        ]);
        if (!epRes.ok) throw new Error(`HTTP ${epRes.status}`);
        const json = await epRes.json();
        const dramas: Drama[] = dramaRes.ok
          ? (await dramaRes.json()).dramas ?? []
          : [];
        const episodes: Episode[] = (json.episodes ?? []).map((r: Record<string, unknown>) =>
          mapEpisodeRow(r, dramas),
        );
        if (!cancelled) {
          setData({ status: "success", episodes, dramas });
        }
      } catch (err) {
        console.error("[LandingClient] Failed to fetch episodes:", err);
        if (!cancelled) {
          setData({ status: "error", message: "Failed to load data." });
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const handleCreateEpisode = async (dramaId: string, title: string) => {
    // Determine next episode number from existing episodes
    let nextNumber = 1;
    if (data.status === "success") {
      const existingNums = data.episodes
        .filter((ep) => ep.dramaId === dramaId)
        .map((ep) => ep.episodeNumber);
      nextNumber = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    }

    const res = await fetch("/api/episodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        drama_id: dramaId,
        episode_number: nextNumber,
        title,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
    }

    const json = await res.json();
    const currentDramas = data.status === "success" ? data.dramas : [];
    const newEpisode = mapEpisodeRow(json.episode, currentDramas);

    setData((prev) => {
      if (prev.status !== "success") return prev;
      return {
        ...prev,
        episodes: [newEpisode, ...prev.episodes],
      };
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Auto Video Editor
          </h1>
          <p className="mt-2 max-w-lg text-base text-muted-foreground leading-relaxed">
            Manage your AI-generated dramas and episodes. Create, script, and render
            video content from a single dashboard.
          </p>
        </div>
        {data.status === "success" && (
          <CreateEpisodeForm
            dramas={data.dramas}
            onCreateEpisode={handleCreateEpisode}
          />
        )}
      </header>

      {/* Content */}
      {data.status === "loading" && <LoadingSkeleton />}
      {data.status === "error" && <ErrorDisplay message={data.message} />}
      {data.status === "success" && (
        <ContentBody episodes={data.episodes} dramas={data.dramas} />
      )}
    </div>
  );
}

function ContentBody({
  episodes,
  dramas,
}: {
  episodes: Episode[];
  dramas: Drama[];
}) {
  return (
    <div className="mt-14 space-y-16">
      {/* Episodes Section */}
      <section>
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            Recent Episodes
          </h2>
        </div>
        {episodes.length === 0 ? (
          <EmptyState
            title="No episodes yet"
            description="Click 'Create New Episode' above to get started."
          />
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {episodes.map((ep) => (
              <Link key={ep.id} href={`/episodes/${ep.id}`} className="block">
                <EpisodeCard episode={ep} />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Dramas Section */}
      <section>
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Dramas</h2>
        </div>
        {dramas.length === 0 ? (
          <EmptyState
            title="No dramas yet"
            description="Create your first drama to start producing episodes."
          />
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {dramas.map((drama) => (
              <Link key={drama.id} href={`/dramas/${drama.id}`} className="block">
                <DramaCard drama={drama} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mt-14 space-y-16 animate-in fade-in duration-500">
      {/* Episodes skeleton */}
      <section>
        <div className="h-5 w-36 rounded bg-muted" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-card p-5 space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="ml-auto h-5 w-16 rounded-full bg-muted" />
              </div>
              <div className="h-5 w-3/4 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-3 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>
      {/* Dramas skeleton */}
      <section>
        <div className="h-5 w-24 rounded bg-muted" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-card p-5 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-5 w-2/3 rounded bg-muted" />
                  <div className="h-3 w-16 rounded bg-muted" />
                </div>
                <div className="h-5 w-16 rounded-full bg-muted" />
              </div>
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Film className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="mt-14 flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <Loader2 className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">
        Something went wrong
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {message}
      </p>
    </div>
  );
}
// ✏️ EDIT ZONE END
