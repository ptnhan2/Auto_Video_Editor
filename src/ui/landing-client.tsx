// ✏️ EDIT ZONE START
"use client";

import { useState, useEffect } from "react";
import { Film, Loader2 } from "lucide-react";
import type { Episode, Drama } from "@/shared/types/episode";
import { mockEpisodes, mockDramas } from "./mock-data";
import { DramaCard } from "./drama-card";
import { EpisodeCard } from "./episode-card";
import { CreateEpisodeForm } from "./create-episode-form";

type DataState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; episodes: Episode[]; dramas: Drama[] };

export function LandingClient() {
  const [data, setData] = useState<DataState>({ status: "loading" });

  useEffect(() => {
    // TODO(#163): Replace with fetch("/api/episodes") when API is ready
    const timer = setTimeout(() => {
      try {
        setData({
          status: "success",
          episodes: mockEpisodes,
          dramas: mockDramas,
        });
      } catch {
        setData({
          status: "error",
          message: "Failed to load data.",
        });
      }
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleCreateEpisode = async (dramaId: string, title: string) => {
    // TODO(#163): Replace with POST /api/episodes when API is ready
    // Simulate network delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 800));
    const newEpisode: Episode = {
      id: `ep_mock_${Date.now()}`,
      dramaId,
      dramaTitle: mockDramas.find((d) => d.id === dramaId)?.title ?? "Unknown",
      episodeNumber: 1,
      title,
      content: null,
      scriptContent: null,
      description: null,
      duration: 0,
      status: "draft",
      videoUrl: null,
      thumbnail: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
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
              <EpisodeCard key={ep.id} episode={ep} />
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
              <DramaCard key={drama.id} drama={drama} />
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
