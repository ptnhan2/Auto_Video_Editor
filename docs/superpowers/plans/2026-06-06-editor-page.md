# Editor Page — Remotion Player + Timeline Implementation Plan

> **For agentic workers:** Implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/editor/[id]` page with Remotion Player preview, timeline controls (play/pause/seek/frame counter), and composition selector dropdown.

**Architecture:** Three client-side UI components (`src/ui/`) composed by a Next.js dynamic route page. The Remotion Player is wrapped to handle lazy-loading of composition components from `remotion/` + `src/components/`. All components use `"use client"` directive and shadcn design tokens for dark theme.

**Tech Stack:** Next.js 16 (App Router), React 19, @remotion/player v4.0.465, TypeScript 5, tailwindcss 4, lucide-react.

---

## File Structure

| File | Role |
|------|------|
| `src/app/editor/[id]/page.tsx` | **CREATE** — Page, compose only: VideoPlayer + TimelineControls + CompositionSelector |
| `src/ui/video-player.tsx` | **CREATE** — Remotion `<Player>` wrapper; lazy-loads composition via `React.lazy`; loading/error states |
| `src/ui/timeline-controls.tsx` | **CREATE** — Play/Pause button, seek `<input range>`, frame counter `{current}/{total}` |
| `src/ui/composition-selector.tsx` | **CREATE** — Dropdown listing 6 hardcoded Remotion compositions |
| `src/ui/composition-registry.ts` | **CREATE** — Hardcoded registry mapping composition `id` → metadata (width, height, fps, duration) + lazy import function |

---

## Composition Registry (hardcoded from `remotion/Root.tsx`)

```typescript
// src/ui/composition-registry.ts
interface CompositionDef {
  id: string;
  label: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  component: () => Promise<{ default: React.ComponentType }>;
}

export const COMPOSITIONS: CompositionDef[] = [
  {
    id: "AutoVideoEditor",
    label: "Main (1920x1080)",
    width: 1920, height: 1080, fps: 30, durationInFrames: 300,
    component: () => import("@/../remotion/Main").then(m => ({ default: m.Main })),
  },
  {
    id: "PuppetPreview",
    label: "Puppet Preview (1080x1920)",
    width: 1080, height: 1920, fps: 30, durationInFrames: 300,
    component: () => import("@/../remotion/compositions/PuppetPreview").then(m => ({ default: m.PuppetPreview })),
  },
  {
    id: "ActionSequence",
    label: "Action Sequence (1080x1920)",
    width: 1080, height: 1920, fps: 30, durationInFrames: 600,
    component: () => import("@/../remotion/compositions/ActionSequence").then(m => ({ default: m.ActionSequence })),
  },
  {
    id: "ExpressionTest",
    label: "Expression Test (500x500)",
    width: 500, height: 500, fps: 30, durationInFrames: 150,
    component: () => import("@/components/ExpressionPlayer").then(m => ({ default: m.ExpressionPlayer })),
  },
  {
    id: "AIStoryCompiler",
    label: "AI Story Compiler (1920x1080)",
    width: 1920, height: 1080, fps: 30, durationInFrames: 600,
    component: () => import("@/../remotion/compositions/DraftVideoPreview").then(m => ({ default: m.DraftVideoPreview })),
  },
  {
    id: "WaddleEngineTest",
    label: "Waddle Engine Test (1920x1080)",
    width: 1920, height: 1080, fps: 30, durationInFrames: 300,
    component: () => import("@/../remotion/compositions/WaddleEngineTest").then(m => ({ default: m.WaddleEngineTest })),
  },
];
```

> **Note on import paths:** `@/` maps to `src/`. To reach `remotion/` (at project root, sibling of `src/`), we use `@/../remotion/...`. The `ExpressionPlayer` lives at `src/components/ExpressionPlayer.tsx` → `@/components/ExpressionPlayer`.

---

## EDIT ZONES

| File | EDIT ZONE |
|------|-----------|
| `src/app/editor/[id]/page.tsx` | Entire file (CREATE NEW) |
| `src/ui/video-player.tsx` | Entire file (CREATE NEW) |
| `src/ui/timeline-controls.tsx` | Entire file (CREATE NEW) |
| `src/ui/composition-selector.tsx` | Entire file (CREATE NEW) |
| `src/ui/composition-registry.ts` | Entire file (CREATE NEW) |

---

### Task 1: Composition Registry

**Files:**
- Create: `src/ui/composition-registry.ts`

- [ ] **Step 1: Write registry file**

Code exactly as shown in the Composition Registry section above.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty src/ui/composition-registry.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/ui/composition-registry.ts
git commit -m "feat(editor): add composition registry with lazy import mappings"
```

---

### Task 2: CompositionSelector Component

**Files:**
- Create: `src/ui/composition-selector.tsx`

- [ ] **Step 1: Write CompositionSelector component**

