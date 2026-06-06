// ✏️ EDIT ZONE START
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import type { PlayerRef } from "@remotion/player";

export interface TimelineControlsProps {
  /** PlayerRef từ Remotion Player để gọi play()/pause()/seekTo() */
  playerRef: React.RefObject<PlayerRef | null>;
  /** Tổng số frame của composition hiện tại */
  durationInFrames: number;
}

/**
 * Timeline điều khiển Remotion Player: nút Play/Pause, thanh seek kéo được,
 * hiển thị frame hiện tại trên tổng số frame.
 *
 * Khi seek, gọi `playerRef.current.seekTo(frame)`.
 * Frame counter cập nhật liên tục qua `requestAnimationFrame` polling.
 */
export function TimelineControls({
  playerRef,
  durationInFrames,
}: TimelineControlsProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Poll current frame from player mỗi animation frame
  const pollFrame = useCallback(() => {
    const ref = playerRef.current;
    if (!ref) return;
    setCurrentFrame(ref.getCurrentFrame());
    setIsPlaying(ref.isPlaying());
    rafRef.current = requestAnimationFrame(pollFrame);
  }, [playerRef]);

  const startPolling = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(pollFrame);
  }, [pollFrame]);

  const stopPolling = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Auto-poll khi component mount; cleanup khi unmount
  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  const handlePlayPause = useCallback(() => {
    const ref = playerRef.current;
    if (!ref) return;
    if (ref.isPlaying()) {
      ref.pause();
    } else {
      ref.play();
    }
  }, [playerRef]);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const frame = Number(e.target.value);
      setCurrentFrame(frame);
      playerRef.current?.seekTo(frame);
    },
    [playerRef],
  );

  const totalFrames = Math.max(durationInFrames, 1);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      {/* Play / Pause button */}
      <button
        type="button"
        onClick={handlePlayPause}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:opacity-90"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </button>

      {/* Frame counter */}
      <span className="min-w-[80px] text-center text-sm tabular-nums text-muted-foreground">
        {currentFrame} / {totalFrames}
      </span>

      {/* Seek bar */}
      <input
        type="range"
        min={0}
        max={totalFrames - 1}
        value={currentFrame}
        onChange={handleSeek}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
        aria-label="Seek timeline"
      />
    </div>
  );
}
// ✏️ EDIT ZONE END
