// ✏️ EDIT ZONE START
"use client";

import React, { useRef, useState, useMemo, use, useCallback } from "react";
import type { PlayerRef } from "@remotion/player";
import { Film, Image, Music, Type, Trash2, Info } from "lucide-react";
import { VideoPlayer } from "@/ui/video-player";
import { TimelineControls, type TimelineClip } from "@/ui/timeline-controls";
import { CompositionSelector } from "@/ui/composition-selector";
import { COMPOSITIONS } from "@/ui/composition-registry";

interface EditorPageProps {
  params: Promise<{ id: string }>;
}

// ── Asset types ──────────────────────────────────────────────────
interface AssetItem {
  id: string;
  name: string;
  type: TimelineClip["type"];
  defaultDuration: number; // frames
}

const ASSET_LIBRARY: AssetItem[] = [
  { id: "a1", name: "Scene_01_Intro.mp4", type: "video", defaultDuration: 150 },
  { id: "a2", name: "Scene_02_Dialogue.mp4", type: "video", defaultDuration: 360 },
  { id: "a3", name: "bg_music_ambient.mp3", type: "audio", defaultDuration: 900 },
  { id: "a4", name: "char_portrait.png", type: "image", defaultDuration: 90 },
  { id: "a5", name: "Subtitle Track EN", type: "text", defaultDuration: 900 },
  { id: "a6", name: "Scene_03_Action.mp4", type: "video", defaultDuration: 240 },
  { id: "a7", name: "sfx_impact.wav", type: "audio", defaultDuration: 30 },
];

const ASSET_ICONS: Record<AssetItem["type"], React.ReactNode> = {
  video: <Film className="h-3.5 w-3.5" />,
  image: <Image className="h-3.5 w-3.5" />,
  audio: <Music className="h-3.5 w-3.5" />,
  text: <Type className="h-3.5 w-3.5" />,
};

const ASSET_TEXT_COLORS: Record<AssetItem["type"], string> = {
  video: "text-blue-400",
  image: "text-purple-400",
  audio: "text-green-400",
  text: "text-yellow-400",
};

let clipIdCounter = 0;
function nextClipId() {
  return `clip_${++clipIdCounter}`;
}

/**
 * Trang Video Editor chuyên nghiệp — /editor/[id].
 *
 * Layout 4 vùng:
 * 1. Top Toolbar — composition selector, episode info, actions
 * 2. Left Sidebar — thư viện asset, kéo thả vào timeline
 * 3. Center — Video Player preview
 * 4. Right Sidebar — properties composition hiện tại
 * 5. Bottom — Timeline tương tác với clip, playhead, ruler
 *
 * Tương tác chính:
 * - Kéo asset từ sidebar thả vào timeline → tạo clip
 * - Click clip trên timeline → chọn (hiện viền sáng)
 * - Click vùng trống timeline → seek đến vị trí đó
 * - Kéo clip để di chuyển trên track
 * - Delete key → xóa clip đang chọn
 * - Space → Play/Pause, ← → → frame step
 */
