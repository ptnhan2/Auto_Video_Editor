// ✏️ EDIT ZONE START
"use client";

import React, { Suspense } from "react";
import { Player } from "@remotion/player";
import type { PlayerRef } from "@remotion/player";
import { Loader2, AlertTriangle } from "lucide-react";
import { COMPOSITIONS } from "./composition-registry";

export interface VideoPlayerProps {
  /** Episode ID (từ route /editor/[id]) */
  episodeId: string;
  /** Composition ID đang được chọn */
  compositionId: string;
  /** PlayerRef để TimelineControls có thể gọi play()/pause()/seekTo() */
  playerRef: React.RefObject<PlayerRef | null>;
}

/**
 * Loading state hiển thị khi Remotion bundle đang được lazy-load.
 * Spinner với animation và text "Loading composition..."
 */
function PlayerLoading() {
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center gap-3 rounded-lg bg-card/30 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="text-xs font-medium">Loading composition...</p>
    </div>
  );
}

/**
 * Error state hiển thị khi composition không tồn tại trong registry.
 * Icon AlertTriangle + message đỏ.
 */
interface PlayerErrorProps {
  /** Thông báo lỗi hiển thị cho user */
  message: string;
}

function PlayerError({ message }: PlayerErrorProps) {
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive">
      <AlertTriangle className="h-6 w-6" />
      <p className="text-xs font-medium">{message}</p>
    </div>
  );
}

/**
 * Trình phát Remotion Player wrapper — bọc Player từ @remotion/player.
 *
 * Nhận compositionId và playerRef, lazy-load composition component từ
 * registry qua React.lazy(). Hiển thị loading spinner trong lúc chờ
 * import, và error state nếu composition không tồn tại.
 *
 * Style: dark background, border tinh tế, player responsive với aspect-ratio.
 */
export function VideoPlayer({
  compositionId,
  playerRef,
}: VideoPlayerProps) {
  const def = COMPOSITIONS.find((c) => c.id === compositionId);

  if (!def) {
    return (
      <PlayerError message={`Composition "${compositionId}" not found.`} />
    );
  }

  const Comp = React.lazy(def.component);

  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-black shadow-2xl shadow-black/50">
      <Suspense fallback={<PlayerLoading />}>
        <Player
          ref={playerRef}
          component={Comp}
          durationInFrames={def.durationInFrames}
          compositionWidth={def.width}
          compositionHeight={def.height}
          fps={def.fps}
          controls={false}
          showVolumeControls={false}
          clickToPlay
          spaceKeyToPlayOrPause
          acknowledgeRemotionLicense
          style={{
            width: "100%",
            aspectRatio: `${def.width} / ${def.height}`,
            maxHeight: "calc(100vh - 260px)",
          }}
        />
      </Suspense>
    </div>
  );
}
// ✏️ EDIT ZONE END
