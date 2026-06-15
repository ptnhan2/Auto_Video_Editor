// ✏️ EDIT ZONE START
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut } from "lucide-react";
import type { PlayerRef } from "@remotion/player";

export interface TimelineControlsProps {
  /** PlayerRef từ Remotion Player để gọi play()/pause()/seekTo() */
  playerRef: React.RefObject<PlayerRef | null>;
  /** Tổng số frame của composition hiện tại */
  durationInFrames: number;
}

/**
 * Bộ điều khiển timeline chuyên nghiệp cho Remotion Player.
 *
 * Gồm:
 * - Nút Play/Pause (icon tự đổi theo trạng thái)
 * - Nút skip tới/lui 1 frame
 * - Thanh timeline trực quan hiển thị các track lane
 * - Timecode hiển thị frame hiện tại / tổng frame
 * - Zoom timeline
 *
 * State được poll liên tục từ PlayerRef qua requestAnimationFrame.
 * Khắc phục lỗi polling loop chết khi Player chưa mount: luôn schedule
 * frame tiếp theo kể cả khi ref đang null.
 */
export function TimelineControls({
  playerRef,
  durationInFrames,
}: TimelineControlsProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const rafRef = useRef<number | null>(null);
  const isPollingRef = useRef(false);

  const totalFrames = Math.max(durationInFrames, 1);
  const maxZoom = 10;
  const minZoom = 0.5;

  // ── Polling loop ──────────────────────────────────────────────
  const pollFrame = useCallback(() => {
    const ref = playerRef.current;
    if (ref) {
      setCurrentFrame(ref.getCurrentFrame());
      setIsPlaying(ref.isPlaying());
    }
    // LUÔN schedule frame tiếp theo — kể cả khi ref đang null
    // Fix bug: polling loop chết nếu Player chưa mount
    rafRef.current = requestAnimationFrame(pollFrame);
  }, [playerRef]);

  const startPolling = useCallback(() => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    rafRef.current = requestAnimationFrame(pollFrame);
  }, [pollFrame]);

  const stopPolling = useCallback(() => {
    isPollingRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  // ── Handlers ──────────────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    const ref = playerRef.current;
    if (!ref) return;
    if (ref.isPlaying()) {
      ref.pause();
    } else {
      ref.play();
    }
  }, [playerRef]);

  const handleSkipBack = useCallback(() => {
    const ref = playerRef.current;
    if (!ref) return;
    const frame = Math.max(0, ref.getCurrentFrame() - 1);
    ref.seekTo(frame);
  }, [playerRef]);

  const handleSkipForward = useCallback(() => {
    const ref = playerRef.current;
    if (!ref) return;
    const frame = Math.min(totalFrames - 1, ref.getCurrentFrame() + 1);
    ref.seekTo(frame);
  }, [playerRef, totalFrames]);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const frame = Number(e.target.value);
      setCurrentFrame(frame);
      playerRef.current?.seekTo(frame);
    },
    [playerRef],
  );

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(maxZoom, z + 0.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(minZoom, z - 0.5));
  }, []);

  // ── Derived ───────────────────────────────────────────────────
  const fps = 30;
  const currentSeconds = Math.floor(currentFrame / fps);
  const currentFrames = currentFrame % fps;
  const totalSeconds = Math.floor(totalFrames / fps);
  const totalFramesMod = totalFrames % fps;
  const timecode = `${String(currentSeconds).padStart(2, "0")}:${String(currentFrames).padStart(2, "0")}`;
  const durationTc = `${String(totalSeconds).padStart(2, "0")}:${String(totalFramesMod).padStart(2, "0")}`;
  const progressPercent = totalFrames > 0 ? (currentFrame / (totalFrames - 1)) * 100 : 0;

  // Track lanes visualization
  const trackLanes = [
    { name: "Video", color: "bg-blue-500/40", frames: totalFrames },
    { name: "Audio", color: "bg-green-500/40", frames: totalFrames },
  ];

  return (
    <div className="select-none space-y-2 rounded-lg border border-border bg-card">
      {/* ── Top bar: transport controls ── */}
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        {/* Play/Pause */}
        <button
          type="button"
          onClick={handlePlayPause}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-all hover:opacity-90 active:scale-95"
          aria-label={isPlaying ? "Pause" : "Play"}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Skip back */}
        <button
          type="button"
          onClick={handleSkipBack}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Previous frame"
          title="Previous frame"
        >
          <SkipBack className="h-3.5 w-3.5" />
        </button>

        {/* Skip forward */}
        <button
          type="button"
          onClick={handleSkipForward}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Next frame"
          title="Next frame"
        >
          <SkipForward className="h-3.5 w-3.5" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-border" />

        {/* Timecode */}
        <span className="min-w-[110px] text-center text-xs font-mono tabular-nums text-foreground">
          <span className="text-muted-foreground">{timecode}</span>
          <span className="mx-0.5 text-muted-foreground/50">/</span>
          {durationTc}
        </span>

        {/* Frame counter */}
        <span className="text-xs tabular-nums text-muted-foreground">
          Frame {currentFrame} / {totalFrames}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Zoom controls */}
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoom <= minZoom}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-30"
          aria-label="Zoom out"
          title="Zoom out"
        >
          <ZoomOut className="h-3 w-3" />
        </button>

        <span className="min-w-[36px] text-center text-xs tabular-nums text-muted-foreground">
          {zoom.toFixed(1)}×
        </span>

        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoom >= maxZoom}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-30"
          aria-label="Zoom in"
          title="Zoom in"
        >
          <ZoomIn className="h-3 w-3" />
        </button>
      </div>

      {/* ── Timeline track area ── */}
      <div className="px-3 pb-3">
        {/* Track labels + lanes */}
        <div className="mb-1.5 space-y-0.5">
          {trackLanes.map((track) => (
            <div key={track.name} className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {track.name}
              </span>
              <div className="relative h-5 flex-1 overflow-hidden rounded-sm bg-muted/50">
                {/* Track lane fill */}
                <div
                  className={`absolute inset-y-0 left-0 rounded-sm ${track.color}`}
                  style={{ width: `${progressPercent}%` }}
                />
                {/* Playhead */}
                <div
                  className="absolute inset-y-0 w-0.5 bg-primary shadow-[0_0_4px_var(--primary)]"
                  style={{ left: `${progressPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Seek bar */}
        <input
          type="range"
          min={0}
          max={totalFrames - 1}
          value={currentFrame}
          onChange={handleSeek}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
          aria-label="Seek timeline"
        />

        {/* Frame markers */}
        <div className="mt-0.5 flex justify-between px-0.5">
          <span className="text-[9px] tabular-nums text-muted-foreground/50">0</span>
          <span className="text-[9px] tabular-nums text-muted-foreground/50">
            {Math.floor(totalFrames / 4)}f
          </span>
          <span className="text-[9px] tabular-nums text-muted-foreground/50">
            {Math.floor(totalFrames / 2)}f
          </span>
          <span className="text-[9px] tabular-nums text-muted-foreground/50">
            {Math.floor((totalFrames * 3) / 4)}f
          </span>
          <span className="text-[9px] tabular-nums text-muted-foreground/50">
            {totalFrames}f
          </span>
        </div>
      </div>
    </div>
  );
}
// ✏️ EDIT ZONE END