```tsx
"use client";

import React from "react";
import { Check, ChevronDown } from "lucide-react";

export interface CompositionSelectorProps {
  /** Composition IDs đã hardcode trong registry */
  compositions: { id: string; label: string }[];
  /** ID hiện đang được chọn */
  selectedId: string;
  /** Callback khi user chọn composition khác */
  onSelect: (id: string) => void;
}

/**
 * Dropdown chọn Remotion composition từ danh sách hardcode.
 * Hiển thị label dễ đọc, đánh dấu item đang chọn bằng icon Check.
 */
export function CompositionSelector({
  compositions,
  selectedId,
  onSelect,
}: CompositionSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown khi click bên ngoài
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedItem = compositions.find((c) => c.id === selectedId);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0 truncate">
          {selectedItem?.label ?? "Select composition"}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 z-50 mt-1 w-full min-w-[260px] overflow-hidden rounded-lg border border-border bg-card shadow-lg"
        >
          {compositions.map((comp) => {
            const isSelected = comp.id === selectedId;
            return (
              <li
                key={comp.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelect(comp.id);
                  setOpen(false);
                }}
                className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                  isSelected
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-card-foreground"
                }`}
              >
                <span>{comp.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty src/ui/composition-selector.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/ui/composition-selector.tsx
git commit -m "feat(editor): add CompositionSelector dropdown component"
```

---

### Task 3: TimelineControls Component

**Files:**
- Create: `src/ui/timeline-controls.tsx`

- [ ] **Step 1: Write TimelineControls component**

```tsx
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
 * Khi seek, gọi `playerRef.current.seekTo(frame)`. Frame counter cập nhật
 * qua `requestAnimationFrame` khi đang playing.
 */
export function TimelineControls({
  playerRef,
  durationInFrames,
}: TimelineControlsProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Poll current frame from player mỗi animation frame khi đang play
  const pollFrame = useCallback(() => {
    const ref = playerRef.current;
    if (!ref) return;
    const frame = ref.getCurrentFrame();
    setCurrentFrame(frame);
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty src/ui/timeline-controls.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/ui/timeline-controls.tsx
git commit -m "feat(editor): add TimelineControls with play/pause, seek, frame counter"
```

---

### Task 4: VideoPlayer Component

**Files:**
- Create: `src/ui/video-player.tsx`

- [ ] **Step 1: Write VideoPlayer component**

```tsx
"use client";

import React, { Suspense, useCallback } from "react";
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
 * Sử dụng React.lazy để dynamic import composition component, hiển thị
 * loading spinner trong lúc chờ bundle tải về, và error state nếu load thất bại.
 */
export function VideoPlayer({
  episodeId,
  compositionId,
  playerRef,
}: VideoPlayerProps) {
  const def = COMPOSITIONS.find((c) => c.id === compositionId);

  if (!def) {
    return <PlayerError message={`Composition "${compositionId}" not found.`} />;
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
            // Giới hạn chiều cao để player không vượt màn hình
            maxHeight: "60vh",
          }}
          renderLoading={() => <PlayerLoading />}
        />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty src/ui/video-player.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/ui/video-player.tsx
git commit -m "feat(editor): add VideoPlayer wrapper with lazy-loading and error states"
```

---

### Task 5: Editor Page (`/editor/[id]`)

**Files:**
- Create: `src/app/editor/[id]/page.tsx`

- [ ] **Step 1: Write the page component**

```tsx
"use client";

import React, { useRef, useState, useMemo, use } from "react";
import type { PlayerRef } from "@remotion/player";
import { VideoPlayer } from "@/ui/video-player";
import { TimelineControls } from "@/ui/timeline-controls";
import { CompositionSelector } from "@/ui/composition-selector";
import { COMPOSITIONS } from "@/ui/composition-registry";

interface EditorPageProps {
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
 * State management: compositionId nằm trong page, playerRef được share
 * giữa VideoPlayer và TimelineControls.
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors across all files

- [ ] **Step 3: Commit**

```bash
git add src/app/editor/[id]/page.tsx
git commit -m "feat(editor): add /editor/[id] page composing Player, Timeline, and Selector"
```

---

## Acceptance Criteria Coverage

| AC | Coverage |
|----|----------|
| 1. Player load composition từ Remotion project | `VideoPlayer` dùng `React.lazy(def.component)` để dynamic import từ registry |
| 2. Play/Pause hoạt động | `TimelineControls` gọi `playerRef.current.play()` / `pause()` |
| 3. Seek bar kéo được, hiển thị frame number | `TimelineControls` có `<input range>` + frame counter `{current}/{total}` |
| 4. Composition selector đổi composition → player re-render | `EditorPage` giữ `compositionId` state, truyền xuống `VideoPlayer` |
| 5. Loading state khi đang load Remotion bundle | `VideoPlayer` dùng `<Suspense fallback={<PlayerLoading />}>` |
| 6. Error state nếu composition không tồn tại | `VideoPlayer` hiển thị `<PlayerError>` nếu `def` là undefined |

---

## Self-Review

**1. Spec coverage:** All 6 ACs covered (see table above). Each AC maps to specific code in one of the 5 files.

**2. Placeholder scan:** No TBD/TODO/placeholder patterns. All code is complete with implementations.

**3. Type consistency:**
- `PlayerRef` from `@remotion/player` — used consistently in VideoPlayer, TimelineControls, EditorPage
- `CompositionSelectorProps.compositions` — `{ id: string; label: string }[]` — matches `COMPOSITIONS.map(...)` in EditorPage
- `TimelineControlsProps.durationInFrames` — passed from `currentComposition?.durationInFrames ?? 300` in EditorPage
- `VideoPlayerProps.compositionId` — matches `selectedId` from CompositionSelector
