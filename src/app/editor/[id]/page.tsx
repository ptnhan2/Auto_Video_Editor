// ✏️ EDIT ZONE START
"use client";

import React, { useRef, useState, useMemo, use } from "react";
import type { PlayerRef } from "@remotion/player";
import { Film, Image, Music, Type, ChevronDown, Info } from "lucide-react";
import { VideoPlayer } from "@/ui/video-player";
import { TimelineControls } from "@/ui/timeline-controls";
import { CompositionSelector } from "@/ui/composition-selector";
import { COMPOSITIONS } from "@/ui/composition-registry";

interface EditorPageProps {
  /** Next.js dynamic route params — Promise trong React 19 */
  params: Promise<{ id: string }>;
}

// ── Mock asset data (sẽ được thay bằng API sau) ──
interface AssetItem {
  id: string;
  name: string;
  type: "video" | "image" | "audio" | "text";
  duration: string;
}
const MOCK_ASSETS: AssetItem[] = [
  { id: "a1", name: "Scene_01_Intro.mp4", type: "video", duration: "00:05" },
  { id: "a2", name: "Scene_02_Dialogue.mp4", type: "video", duration: "00:12" },
  { id: "a3", name: "bg_music_ambient.mp3", type: "audio", duration: "00:30" },
  { id: "a4", name: "char_portrait.png", type: "image", duration: "—" },
  { id: "a5", name: "Subtitle Track EN", type: "text", duration: "00:30" },
  { id: "a6", name: "Scene_03_Action.mp4", type: "video", duration: "00:08" },
  { id: "a7", name: "sfx_impact.wav", type: "audio", duration: "00:01" },
];

const ASSET_ICONS: Record<AssetItem["type"], React.ReactNode> = {
  video: <Film className="h-3.5 w-3.5" />,
  image: <Image className="h-3.5 w-3.5" />,
  audio: <Music className="h-3.5 w-3.5" />,
  text: <Type className="h-3.5 w-3.5" />,
};

const ASSET_COLORS: Record<AssetItem["type"], string> = {
  video: "text-blue-400",
  image: "text-purple-400",
  audio: "text-green-400",
  text: "text-yellow-400",
};

/**
 * Trang Video Editor chuyên nghiệp tại route /editor/[id].
 *
 * Layout 4 vùng:
 * 1. Top Toolbar — composition selector, episode info
 * 2. Left Sidebar — asset panel (danh sách tài nguyên)
 * 3. Center — Video Player preview
 * 4. Right Sidebar — properties panel (metadata composition hiện tại)
 * 5. Bottom — Timeline Controls (transport + seek bar + track lanes)
 *
 * Dark theme sử dụng shadcn design tokens.
 */
export default function EditorPage({ params }: EditorPageProps) {
  const { id: episodeId } = use(params);
  const playerRef = useRef<PlayerRef>(null);
  const [compositionId, setCompositionId] = useState("AutoVideoEditor");

  const compositionOptions = useMemo(
    () => COMPOSITIONS.map((c) => ({ id: c.id, label: c.label })),
    [],
  );

  const currentComposition = useMemo(
    () => COMPOSITIONS.find((c) => c.id === compositionId),
    [compositionId],
  );

  const handleSelectComposition = (id: string) => {
    setCompositionId(id);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* ═══════════════ TOP TOOLBAR ═══════════════ */}
      <header className="flex h-11 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
        {/* Logo / Brand */}
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Editor
        </span>

        {/* Divider */}
        <div className="h-5 w-px bg-border" />

        {/* Episode info */}
        <span className="text-xs tabular-nums text-foreground">
          Episode #{episodeId}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Composition selector */}
        <CompositionSelector
          compositions={compositionOptions}
          selectedId={compositionId}
          onSelect={handleSelectComposition}
        />
      </header>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT SIDEBAR: Asset Panel ── */}
        <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-card/50">
          <div className="flex h-8 items-center gap-2 border-b border-border px-3">
            <Film className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Assets
            </span>
            <span className="ml-auto text-[10px] tabular-nums text-muted-foreground/50">
              {MOCK_ASSETS.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {MOCK_ASSETS.map((asset) => (
              <div
                key={asset.id}
                className="flex cursor-pointer items-center gap-2 border-b border-border/50 px-3 py-2 transition-colors hover:bg-accent/50"
                draggable
              >
                <span className={ASSET_COLORS[asset.type]}>
                  {ASSET_ICONS[asset.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] leading-tight text-foreground">
                    {asset.name}
                  </p>
                  <p className="text-[10px] tabular-nums text-muted-foreground/60">
                    {asset.duration}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── CENTER: Preview + bottom timeline ── */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Video Preview */}
          <div className="flex flex-1 items-center justify-center bg-[#0a0a0a] p-6">
            <div className="w-full max-w-[960px]">
              <VideoPlayer
                episodeId={episodeId}
                compositionId={compositionId}
                playerRef={playerRef}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="shrink-0 border-t border-border px-4 py-3">
            <TimelineControls
              playerRef={playerRef}
              durationInFrames={currentComposition?.durationInFrames ?? 300}
            />
          </div>
        </main>

        {/* ── RIGHT SIDEBAR: Properties Panel ── */}
        <aside className="flex w-56 shrink-0 flex-col border-l border-border bg-card/50">
          <div className="flex h-8 items-center gap-2 border-b border-border px-3">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Properties
            </span>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto p-3">
            {currentComposition && (
              <>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                    Composition
                  </span>
                  <p className="text-xs text-foreground">{currentComposition.label}</p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                    Resolution
                  </span>
                  <p className="text-xs tabular-nums text-foreground">
                    {currentComposition.width} × {currentComposition.height}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                    Frame Rate
                  </span>
                  <p className="text-xs tabular-nums text-foreground">
                    {currentComposition.fps} fps
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                    Duration
                  </span>
                  <p className="text-xs tabular-nums text-foreground">
                    {currentComposition.durationInFrames} frames
                    <span className="ml-1 text-muted-foreground/50">
                      ({(currentComposition.durationInFrames / currentComposition.fps).toFixed(1)}s)
                    </span>
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                    Aspect
                  </span>
                  <p className="text-xs tabular-nums text-foreground">
                    {(currentComposition.width / currentComposition.height).toFixed(3)}:1
                  </p>
                </div>
              </>
            )}

            <hr className="my-3 border-border" />

            <div className="space-y-0.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                Episode
              </span>
              <p className="text-xs tabular-nums text-foreground">#{episodeId}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                Status
              </span>
              <p className="text-xs text-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-chart-4/15 px-2 py-0.5 text-[10px] font-medium text-chart-4">
                  Draft
                </span>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
// ✏️ EDIT ZONE END
