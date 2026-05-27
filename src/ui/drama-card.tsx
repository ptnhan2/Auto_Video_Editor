// ✏️ EDIT ZONE START
import { Film } from "lucide-react";
import type { Drama } from "@/shared/types/episode";
import { StatusBadge } from "./status-badge";

export interface DramaCardProps {
  drama: Drama;
}

export function DramaCard({ drama }: DramaCardProps) {
  return (
    <article className="group rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Film className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-card-foreground">
            {drama.title}
          </h3>
          {drama.genre && (
            <p className="mt-0.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {drama.genre}
            </p>
          )}
        </div>
        <StatusBadge status={drama.status} />
      </div>
      {drama.description && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
          {drama.description}
        </p>
      )}
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span>{drama.totalEpisodes} episodes</span>
        <span aria-hidden="true">&middot;</span>
        <span>{formatDuration(drama.totalDuration)}</span>
      </div>
    </article>
  );
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}
// ✏️ EDIT ZONE END
