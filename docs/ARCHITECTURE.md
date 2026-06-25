# Auto Video Editor — Architecture

**Last updated:** 2026-06-25

---

## System Overview

| Component | Tech | Port | Purpose |
|-----------|------|------|---------|
| **Platform** | Next.js + React + TailwindCSS | 3000 | Web UI, API routes, drama/episode/asset management, pipeline trigger |
| **OpenCut-AI Editor** | Next.js + Bun + IndexedDB/OPFS | 3001 | Professional video editor engine (multi-track timeline, effects, export) |
| **Pipeline S1-S7** | Python (google-genai, edge-tts, pydantic, aiohttp) | — | Text → Video transformation: script rewriting → storyboard → audio → visual → OpenCut JSON |
| **Database** | SQLite (Platform) + PostgreSQL (OpenCut-AI auth/vc) | — | |

## Data Flow

```
Text Story → S1 (Script Rewriter) → screenplay format
          → S2 (Extractor) → characters, entities
          → S3 (Storyboard Breaker) → shot list
          → S4 (Audio Generator) → voice audio files
          → S5 (Visual Director) → transitions, camera, effects
          → S6 (Sound/VFX Engineer) → BGM, SFX, VFX
          → S7 (Video Compiler) → opencut_{id}.json (v10)

opencut_{id}.json → "Open in Editor" → OpenCut-AI import → timeline → edit → export MP4
```

## Directory Structure

```
/
├── /src
│   ├── /app               # Next.js Pages & Layouts
│   ├── /pipeline          # S1-S7 Pipeline Logic (Python)
│   ├── /services          # Domain-Driven Logic
│   │   ├── /ai-director   # AI orchestration, triple-script-engine
│   │   ├── /character     # Character pipeline, rigger, action-factory
│   │   ├── /asset-manager # Asset registry, ingestors, backlog
│   │   └── /video-builder # Subtitles sync, render prep
│   ├── /shared            # Shared utilities
│   │   ├── /api-clients   # LLM providers + OpenCut bridge
│   │   ├── /prompts       # System prompts for AI agents
│   │   └── /types         # TypeScript type definitions
│   └── /ui                # Reusable React components
├── /OpenCut-AI            # OpenCut-AI Video Editor (nested repo)
├── /scripts               # CLI entry points (thin wrappers)
├── /public
│   ├── /assets            # Unified Asset Pipeline
│   └── /scripts           # Pipeline output: opencut_{id}.json
├── /docs                  # Architecture documentation
│   └── ARCHITECTURE.md    # This file
└── /kilo                  # Agent Manager config + plans
```

## Database

### Platform (SQLite)

**Tables:** `dramas`, `episodes`, `characters`, `episode_characters`, `scenes`, `episode_scenes`, `storyboards`, `storyboard_characters`, `assets`, `asset_queue`

Key fields on `episodes`:
- `content` — raw story/text input for S1
- `script_content` — rewritten screenplay (S1 output)
- `status` — pipeline progress: `draft` | `scripting` | `rendering` | `completed` | `failed` | `needs_review`
- `video_url` — final MP4 URL
- `duration` — seconds

**Access from API routes:** `node:sqlite` (Node.js 22+ built-in) — Rule H.

### OpenCut-AI (PostgreSQL via Drizzle)

Used for: auth (`users`, `sessions`), version control (`project_repositories`, `vc_commits`, `vc_branches`).

**Project data** (timeline, tracks, elements) stored in browser-side **IndexedDB** + **OPFS** — accessed via `StorageService`.

## Pipeline Stations

| S# | Name | File | Input | Output |
|----|------|------|-------|--------|
| 0 | Indexer | `src/pipeline/station_0_indexer.py` | — | `asset_registry.json` |
| 1 | Script Rewriter | `src/pipeline/station_1_script_rewriter.py` | `episode.content` | `episode.script_content` |
| 2 | Extractor | `src/pipeline/station_2_extractor.py` | `script_content` | characters, entities |
| 3 | Storyboard Breaker | `src/pipeline/station_3_storyboard_breaker.py` | script + characters | storyboards |
| 4 | Audio Generator | `src/pipeline/station_4_audio_generator.py` | dialogue | audio files |
| 5 | Visual Director | `src/pipeline/station_5_visual_director.py` | storyboards | `opencut_transition`, `opencut_effects` |
| 6 | Sound/VFX | `src/pipeline/station_6_sound_vfx_engineer.py` | storyboards | `sfx_id`, `vfx_tags`, `bgm_track` |
| 7 | Video Compiler | `src/pipeline/station_7_video_compiler.py` | all above | `opencut_{id}.json` |

**Orchestrator:** `scripts/run_pipeline.py <episode_id>` — runs S0→S7 sequentially with retry (3 attempts, 10s backoff).

