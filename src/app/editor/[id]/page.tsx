// ✏️ EDIT ZONE START
"use client";

import React, { useRef, useState, useMemo, use } from "react";
import type { PlayerRef } from "@remotion/player";
import { VideoPlayer } from "@/ui/video-player";
import { TimelineControls } from "@/ui/timeline-controls";
import { CompositionSelector } from "@/ui/composition-selector";
import { COMPOSITIONS } from "@/ui/composition-registry";

interface EditorPageProps {
  /** Next.js dynamic route params — Promise trong React 19 */
  params: Promise<{ id: string }>;
}

/**
 * Trang Video Editor tại route /editor/[id].
 *
 * Compose 3 UI components:
 * 1. CompositionSelector — đổi composition để preview
 * 2. VideoPlayer — Remotion Player preview
 * 3. TimelineControls — play/pause, seek, frame counter
 *
 * State management: compositionId nằm trong page state,
 * playerRef được share giữa VideoPlayer và TimelineControls.
 */
export default function EditorPage({ params }: EditorPageProps) {
  const { id: episodeId } = use(params);
  const playerRef = useRef<PlayerRef>(null);
  const [compositionId, setCompositionId] = useState("AutoVideoEditor");

  // Danh sách composition dạng {id, label} cho CompositionSelector
  const compositionOptions = useMemo(
    () =>
      COMPOSITIONS.map((c) => ({
        id: c.id,
        label: c.label,
      })),
    [],
  );

  // Composition metadata hiện tại để truyền durationInFrames cho TimelineControls
  const currentComposition = useMemo(
    () => COMPOSITIONS.find((c) => c.id === compositionId),
    [compositionId],
  );

  const handleSelectComposition = (id: string) => {
    setCompositionId(id);
  };

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Video Editor
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Episode #{episodeId}
            </p>
          </div>
          <CompositionSelector
            compositions={compositionOptions}
            selectedId={compositionId}
            onSelect={handleSelectComposition}
          />
        </header>

        {/* Player */}
        <section>
          <VideoPlayer
            episodeId={episodeId}
            compositionId={compositionId}
            playerRef={playerRef}
          />
        </section>

        {/* Timeline */}
        <section>
          <TimelineControls
            playerRef={playerRef}
            durationInFrames={currentComposition?.durationInFrames ?? 300}
          />
        </section>
      </div>
    </main>
  );
}
// ✏️ EDIT ZONE END
