# FE/BE Migration Roadmap — Platform → Clean Frontend/Backend

> **Why this exists:** The recurring audio bug, the lag, and the worktree-inconsistency are all symptoms of a "bolt-on" architecture where OpenCut-AI (a forked editor, `:3001`) depends on the Platform (Auto_Video_Editor Next.js, `:3000`) at runtime via hardcoded URLs. This roadmap migrates to a clean FE/BE where the backend owns assets/projects and the frontend calls an API.

## Current state (the mess)

```
Auto_Video_Editor (Platform, :3000)   ← "the station 1-7 runner app"
├─ Next.js web UI (landing, dashboard, episode mgmt)
├─ API routes + trigger for Python pipeline S1-S7
└─ Serves static files from public/ (incl. TTS audio)  ← OpenCut-AI fetches from here at runtime
OpenCut-AI (editor, :3001, separate repo) — references http://localhost:3000/... hardcoded
```

**Coupling points that cause the bugs:**
- `editor-provider.tsx`: `patch.sourceUrl = platformOrigin + "/assets/audio/tts/..."` (hardcoded port/URL).
- Import flow: `?import=<url>` → fetch → localStorage → IndexedDB → redirect → normalize. No single API.
- Assets live in Platform's `public/` → runtime fetch depends on Platform being up.

## Target state (clean FE/BE)

```
BACKEND (1 service, :3000) — Auto_Video_Editor, single source of truth
├─ POST /api/pipeline/:episode/run    trigger S1-S7
├─ POST /api/projects/import          accept pipeline JSON, validate, normalize, store
├─ GET  /api/projects/:id             return project JSON
├─ PUT  /api/projects/:id             editor saves back
├─ GET  /api/assets/:id               stream TTS/image (Content-Type, Range, CORS)
└─ Storage: SQLite (project/meta) + ObjectStore/FS (binary assets)

FRONTEND A: Platform UI  ──┐
FRONTEND B: OpenCut-AI   ──┴── both call the backend API; OpenCut-AI caches locally (IndexedDB) but backend is source of truth
```

**Principles:**
1. Single source of truth = backend. Assets/projects live in backend storage, not in a web server's `public/`.
2. OpenCut-AI STAYS a separate repo (it's a forked editor with its own history; merging = nightmare). It calls the API.
3. No big-bang — each phase backward-compatible; old flows keep working until new ones are proven.

## Phases

### Phase 1 — Asset API + Local Ingestion ⭐ (do FIRST; kills the audio bug)
- **Backend:** add `GET /api/assets/tts/:id` (or generic `/api/assets/:id`) — stream from `public/assets/...` with proper headers (Content-Type, Accept-Ranges, Range, CORS). Just wraps existing files; zero data risk.
- **OpenCut-AI import (`importMediaPhase2`):** for each audio element, fetch TTS via the API and store locally via `addMediaAsset` (same path as image shots). Switch element to `sourceType: "upload"` + local `mediaId` (drop the Platform `sourceUrl`).
- **Config:** backend base URL from env (`NEXT_PUBLIC_API_BASE`), no hardcoded `localhost:3000`.
- **Result:** at import (Platform up, since pipeline just ran) audio is fetched + stored in OpenCut-AI's IndexedDB/OPFS; at runtime (play) it reads locally → **no Platform needed** → audio bug cannot recur.
- **Effort:** ~1-2 days. **Risk:** low (additive).

### Phase 2 — Project Import API (replace the import hack)
- **Backend:** `POST /api/projects/import` — accept pipeline JSON, validate v10 schema, normalize (startTime/fontSize/position/audio) SERVER-SIDE, return project id + asset list. Consolidate the normalize logic currently scattered across `page.tsx` (postProcessProject) and `editor-provider.tsx` (importMediaPhase2) into one testable place.
- **OpenCut-AI:** replace the redirect + localStorage + IndexedDB chain with a single API call. IndexedDB becomes a cache; backend is source of truth.
- **Effort:** ~3-5 days. **Risk:** medium (backward-compat for already-imported projects).

### Phase 3 — Formal Asset Store (remove "files in public/")
- Pipeline (S1-S7) writes assets to a dedicated store (`storage/assets/`) + metadata to SQLite, NOT to `public/`.
- `GET /api/assets/:id` reads from the store via metadata, not a hardcoded path.
- Both frontends reference assets by **id**, not URL/path.
- **Effort:** ~3-5 days. **Risk:** medium (migrate existing `public/` files + update pipeline output path).

### Phase 4 — Editor↔Backend Sync (standard save/load)
- Backend: `PUT /api/projects/:id`, `GET /api/projects/:id`.
- OpenCut-AI: save → `PUT` to backend (IndexedDB = offline cache). Load → `GET` from backend. Opening `/editor/:id` fetches from backend.
- **Result:** project is a backend resource, visible from any machine; foundation for collaboration/versioning.
- **Effort:** ~3-5 days. **Risk:** medium (offline-edit conflict resolution).

### Phase 5 (optional) — Extract backend as standalone service
- Only when Platform Next.js + API routes + pipeline outgrow a single app (team scale, perf, separate deploy). Extract to a dedicated Node/FastAPI service. Only after Phase 1-4 and with a concrete reason.
- **Effort:** ~1-2 weeks.

## Key architecture decisions (lock before coding)

| Question | Recommendation | Reason |
|----------|----------------|--------|
| Where is the backend? | Extend Platform's existing Next.js API routes (SQLite + better-auth already there) | Don't build a new service from scratch; evolve |
| Merge OpenCut-AI into Platform? | NO — keep separate repo | It's a forked editor; merging = upstream-sync nightmare |
| Asset store? | Filesystem + SQLite metadata (Phase 3) | Simple, sufficient for current volume; S3/MinIO later if needed |
| Cross-repo contract? | Shared OpenAPI/schema in `docs/architecture/` | Prevent drift between backend (Auto_Video_Editor) and FE (OpenCut-AI) |
| Auth? | Reuse better-auth already in Platform | Already exists |

## Summary

| Phase | Kills which pain | Effort | Depends on |
|-------|------------------|--------|------------|
| 1. Asset API + local ingestion | Audio unavailable/recurs | 1-2 days | none |
| 2. Project import API | Import hack, scattered normalize | 3-5 days | Phase 1 |
| 3. Asset store | Files-in-public coupling | 3-5 days | Phase 1 |
| 4. Editor↔BE sync | Project local-only | 3-5 days | Phase 2 |
| 5. Extract BE service | Scale/team | 1-2 weeks | Phase 1-4 |

**Phase 1-4 ≈ 2-3 weeks** for a clean FE/BE foundation. Phase 5 only if needed.