**S5 Visual Director:** AI prompt teaches OpenCut-native terminology (see `docs/station_5_comprehensive_visual_standard.md`):
- 20 transition types (cross-dissolve, dip-black, morph, glitch, film-burn, page-peel, etc.)
- 5 camera effects (zoom, shake, pan, rotate, static)
- 9 atmosphere effects (grain, chromatic, vignette, blur, glow, shadow, halftone, light-leak, paper-texture)
- Character positions on 1920×1080 canvas (pixel coordinates, not 9-grid)

**S7 Video Compiler:** Pure assembler — reads `opencut_transition` + `opencut_effects` JSON from DB, builds v10 project structure.

## OpenCut Integration

### Project JSON Format (v10 `SerializedProject`)

Reference: `docs/architecture/opencut_project_schema.json`  
Full guide: `docs/architecture/opencut_integration_guide.md`

Top-level structure:
- `version: 10`
- `metadata: { id, name, duration, createdAt, updatedAt }`
- `scenes[]: { id, name, tracks[], bookmarks[], markers[] }`
- `settings: { fps: 30, canvasSize: { width: 1920, height: 1080 } }`

Track types: `VideoTrack`, `AudioTrack`, `TextTrack`, `StickerTrack`, `EffectTrack`
All time values in seconds (not frames), origin at top-left.

### Platform → OpenCut Bridge

- `src/shared/api-clients/opencut-bridge.ts` — HTTP bridge calling `:3001/api/*`
- "Open in Editor" button → redirects to `:3001/editor/new?import=:3000/scripts/opencut_{id}.json`
- Editor page fetches JSON → `storageService.saveProject()` → loads project

### AI Video Editing (Gemini Orchestration)

- `src/shared/prompts/opencut-system-prompt.ts` — system prompt teaching Gemini to edit video
- `src/shared/types/opencut-tools.ts` — 8 Zod schemas for Gemini function calling
- `src/shared/prompts/opencut-orchestrator.ts` — orchestration loop (read JSON → Gemini → execute → review)
- `src/shared/api-clients/opencut-tool-executor.ts` — tool dispatch to OpenCut API

8 AI tools: `add_clip`, `remove_element`, `set_transition`, `add_effect`, `add_subtitle`, `adjust_volume`, `split_clip`, `export_video`

Review flow: AI proposes edits → `ReviewPanel` shows diff → user approves/rejects → applied to editor.

## Asset Management

- `scripts/run_pipeline.py` automatically triggers S0 (Indexer) before pipeline
- `src/services/asset-manager/sync_registry.ts` — syncs asset_registry.json
- `src/services/asset-manager/asset_factory.ts` — generates missing assets
- `src/services/asset-manager/extract_missing_assets.ts` — identifies backlog
- Assets stored in: `public/assets/{backgrounds, expressions, bgm, sfx}/`

## Key Rules (from AGENTS.md)

| Rule | Description |
|------|-------------|
| **Rule A** | Root is lava — logic goes to `/src/services/` or `/src/pipeline/` |
| **Rule E** | AI-First API Design — semantic naming, strict enums, abstract complexity |
| **Rule H** | `node:sqlite` for API routes (no `better-sqlite3`) |
| **Rule J** | Remotion DEPRECATED — OpenCut-AI is the video editor |
| **Rule K** | OpenCut-AI nested repo at `OpenCut-AI/`, use `git -C OpenCut-AI` |
| **Fence Editing** | 1 task = 1 file = 1 EDIT ZONE, Diff Gate mandatory |

## Quality & Testing

- **Quality Rubric:** `docs/audit/quality-rubric.md` — per-station evaluation criteria (1-5 scale)
- **S1-S3 Evaluation:** `docs/audit/user-guide-s1-s3.md` — step-by-step test instructions
- Pipeline tests: `npx vitest run` (TypeScript), `pytest` (Python)
- API route tests: via vitest with node:sqlite

## Related Docs

| Doc | Topic |
|-----|-------|
| `docs/context_preservation_research.md` | S1 chunking & context preservation |
| `docs/distilled_architecture_guide.md` | S2 Ingestor state machine design |
| `docs/station_5_comprehensive_visual_standard.md` | S5 Visual Director design language |
| `docs/architecture/PIPELINE_ARCHITECTURE_V2.md` | DB-driven pipeline architecture |
| `docs/architecture/opencut_integration_guide.md` | OpenCut v10 JSON integration (837 lines) |
| `docs/architecture/opencut_project_schema.json` | Sample v10 project JSON |
| `docs/audit/quality-rubric.md` | Quality evaluation rubric |
| `docs/plans/ai_director_roadmap.md` | AI Director roadmap |
| `docs/superpowers/plans/2026-05-23-asset-queue-schema.md` | Asset Queue schema |
