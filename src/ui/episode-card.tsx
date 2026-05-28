// ✏️ EDIT ZONE START
import { Clapperboard, Clock } from "lucide-react";
import type { Episode } from "@/shared/types/episode";
import { StatusBadge } from "./StatusBadge";

export interface EpisodeCardProps {
  episode: Episode;
}

export function EpisodeCard({ episode }: EpisodeCardProps) {
  const timeAgo = formatTimeAgo(episode.createdAt);

  return (
    <article className="group rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Clapperboard className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
            {episode.dramaTitle ?? "Unknown Drama"}
          </span>
        </div>
        <StatusBadge status={episode.status} />
      </div>
      <h3 className="mt-2 text-base font-semibold text-card-foreground leading-snug">
        Ep {episode.episodeNumber}: {episode.title}
      </h3>
      {episode.description && (
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
          {episode.description}
        </p>
      )}
      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <time dateTime={episode.createdAt}>{timeAgo}</time>
      </div>
    </article>
  );
}

function formatTimeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w ago`;
}
// ✏️ EDIT ZONE END
