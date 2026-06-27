# OpenCut-AI Issue #235 — Investigation Report & Findings

> **Context:** This doc captures the full investigation from worker session `investigate-opencut-ui-lag` so the Manager can understand the root causes WITHOUT reading the chat history. Cross-reference: PR ptnhan2/OpenCut-AI `fix/235-opencut-ui-root-cause`, and `fe-be-migration-roadmap.md`.

## Original Issue (#235)
3 symptoms in OpenCut-AI preview, suspected common root: `ResizablePanelGroup` re-render via `useEditor()` subscription.
- **Symptom A:** UI lag ~1s (ResizablePanelGroup 2356ms/cycle with 51 assets, 20,815 React measures/5s).
- **Symptom B:** Playhead jerky (not smooth like CapCut).
- **Symptom C:** Subtitle not rendering on canvas.

## Investigation Setup
- Reproduced with a REAL pipeline project: `opencut_019e249d5cc2a5f8edee0a42bc472caf.json` (7 scenes, 24 tracks, 51 image assets, TTS dialogue). Imported via `?import=` flow.
- OpenCut-AI dev server `:3001`. Platform served via a static server on `:3000` for audio.

## Root Cause Verdicts

### Symptom A (UI lag) — FIXED by this PR ✅
**Root cause:** `useEditor()` (`hooks/use-editor.ts`) is a monolithic subscription — it subscribes to ALL 7 managers (playback, timeline, scenes, project, media, renderer, selection) and re-renders every consumer on ANY notify. During playback, `playback.notify()` (throttled 2fps) re-rendered the whole React tree incl. `ResizablePanelGroup` (react-resizable-panels re-measures layout) + 51 `DraggableItem` components.

**Fix (committed):**
- `playback-manager.ts`: removed throttled `notify()` from the continuous-play branch of `updateTime()`. The `playback-update` CustomEvent still dispatches at 60fps. `notify()` kept on play/pause/seek/boundary only.
- `draggable-item.tsx`: hoisted `new window.Image()` (drag-image) to module scope — was creating 51 Image objects per render.

**Verification (definitive):** subscribed a counter to each manager, called `playback.play()` directly via the editor instance, measured during 2.5s continuous play:
```
playback: 3 (seek+play+pause) | timeline/scenes/project/media/renderer/selection: 0
```
→ NO manager notifies during continuous play. Commit works as intended.

**NOTE — a dead end to avoid:** I first tried memoizing the panel tree (`React.memo(PanelTree)` in `page.tsx`) to also stop import-phase re-renders. That BROKE the canvas render-tree rebuild (RenderTreeController + PreviewCanvas live inside the panel tree → memo blocked their re-render → canvas went stale). Reverted. Do NOT re-introduce a panel-tree memo without first relocating RenderTreeController outside the memoized subtree.

### Symptom B (playhead jerky) — PARTIALLY FIXED ⚠️
**Root cause (original):** `TimelinePlayhead` read `currentTime` via `useEditor()` React subscription; throttled notify (2fps) → playhead moved 2fps.

**Fix (committed):** playhead now subscribes to the `playback-update` event and sets `style.transform` (GPU-composited, no reflow) imperatively. Verified playhead responds to events at full rate when main thread is free.

**RESIDUAL jerkiness (NOT fixed — deeper issue):** Measured during real playback: RAF fires only ~1/sec (main thread blocked ~1.2s/frame). So even the event-driven playhead updates ~1fps. Root cause of the blocking:
1. **mediabunny audio buffer iteration** runs on the main thread each frame.
2. **Canvas render** of 28 nodes/frame (10 image + 8 text + 9 transition) with WebGL effect passes.

→ CapCut is smooth because it uses native (hardware, off-main-thread) decode; OpenCut-AI uses JS decode on the main thread. **Transform fix does NOT help here** (issue is RAF frequency, not reflow).

**Considered & rejected:** WAAPI (Web Animations API) compositor-driven playhead — would be smooth regardless of main thread, BUT desyncs from the video frame (canvas lags equally), which is wrong for a video editor. Kept event-driven (in sync with canvas).

### Symptom C (subtitle hidden) — NOT A BUG, working ✅
**Finding:** With the clean reload, the subtitle RENDERS correctly (verified: 14,420 bright pixels in the subtitle band at the subtitle's time range). Text position is normalized to center-relative `{0, 380}` in BOTH the active scene's timeline AND IndexedDB.

**Earlier false alarm:** I initially reported "subtitle hidden" based on comparing the active scene's text element (timeline) against a DIFFERENT scene's text element (from `getScenes()` first match). `getTracks()` returns the ACTIVE scene's tracks; the mismatch was across scenes, not a desync. No persistence bug exists.

## Audio "Unavailable" / No-Sound — SEPARATE architectural issue (NOT in #235 scope)

**Why "Audio unavailable" appears:** Audio/TTS tracks reference Platform URLs: `http://localhost:3000/assets/audio/tts/<id>.mp3`. When Platform (Auto_Video_Editor, port 3000) is NOT running → fetch fails → WaveSurfer shows "Audio unavailable".

**Why it recurs across worktrees:** The audio code is IDENTICAL across branches (`fix-231-opencut-renderer` and this branch both set `sourceUrl = http://localhost:3000/...`). The "fix" in the fix-231 session was that Platform was RUNNING there. It is a RUNTIME/ENVIRONMENT dependency, NOT a code regression and NOT worktree-specific.

**Why no sound even when files are served (static server test):** `masterLevels = {peak:0, rms:0}` during play. Three compounded reasons:
1. The "Lời thoại" (TTS dialogue) track is `muted: true` in the imported project (data).
2. "SFX" and "Nhạc nền" tracks are `sourceType: "upload"` with NO sourceUrl/mediaId (placeholder tracks from the pipeline — no actual audio data).
3. Even unmuted + files served, the audio-manager (mediabunny) did not produce sound — needs the real Platform (Next.js) or deeper audio-decode debugging.

**Permanent fix (recommended):** local audio ingestion during import — see `fe-be-migration-roadmap.md` Phase 1.

## What this PR fixes vs defers

| Item | Status |
|------|--------|
| Symptom A (React re-render lag) | ✅ Fixed (playback-manager + hoist) |
| Symptom B (playhead, when main thread free) | ✅ Improved (event-driven + transform) |
| Symptom B residual (main-thread blocking) | ⚠️ Deferred — needs audio worker + canvas optimize |
| Symptom C (subtitle) | ✅ Already works (was a false alarm) |
| Audio unavailable / no-sound | ⚠️ Deferred — architectural (Platform runtime dependency) |

## Key files (OpenCut-AI repo, branch `fix/235-opencut-ui-root-cause`)
- `apps/web/src/core/managers/playback-manager.ts` — removed continuous-play notify
- `apps/web/src/components/editor/panels/timeline/timeline-playhead.tsx` — event-driven + transform
- `apps/web/src/components/editor/panels/preview/toolbar.tsx` — timecode via event
- `apps/web/src/hooks/timeline/use-timeline-playhead.ts` — auto-scroll via event
- `apps/web/src/components/editor/panels/assets/draggable-item.tsx` — hoisted drag image
- `apps/web/src/core/managers/__tests__/playback-manager.test.ts` — TDD tests
