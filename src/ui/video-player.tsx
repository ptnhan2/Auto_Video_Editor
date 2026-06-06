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
 * Loading state hiển thị spinner khi Remotion bundle đang được lazy-load.
 */
function PlayerLoading() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-card text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm">Loading composition...</p>
    </div>
  );
}

/**
 * Error state hiển thị khi composition không tồn tại hoặc load thất bại.
 */
interface PlayerErrorProps {
  /** Thông báo lỗi hiển thị cho user */
  message: string;
}

function PlayerError({ message }: PlayerErrorProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-card text-destructive">
      <AlertTriangle className="h-8 w-8" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

/**
 * Trình phát Remotion Player — nhận composition ID, lazy-load component từ
 * registry, và truyền PlayerRef để điều khiển từ bên ngoài.
 *
 * Sử dụng React.lazy để dynamic import composition component client-side only.
 * Hiển thị loading spinner trong lúc chờ bundle tải về, và error state nếu
 * composition không tồn tại trong registry.
 */
export function VideoPlayer({
  compositionId,
  playerRef,
}: VideoPlayerProps) {
  const def = COMPOSITIONS.find((c) => c.id === compositionId);

  // Error state: composition ID không tồn tại trong registry
  if (!def) {
    return (
      <PlayerError message={`Composition "${compositionId}" not found.`} />
    );
  }

  // React.lazy → dynamic import Remotion component client-side only
  const Comp = React.lazy(def.component);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-black">
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
          style={{
            width: "100%",
            aspectRatio: `${def.width} / ${def.height}`,
            maxHeight: "60vh",
          }}
        />
      </Suspense>
    </div>
  );
}
// ✏️ EDIT ZONE END