export default function EditorPage({ params }: EditorPageProps) {
  const { id: episodeId } = use(params);
  const playerRef = useRef<PlayerRef>(null);
  const [compositionId, setCompositionId] = useState("AutoVideoEditor");
  const [clips, setClips] = useState<TimelineClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  const compositionOptions = useMemo(
    () => COMPOSITIONS.map((c) => ({ id: c.id, label: c.label })),
    [],
  );

  const currentComposition = useMemo(
    () => COMPOSITIONS.find((c) => c.id === compositionId),
    [compositionId],
  );

  // ── Handlers ───────────────────────────────────────────────────
  const handleSelectComposition = useCallback((id: string) => {
    setCompositionId(id);
    setClips([]);
    setSelectedClipId(null);
  }, []);

  const handleSelectClip = useCallback((clipId: string | null) => {
    setSelectedClipId(clipId);
  }, []);

  const handleTimelineSeek = useCallback(
    (frame: number) => {
      playerRef.current?.seekTo(frame);
      playerRef.current?.pause();
    },
    [],
  );

  const handleClipMove = useCallback((clipId: string, newStartFrame: number) => {
    setClips((prev) =>
      prev.map((c) => (c.id === clipId ? { ...c, startFrame: newStartFrame } : c)),
    );
  }, []);

  const handleTimelineDrop = useCallback(
    (frame: number, trackId: string) => {
      setClips((prev) => [
        ...prev,
        {
          id: nextClipId(),
          assetId: `dropped_${Date.now()}`,
          name: `New Clip ${prev.length + 1}`,
          type: trackId === "audio" ? "audio" : "video",
          trackId,
          startFrame: frame,
          durationFrames: 150,
        },
      ]);
    },
    [],
  );

  const handleDeleteSelected = useCallback(() => {
    if (!selectedClipId) return;
    setClips((prev) => prev.filter((c) => c.id !== selectedClipId));
    setSelectedClipId(null);
  }, [selectedClipId]);

  // Delete key xóa clip đang chọn
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        handleDeleteSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDeleteSelected]);

  // ── Drag from sidebar ─────────────────────────────────────────
  const handleAssetDragStart = useCallback(
    (e: React.DragEvent, asset: AssetItem) => {
      e.dataTransfer.setData(
        "application/json",
        JSON.stringify({ assetId: asset.id, name: asset.name, type: asset.type, defaultDuration: asset.defaultDuration }),
      );
      e.dataTransfer.effectAllowed = "move";
    },
    [],
  );

  const selectedClip = useMemo(
    () => clips.find((c) => c.id === selectedClipId) ?? null,
    [clips, selectedClipId],
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* ═══════════════ TOP TOOLBAR ═══════════════ */}
      <header className="flex h-10 shrink-0 items-center gap-3 border-b border-border bg-card px-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Editor
        </span>
        <div className="h-4 w-px bg-border" />
        <span className="text-[11px] tabular-nums text-foreground">
          Episode #{episodeId}
        </span>
        <div className="flex-1" />
        <CompositionSelector
          compositions={compositionOptions}
          selectedId={compositionId}
          onSelect={handleSelectComposition}
        />
      </header>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT SIDEBAR: Asset Library ── */}
        <aside className="flex w-48 shrink-0 flex-col border-r border-border bg-card/40">
          <div className="flex h-8 items-center gap-2 border-b border-border px-3">
            <Film className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Media
            </span>
            <span className="ml-auto text-[9px] tabular-nums text-muted-foreground/40">
              {ASSET_LIBRARY.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {ASSET_LIBRARY.map((asset) => (
              <div
                key={asset.id}
                draggable
                onDragStart={(e) => handleAssetDragStart(e, asset)}
                className="group flex cursor-grab items-center gap-2 border-b border-border/30 px-3 py-2 transition-colors hover:bg-accent/60 active:cursor-grabbing"
              >
                <span className={ASSET_TEXT_COLORS[asset.type]}>
                  {ASSET_ICONS[asset.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] leading-tight text-foreground">
                    {asset.name}
                  </p>
                  <p className="text-[9px] tabular-nums text-muted-foreground/50">
                    {asset.defaultDuration}f
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-2">
            <p className="text-[9px] leading-relaxed text-muted-foreground/40">
              Drag media onto the timeline to add clips.
            </p>
          </div>
        </aside>

        {/* ── CENTER: Preview + Timeline ── */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Video Preview */}
          <div className="flex flex-1 items-center justify-center bg-[#0a0a0b] p-4">
            <div className="w-full max-w-[960px]">
              <VideoPlayer
                episodeId={episodeId}
                compositionId={compositionId}
                playerRef={playerRef}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="shrink-0 border-t border-border px-3 pb-3 pt-2">
            <TimelineControls
              playerRef={playerRef}
              durationInFrames={currentComposition?.durationInFrames ?? 300}
              clips={clips}
              selectedClipId={selectedClipId}
              onSelectClip={handleSelectClip}
              onTimelineSeek={handleTimelineSeek}
              onClipMove={handleClipMove}
              onTimelineDrop={handleTimelineDrop}
            />
          </div>
        </main>

        {/* ── RIGHT SIDEBAR: Properties ── */}
        <aside className="flex w-52 shrink-0 flex-col border-l border-border bg-card/40">
          <div className="flex h-8 items-center gap-2 border-b border-border px-3">
            <Info className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Properties
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {/* Composition info */}
            {currentComposition && (
              <section>
                <h3 className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                  Composition
                </h3>
                <dl className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="tabular-nums text-foreground">{currentComposition.label}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Resolution</dt>
                    <dd className="tabular-nums text-foreground">{currentComposition.width}×{currentComposition.height}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">FPS</dt>
                    <dd className="tabular-nums text-foreground">{currentComposition.fps}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Duration</dt>
                    <dd className="tabular-nums text-foreground">{currentComposition.durationInFrames}f</dd>
                  </div>
                </dl>
              </section>
            )}

            <hr className="border-border" />

            {/* Selected clip info */}
            {selectedClip ? (
              <section>
                <h3 className="mb-1.5 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                  Selected Clip
                  <button
                    onClick={handleDeleteSelected}
                    className="ml-auto rounded p-0.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                    title="Delete clip (Del)"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </h3>
                <dl className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="truncate tabular-nums text-foreground">{selectedClip.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="tabular-nums text-foreground">{selectedClip.type}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Start</dt>
                    <dd className="tabular-nums text-foreground">{selectedClip.startFrame}f</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Duration</dt>
                    <dd className="tabular-nums text-foreground">{selectedClip.durationFrames}f</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">End</dt>
                    <dd className="tabular-nums text-foreground">{selectedClip.startFrame + selectedClip.durationFrames}f</dd>
                  </div>
                </dl>
              </section>
            ) : (
              <section>
                <h3 className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                  Clip
                </h3>
                <p className="text-[10px] leading-relaxed text-muted-foreground/40">
                  Select a clip on the timeline to edit its properties.
                </p>
              </section>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
// ✏️ EDIT ZONE END
