// ✏️ EDIT ZONE START
"use client";

import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Play, Pause, SkipBack, SkipForward, Eye, EyeOff, Volume2, VolumeX } from "lucide-react";
import type { PlayerRef } from "@remotion/player";

// ── Types ────────────────────────────────────────────────────────
export interface TimelineClip {
  id: string;
  assetId: string;
  name: string;
  type: "video" | "image" | "audio" | "text";
  trackId: string;
  startFrame: number;
  durationFrames: number;
}

export interface TimelineControlsProps {
  playerRef: React.RefObject<PlayerRef | null>;
  durationInFrames: number;
  /** Các clip đang có trên timeline */
  clips: TimelineClip[];
  /** ID clip đang được chọn */
  selectedClipId: string | null;
  /** Callback khi user click chọn clip */
  onSelectClip: (clipId: string | null) => void;
  /** Callback khi user click vào vùng timeline trống để seek */
  onTimelineSeek: (frame: number) => void;
  /** Callback khi clip bị kéo di chuyển */
  onClipMove?: (clipId: string, newStartFrame: number) => void;
  /** Callback khi drop asset vào timeline — nhận frame, trackId, và asset data */
  onTimelineDrop?: (frame: number, trackId: string, assetData: Record<string, unknown>) => void;
}

interface TrackDef {
  id: string;
  name: string;
  color: string;
  icon: React.ReactNode;
}

const TRACKS: TrackDef[] = [
  { id: "video", name: "Video", color: "bg-blue-500/50", icon: <Eye className="h-3 w-3" /> },
  { id: "audio", name: "Audio", color: "bg-green-500/50", icon: <Volume2 className="h-3 w-3" /> },
];

const CLIP_COLORS: Record<TimelineClip["type"], string> = {
  video: "bg-blue-500",
  image: "bg-purple-500",
  audio: "bg-green-500",
  text: "bg-yellow-500",
};

const TRACK_HEIGHT = 40;
const RULER_HEIGHT = 22;
const LABEL_WIDTH = 56;
const PX_PER_FRAME_DEFAULT = 0.6;

/**
 * Timeline tương tác chuyên nghiệp kiểu CapCut/OpenCut.
 *
 * Tính năng:
 * - Ruler thời gian với markers
 * - Track lanes hiển thị clip dưới dạng rectangle màu
 * - Click vào clip → chọn (viền sáng)
 * - Click vào vùng trống → seek đến vị trí đó
 * - Kéo clip để di chuyển trên timeline
 * - Playhead dọc di chuyển theo currentFrame
 * - Transport controls: Play/Pause, Skip, Timecode
 * - Keyboard shortcuts: Space, ←, →
 * - Drop zone cho kéo thả asset từ sidebar
 */
export function TimelineControls({
  playerRef,
  durationInFrames,
  clips,
  selectedClipId,
  onSelectClip,
  onTimelineSeek,
  onClipMove,
  onTimelineDrop,
}: TimelineControlsProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [mutedTracks, setMutedTracks] = useState<Set<string>>(new Set());
  const [hiddenTracks, setHiddenTracks] = useState<Set<string>>(new Set());
  const [draggingClip, setDraggingClip] = useState<string | null>(null);
  const dragOffsetRef = useRef(0);
  const [dropIndicator, setDropIndicator] = useState<{ frame: number; trackId: string } | null>(null);

  const rafRef = useRef<number | null>(null);
  const isPollingRef = useRef(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const tracksScrollRef = useRef<HTMLDivElement>(null);

  const totalFrames = Math.max(durationInFrames, 1);
  const pxPerFrame = PX_PER_FRAME_DEFAULT * zoom;
  const timelineWidth = totalFrames * pxPerFrame;

  // ── Polling ────────────────────────────────────────────────────
  const pollFrame = useCallback(() => {
    const ref = playerRef.current;
    if (ref) {
      setCurrentFrame(ref.getCurrentFrame());
      setIsPlaying(ref.isPlaying());
    }
    rafRef.current = requestAnimationFrame(pollFrame);
  }, [playerRef]);

  useEffect(() => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    rafRef.current = requestAnimationFrame(pollFrame);
    return () => {
      isPollingRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [pollFrame]);

  // ── Keyboard shortcuts ─────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const ref = playerRef.current;
      if (!ref) return;

      if (e.code === "Space") {
        e.preventDefault();
        ref.isPlaying() ? ref.pause() : ref.play();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        ref.seekTo(Math.max(0, ref.getCurrentFrame() - 1));
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        ref.seekTo(Math.min(totalFrames - 1, ref.getCurrentFrame() + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playerRef, totalFrames]);

  // ── Transport handlers ─────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    const ref = playerRef.current;
    if (!ref) return;
    ref.isPlaying() ? ref.pause() : ref.play();
  }, [playerRef]);

  const handleSkipBack = useCallback(() => {
    const ref = playerRef.current;
    if (!ref) return;
    ref.seekTo(Math.max(0, ref.getCurrentFrame() - 1));
  }, [playerRef]);

  const handleSkipForward = useCallback(() => {
    const ref = playerRef.current;
    if (!ref) return;
    ref.seekTo(Math.min(totalFrames - 1, ref.getCurrentFrame() + 1));
  }, [playerRef, totalFrames]);

  // ── Timeline click → seek ──────────────────────────────────────
  const frameFromEvent = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      return Math.max(0, Math.min(totalFrames, Math.round(x / pxPerFrame)));
    },
    [totalFrames, pxPerFrame],
  );

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (draggingClip) return;
      const frame = frameFromEvent(e);
      onTimelineSeek(frame);
    },
    [draggingClip, frameFromEvent, onTimelineSeek],
  );

  // ── Clip drag ──────────────────────────────────────────────────
  const handleClipMouseDown = useCallback(
    (e: React.MouseEvent, clipId: string) => {
      e.stopPropagation();
      onSelectClip(clipId);
      const clip = clips.find((c) => c.id === clipId);
      if (!clip) return;
      const trackRect = (e.currentTarget as HTMLElement).parentElement!.getBoundingClientRect();
      const clickX = e.clientX - trackRect.left;
      const clipStartX = clip.startFrame * pxPerFrame;
      dragOffsetRef.current = clickX - clipStartX;
      setDraggingClip(clipId);

      const handleMouseMove = (ev: MouseEvent) => {
        const newX = ev.clientX - trackRect.left - dragOffsetRef.current;
        const newFrame = Math.max(0, Math.round(newX / pxPerFrame));
        setCurrentFrame(newFrame);
      };
      const handleMouseUp = (ev: MouseEvent) => {
        const newX = ev.clientX - trackRect.left - dragOffsetRef.current;
        const newFrame = Math.max(0, Math.round(newX / pxPerFrame));
        if (onClipMove && newFrame !== clip.startFrame) {
          onClipMove(clipId, newFrame);
        }
        setDraggingClip(null);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
      };
      document.body.style.cursor = "grabbing";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [clips, pxPerFrame, onSelectClip, onClipMove],
  );

  // ── Drop handling ──────────────────────────────────────────────
  // Drag events handled on the parent tracks container so we can
  // determine which track to drop on from absolute Y position.
  const tracksContainerRef = useRef<HTMLDivElement>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const container = tracksContainerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const frame = Math.max(0, Math.min(totalFrames, Math.round((e.clientX - containerRect.left) / pxPerFrame)));
      const yInContainer = e.clientY - containerRect.top - RULER_HEIGHT;
      const trackIdx = Math.max(0, Math.min(TRACKS.length - 1, Math.floor(yInContainer / TRACK_HEIGHT)));
      setDropIndicator({ frame, trackId: TRACKS[trackIdx].id });
    },
    [totalFrames, pxPerFrame],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if actually leaving the container (not entering a child)
    const container = tracksContainerRef.current;
    if (container && !container.contains(e.relatedTarget as Node)) {
      setDropIndicator(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!dropIndicator || !onTimelineDrop) return;
      let assetData: Record<string, unknown> = {};
      try {
        const raw = e.dataTransfer.getData("application/json");
        if (raw) assetData = JSON.parse(raw);
      } catch { /* ignore parse errors */ }
      onTimelineDrop(dropIndicator.frame, dropIndicator.trackId, assetData);
      setDropIndicator(null);
    },
    [dropIndicator, onTimelineDrop],
  );

  const toggleMuteTrack = useCallback((trackId: string) => {
    setMutedTracks((prev) => {
      const next = new Set(prev);
      next.has(trackId) ? next.delete(trackId) : next.add(trackId);
      return next;
    });
  }, []);

  const toggleHideTrack = useCallback((trackId: string) => {
    setHiddenTracks((prev) => {
      const next = new Set(prev);
      next.has(trackId) ? next.delete(trackId) : next.add(trackId);
      return next;
    });
  }, []);

  // ── Derived values ─────────────────────────────────────────────
  const fps = 30;
  const timecode = useMemo(() => {
    const s = Math.floor(currentFrame / fps);
    const f = currentFrame % fps;
    const ts = Math.floor(totalFrames / fps);
    const tf = totalFrames % fps;
    return `${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")} / ${String(ts).padStart(2, "0")}:${String(tf).padStart(2, "0")}`;
  }, [currentFrame, totalFrames, fps]);

  const rulerMarkers = useMemo(() => {
    const markers: { frame: number; label: string; major: boolean }[] = [];
    const step = zoom < 1.5 ? 60 : zoom < 3 ? 30 : 10;
    for (let f = 0; f <= totalFrames; f += step) {
      markers.push({
        frame: f,
        label: `${(f / fps).toFixed(0)}s`,
        major: f % (step * 2) === 0,
      });
    }
    return markers;
  }, [totalFrames, fps, zoom]);

  // Group clips by track
  const clipsByTrack = useMemo(() => {
    const map: Record<string, TimelineClip[]> = {};
    for (const t of TRACKS) map[t.id] = [];
    if (Array.isArray(clips)) {
      for (const clip of clips) {
        if (map[clip.trackId]) map[clip.trackId].push(clip);
      }
    }
    return map;
  }, [clips]);

  return (
    <div className="select-none rounded-lg border border-border bg-card">
      {/* ═══ Transport bar ═══ */}
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-1.5">
        <button
          type="button" onClick={handlePlayPause}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-all hover:opacity-90 active:scale-95"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </button>
        <button
          type="button" onClick={handleSkipBack}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          title="Frame back (←)"
        >
          <SkipBack className="h-3 w-3" />
        </button>
        <button
          type="button" onClick={handleSkipForward}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          title="Frame forward (→)"
        >
          <SkipForward className="h-3 w-3" />
        </button>

        <div className="mx-1 h-4 w-px bg-border" />

        <span className="min-w-[140px] text-center text-[11px] font-mono tabular-nums text-foreground">
          {timecode}
        </span>

        <span className="text-[10px] tabular-nums text-muted-foreground">
          Frame {currentFrame}/{totalFrames}
        </span>

        <div className="flex-1" />

        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <button onClick={() => setZoom((z) => Math.max(0.3, z - 0.3))} className="hover:text-foreground px-1">−</button>
          <span className="min-w-[32px] text-center tabular-nums">{zoom.toFixed(1)}×</span>
          <button onClick={() => setZoom((z) => Math.min(5, z + 0.3))} className="hover:text-foreground px-1">+</button>
        </div>
      </div>

      {/* ═══ Timeline area ═══ */}
      <div
        ref={timelineRef}
        className="relative overflow-hidden"
        style={{ height: RULER_HEIGHT + TRACKS.length * TRACK_HEIGHT + 8 }}
      >
        {/* Scrollable inner */}
        <div
          ref={tracksScrollRef}
          className="h-full overflow-auto"
        >
          <div className="flex" style={{ minWidth: timelineWidth + 100 }}>
            {/* ── Track labels ── */}
            <div className="sticky left-0 z-20 shrink-0 bg-card" style={{ width: LABEL_WIDTH }}>
              {/* Ruler spacer */}
              <div className="border-b border-border" style={{ height: RULER_HEIGHT }} />
              {TRACKS.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-1 border-b border-border/50 px-2"
                  style={{ height: TRACK_HEIGHT }}
                >
                  <button
                    onClick={() => toggleMuteTrack(track.id)}
                    className={`shrink-0 rounded p-0.5 transition-colors ${
                      mutedTracks.has(track.id) ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={mutedTracks.has(track.id) ? "Unmute" : "Mute"}
                  >
                    {mutedTracks.has(track.id) ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={() => toggleHideTrack(track.id)}
                    className={`shrink-0 rounded p-0.5 transition-colors ${
                      hiddenTracks.has(track.id) ? "text-muted-foreground/30" : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={hiddenTracks.has(track.id) ? "Show" : "Hide"}
                  >
                    {hiddenTracks.has(track.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                  <span className="truncate text-[10px] font-medium text-muted-foreground">
                    {track.name}
                  </span>
                </div>
              ))}
            </div>

            {/* ── Timeline content ── */}
            <div
              className="flex-1"
              ref={tracksContainerRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* ── Ruler ── */}
              <div
                className="relative cursor-crosshair border-b border-border bg-muted/20"
                style={{ height: RULER_HEIGHT, width: timelineWidth }}
                onClick={handleTimelineClick}
              >
                {rulerMarkers.map((m) => (
                  <div
                    key={m.frame}
                    className="absolute bottom-0 flex flex-col items-center"
                    style={{ left: m.frame * pxPerFrame }}
                  >
                    <div
                      className={m.major ? "h-full w-px bg-border" : "h-1/2 w-px bg-border/40"}
                    />
                    {m.major && (
                      <span className="absolute top-0.5 text-[9px] tabular-nums text-muted-foreground/60">
                        {m.label}
                      </span>
                    )}
                  </div>
                ))}

                {/* Playhead */}
                <div
                  className="pointer-events-none absolute inset-y-0 z-30 w-px bg-destructive shadow-[0_0_6px_var(--destructive)]"
                  style={{ left: currentFrame * pxPerFrame }}
                >
                  <div className="absolute -top-0.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-destructive" />
                </div>
              </div>

              {/* ── Tracks ── */}
              {TRACKS.map((track) => (
                <div
                  key={track.id}
                  className={`relative border-b border-border/30 ${track.color} ${hiddenTracks.has(track.id) ? "opacity-20" : ""}`}
                  style={{ height: TRACK_HEIGHT, width: timelineWidth }}
                  onClick={handleTimelineClick}
                >
                  {/* Clips on this track */}
                  {clipsByTrack[track.id]?.map((clip) => (
                    <div
                      key={clip.id}
                      className={`absolute inset-y-1 cursor-grab rounded-sm border ${
                        clip.id === selectedClipId
                          ? "border-white ring-1 ring-white/40"
                          : "border-white/20 hover:border-white/50"
                      } ${CLIP_COLORS[clip.type]} ${draggingClip === clip.id ? "z-40 opacity-80 shadow-xl" : "z-10"}`}
                      style={{
                        left: clip.startFrame * pxPerFrame,
                        width: Math.max(4, clip.durationFrames * pxPerFrame),
                      }}
                      onMouseDown={(e) => handleClipMouseDown(e, clip.id)}
                      title={clip.name}
                    >
                      <span className="block truncate px-1.5 text-[10px] font-medium leading-[28px] text-white/90">
                        {clip.name}
                      </span>
                    </div>
                  ))}

                  {/* Drop indicator */}
                  {dropIndicator?.trackId === track.id && (
                    <div
                      className="pointer-events-none absolute inset-y-0 z-50 w-0.5 bg-primary shadow-[0_0_8px_var(--primary)]"
                      style={{ left: dropIndicator.frame * pxPerFrame }}
                    />
                  )}

                  {/* Playhead on track */}
                  <div
                    className="pointer-events-none absolute inset-y-0 z-30 w-px bg-destructive shadow-[0_0_4px_var(--destructive)]"
                    style={{ left: currentFrame * pxPerFrame }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// ✏️ EDIT ZONE END
