# 🤖 AI AGENTS CONSTITUTION & PROJECT STRUCTURE

**IMPORTANT:** All AI agents must read and adhere to this document and `WORKFLOW.md` before creating, modifying, or moving any files. Failure to comply with the directory structure will result in immediate rejection of the task.

## 1. OFFICIAL PROJECT STRUCTURE (100% STRICT - DOMAIN DRIVEN)

To prevent fragmentation, this project uses a **Feature-Sliced/Domain-Driven** architecture. Every file MUST reside within this hierarchy. No new files are allowed at the Root level (except system configs like `package.json`).

```text
/ (Root)
├── /src                   # Core source code & Backend Services
│   ├── /app               # Next.js Pages & Layouts (UI Tools ONLY: action-builder, bg-editor)
│   ├── /pipeline          # 🌟 PIPELINE LOGIC (Data/Video processing pipelines: S1-S7)
│   │                      #    S1: Script Rewriter → S2: Extractor → S3: Storyboard Breaker
│   │                      #    S4: Audio Generator → S5: Visual Director → S6: Sound/VFX
│   │                      #    S7: Video Compiler → output opencut_{id}.json (v10 format)
│   ├── /services          # 🌟 DOMAIN-DRIVEN LOGIC (All business logic goes here)
│   │   ├── /ai-director   # AI generation scripts, triple-script-engine, director
│   │   ├── /character     # Character pipeline, rigger, action-factory, rig-anatomy
│   │   ├── /asset-manager # Asset registry, ingestors, missing assets backlog processing
│   │   └── /video-builder # Subtitles sync, chunk scripts, stitch video, render prep
│   ├── /shared            # Shared utilities across domains
│   │   ├── /api-clients   # LLM providers (nano-banana-v2, vercel-ai, tts_manager) + OpenCut bridge
│   │   └── /types         # TypeScript definitions and interfaces (ai-schemas, animation)
│   └── /ui                # Reusable React components for /app (ExpressionPlayer, etc.)
│
├── /OpenCut-AI            # 🌟 OpenCut-AI Video Editor (nested repo, ptnhan2/OpenCut-AI)
│                          #    Port 3001. Runs independently from Platform (port 3000).
│                          #    Connected via API Bridge + project JSON import.
│
├── /scripts               # 🌟 CLI ENTRY POINTS ONLY (Terminal Automation)
│                          # MUST NOT contain business logic. These are thin wrappers
│                          # that import from /src/services and execute.
│
├── /public                # Static Assets
│   └── /assets            # Unified Asset Pipeline (expressions, items, backgrounds, etc.)
│   └── /scripts           # Pipeline output: opencut_{episode_id}.json (OpenCut v10)
│
├── /.archive              # Trash/Deprecated/Lab code. Agents should ignore this folder.
└── /docs                  # Planning artifacts, architecture, and logs
│   └── /architecture      # OpenCut integration guide + project schema
```

## 2. AI DISCIPLINE RULES

### Rule A: "The Root is Lava & Logic goes to Services or Pipeline"

1. Do NOT create files in the project root.
2. If you are creating a new feature or logic (Python or TS), it **MUST** go into the appropriate domain folder in `/src/services/` OR `/src/pipeline/`.
3. If it's a CLI command to run that logic, create a thin wrapper in `/scripts`.

### Rule B: "Open-Closed Configs"

Files in `/src/services/*/config` or registry files are sensitive.

- You may **APPEND** new configuration keys.
- You are **FORBIDDEN** from modifying or deleting existing keys unless explicitly commanded by the User.

### Rule C: "Frozen Blocks"

Respect the `// 🔒 FROZEN BLOCK` markers in code. These contain the user-validated algorithms. Do not attempt to optimize or rewrite them.

### Rule D: "The Great Migration Protocol"

If you find a file that is misplaced (not following the structure above), your first priority is to **MOVE** it to the correct `/src/services/` or `/src/pipeline/` domain and **FIX** all broken import paths immediately.

### Rule E: "AI-First API Design (Function Calling Centric)"

The ultimate "end-user" of this system's runtime is NOT a human, but **Gemini via Function Calling**.
Therefore, all components, props, and schemas must be designed for an LLM to understand and use easily:

- **Semantic Naming:** Use clear, descriptive names for IDs (`talk_sad`, `run_cycle`) instead of arbitrary names (`action_01`).
- **Strict Enums:** Use strict string literals/enums (e.g., `facingDirection: 'left' | 'right'`) rather than expecting the AI to guess arbitrary values like CSS transforms.
- **Abstract Complexity:** Hide pixel-perfect coordinates or complex math from the AI's API. Provide high-level relative positioning (e.g., `position: 'left'`) that the React engine converts to absolute values.
- **Safe Fallbacks:** Ensure robust error handling and fallbacks if the AI hallucinates an ID.

### Rule F: "Fence Editing"

When AI agents modify code, they MUST respect a strict boundary system to prevent accidental deletion or modification of verified code.

#### Markers

- `# ✋ FROZEN` / `// 🔒 FROZEN BLOCK` — Code above this marker is verified and MUST NOT be modified.
- `# ✏️ EDIT ZONE START (line X)` / `# ✏️ EDIT ZONE END (line Y)` — Only code between these markers may be changed.

#### Diff Gate

After making changes, the agent MUST:
1. Run `git diff -- <file>`
2. Verify every changed line falls within the EDIT ZONE
3. If any change falls outside → revert immediately and retry
4. Include full diff output in completion report

#### 1 Task = 1 File = 1 Commit

- Each Worker prompt targets exactly ONE file
- Worker commits immediately after verification
- Manager reviews diff (not description) before approving
- Tasks dispatched sequentially, never in parallel on the same module

### Rule G: "Frontend Component Discipline"

Applies to all Next.js/React components. FE Dev Agent MUST follow these rules.

1. **Pages only compose** — `/src/app/**/page.tsx` imports and arranges components only. No raw `<div className="flex...">` blocks in pages.
2. **Design tokens only** — No hardcoded colors (`#fff`, `rgb(...)`). Use shadcn/ui CSS variables (`bg-primary`, `text-muted-foreground`).
3. **1 component = 1 file** — One React component per file. Sub-components allowed only if truly private (not exported).
4. **Props interface before JSX** — Interface/type must be defined before the function component.
5. **Load taste-skill first** — Before designing any UI, FE Dev Agent MUST run `skill("taste-skill")` to avoid generic AI aesthetics.
6. **Storybook for isolation** — Develop each component in Storybook before integrating into pages. Read existing `.stories.tsx` to discover available components.
7. **GSAP for complex animation** — Use GSAP for scroll-trigger, stagger, and timeline animations. Use CSS transitions for simple hover states.
8. **Chrome DevTools for debugging** — Use Chrome DevTools MCP tools to screenshot, inspect DOM, and verify visual output before submitting PR.

#### Agent Constitutions

Detailed agent rules are defined in:
- `.kilo/agent/worker.md` — Worker agent rules
- `.kilo/agent/manager.md` — Manager agent rules
- `.kilo/agent/fe-dev.md` — Frontend Dev agent rules

All agents MUST read their respective constitution before starting any task.

---

_Last updated: June 2026_

### Rule H: "Approved Runtime Dependencies"

For SQLite access from Next.js API routes, the project standard is **node:sqlite** (Node.js 22+ built-in, zero external deps). Requires --experimental-sqlite flag.

**Pre-approved for all API route Workers:**
- import { DatabaseSync } from "node:sqlite" — no plan re-approval needed
- Type stubs at src/shared/types/node-sqlite.d.ts — auto-approved EDIT ZONE expansion

**DO NOT use:**
- Python subprocess for DB reads from API routes
- `better-sqlite3` (replaced by `node:sqlite`)

### Rule I: "Comment Convention (AI-First Documentation)"

All code in this project is consumed by both humans and AI (Gemini via Function Calling). Every function must be self-documenting enough for an LLM to understand its purpose without reading the implementation.

#### Mandatory Docstrings

- **ALL functions** (public AND private) MUST have a docstring/JSDoc.
- **TypeScript:** Use JSDoc format `/** ... */`.
- **Python:** Use Google-style triple-quote docstring `"""..."""`.

#### Content Requirements

Every docstring MUST include:
1. **What the function does** — 1-2 sentences in Vietnamese (business logic)
2. **Parameters** — `@param` (TS) or `Args:` (Python), with type and description in English
3. **Returns** — `@returns` (TS) or `Returns:` (Python), with type and description
4. **Side effects** — If the function mutates state, writes to DB, makes API calls, etc.

Example (TypeScript):
```ts
/**
 * Lấy danh sách assets từ DB với filter và phân trang.
 *
 * @param status - Filter by asset status (PENDING, PROCESSING, READY, FAILED)
 * @param limit  - Max items per page (default 20, max 100)
 * @param offset - Pagination offset (default 0)
 * @returns Paginated asset list with total count
 * @sideEffect Reads from SQLite asset_queue table (read-only)
 */
```

Example (Python):
```python
def save_script(episode_id: str, content: str) -> dict:
    """Lưu nội dung kịch bản đã được viết lại vào tập phim trong database.

    Args:
        episode_id: Episode ID to save the script to.
        content: Full rewritten screenplay content (min 100 chars).

    Returns:
        dict with "message" and "word_count" on success, or "error" on failure.

    Side Effects:
        Updates Episode.script_content in the database. Rolls back on error.
    """
```

#### Section Organization

Use consistent section separators to organize code within files:

- **TypeScript:** `// ── Section Name ──────────────────────────────────────────`
- **Python:** `# ── Section Name ──────────────────────────────────────────`

Common section labels: `Constants`, `Types`, `Helpers`, `Handlers`, `Main`, `Tests`, etc.

#### Comment Language

| Context | Language |
|---------|----------|
| Business logic / domain concepts | Vietnamese |
| Function parameters, return types, error messages | English (for Gemini tool calling) |
| TODO / FIXME | Bilingual: `TODO(#issue): Vietnamese description` |
| Inline explanation for complex/non-obvious logic | Vietnamese |

#### Forbidden

- ❌ Functions without docstring
- ❌ Comments that restate obvious code (`// increment i`)
- ❌ Commented-out code left in commit (delete it — git history preserves it)
- ❌ Outdated comments that don't match the code


---

## 3. TECHNOLOGY PIVOT — Remotion → OpenCut

### Rule J: "Remotion Deprecated — OpenCut is the Video Editor"

**Effective:** 2026-06-15

Remotion has been **completely removed** from the technology stack. All Remotion code has been archived to `.archive/remotion/`.

**Why:** Remotion is a programmatic render engine (suitable for server-side MP4 generation), NOT a video editor (suitable for timeline-based editing with multi-track, effects, ripple edit, snapping). The project requires a CapCut-like editor that can be controlled by AI via API.

**New direction:** The project is pivoting to integrate **OpenCut** (open-source video editor) as the primary editor engine. OpenCut provides:
- Professional timeline (multi-track, ripple edit, snapping, undo/redo)
- Preview panel
- Asset management
- Export capabilities

**Platform role:** The Next.js Platform (Landing Page, Asset Dashboard, Episode Detail, APIs) continues as the **management layer** — drama/episode/asset management, pipeline trigger, and AI orchestration. OpenCut handles the **editing layer**.

**Remaining stack:** Next.js + React (Web Platform), Python S1-S7 Pipeline (content generation), SQLite (data), OpenCut (video editing).

**For AI coding agents:** If you see `remotion/`, `@remotion/`, or Remotion-related code, it is **DEPRECATED**. Do NOT modify, use, or reference it. Direct all video editing work to OpenCut integration.

---

### Rule K: "OpenCut-AI Integration — Separate Repo & API Boundary"

**Effective:** 2026-06-23 (updated 2026-06-29 — Issue #246)

#### Repo Boundary (READ FIRST)

OpenCut-AI là **SEPARATE repo** — fork của `Ekaanth/OpenCut-AI`, mirror tại `ptnhan2/OpenCut-AI`, nằm vật lý trong `OpenCut-AI/` nhưng KHÔNG thuộc Platform (`ptnhan2/Auto_Video_Editor`).

| Khía cạnh | Quy tắc |
|-----------|---------|
| Repo identity | `ptnhan2/OpenCut-AI` ≠ `ptnhan2/Auto_Video_Editor`. Hai lịch sử git riêng. |
| `.gitignore` | `OpenCut-AI/` đã bị ignore ở Platform → KHÔNG bao giờ commit file OpenCut-AI vào repo này. |
| Git operations | MỌI lệnh git cho OpenCut-AI phải dùng `git -C OpenCut-AI ...` (vd: `git -C OpenCut-AI status`, `git -C OpenCut-AI push`). KHÔNG chạy `git add OpenCut-AI/...` trong Platform. |
| Push / PR | Push/PR OpenCut-AI code → `ptnhan2/OpenCut-AI`, KHÔNG → `ptnhan2/Auto_Video_Editor`. |
| Worktree | Platform worktree KHÔNG include `OpenCut-AI/` (nó là nested repo, chỉ có ở main worktree `C:\DevWork\Auto_Video_Editor\OpenCut-AI`). Để làm việc với OpenCut-AI trong worktree riêng: `git -C OpenCut-AI worktree add <path> <branch>`. |
| Cross-repo feature | Một feature chạm cả 2 repo = **2 PR** (1 Platform + 1 OpenCut-AI). Mỗi PR body phải link PR kia (`Related OpenCut-AI PR: #NN` / `Related Platform PR: #NN`). |
| API contract | `docs/architecture/opencut-api-schema.yaml` (OpenAPI 3.0) là **"link" duy nhất** giữa 2 repo. Đổi contract = cập nhật schema TRƯỚC, rồi implement ở cả 2 bên. |

#### Key Facts

| Concept | Value |
|---------|-------|
| OpenCut-AI location | `OpenCut-AI/` (nested git repo, NOT submodule, NOT part of Platform) |
| Editor URL | `http://localhost:3001` |
| Platform URL | `http://localhost:3000` |
| Pipeline output | `public/scripts/opencut_{episode_id}.json` |
| Output format | OpenCut v10 SerializedProject JSON |
| Integration docs | `docs/architecture/opencut_integration_guide.md` |
| API contract | `docs/architecture/opencut-api-schema.yaml` |
| Sample schema | `docs/architecture/opencut_project_schema.json` |

#### Pipeline → OpenCut Data Flow

```
S5 (Visual Director) ──→ DB: opencut_transition, opencut_effects (JSON)
S6 (Sound/VFX)       ──→ DB: sfx_id, vfx_tags, bgm_track
S7 (Video Compiler)  ──→ public/scripts/opencut_{id}.json
                         ↓
                    OpenCut-AI import (via API bridge)
```

#### S5 Visual Director — AI Prompt Rules

S5 teaches AI to output **OpenCut-AI native terminology** (via enums in `src/shared/schema_validator.py`):
- **Transitions:** 20 OpenCut types (cross-dissolve, dip-black, morph, glitch, film-burn, page-peel, ...)
- **Camera Effects:** 5 types (zoom, shake, pan, rotate, static)
- **Atmosphere Effects:** 9 types (grain, chromatic, vignette, blur, glow, shadow, halftone, light-leak, paper-texture)
- **Character Position:** Pixel coordinates on 1920×1080 canvas (not 9-grid strings)

> ⚠️ **Do NOT add mapping tables in S7.** AI handles all terminology translation in its prompt. S7 is a pure assembler — reads JSON from DB columns, assembles v10 project structure.

#### Git Operations on OpenCut-AI

When modifying OpenCut-AI code, use `git -C OpenCut-AI` for ALL git commands. Push/PR go to `ptnhan2/OpenCut-AI`, NOT `ptnhan2/Auto_Video_Editor`. See "Repo Boundary" table above for worktree & cross-repo rules.

---

### Rule L: "Live Runtime — Servers & Browser Verification"

**Khi nào áp dụng:** User yêu cầu "run live", "test live", "chạy runtime", "mở browser check", "verify thực tế", "chạy thử xem có hoạt động không". Khi User nói vậy, **KHÔNG** chỉ chạy unit test / curl mock — phải mở server thật + browser thật và để User nhìn thấy kết quả.

> ⚠️ **Mục tiêu:** User nói "run live" → Agent đọc section này 1 lần là làm đúng từ đầu: mở cả 2 server (background), mở browser thật, verify bằng DOM/state, để nguyên cho User check. Đừng lan man sang `WORKFLOW.md` (file đó lỗi thời, không phải runbook).

#### L.1 — Kiến trúc 2 server

| Server | Repo / vị trí | Port | Lệnh chạy | Pkg manager |
|--------|---------------|------|-----------|-------------|
| **Platform** (backend: API, assets, pipeline) | worktree hiện tại (root) | `:3000` | `npx cross-env NODE_OPTIONS=--experimental-sqlite next dev` | npm |
| **OpenCut-AI** (editor frontend) | `C:\DevWork\Auto_Video_Editor\OpenCut-AI\apps\web` | `:3001` | `bun dev` | bun |

Platform gọi cross-origin từ OpenCut-AI (xem L.5 CORS). Lệnh dev của Platform (`npm run dev`) có `predev` chạy `sync-assets` — có thể chậm/lỗi; khi chỉ test API route thì dùng `next dev` trực tiếp như bảng trên.

#### L.2 — Khởi động server: DÙNG `background_process`, KHÔNG `bash`

Server là tiến trình dài hạn. **BẮT BUỘC** tool `background_process` (action `start`) với `ready.port` + `ready.pattern`. Dùng `bash`/PowerShell chạy `next dev` → **treo session vô thời hạn**.

Ví dụ Platform:
```
background_process start:
  command: npx cross-env NODE_OPTIONS=--experimental-sqlite next dev
  workdir: <worktree root>
  ready: { port: 3000, pattern: "Ready in|Local:", timeout: 120 }
```
OpenCut-AI: tương tự, `command: bun dev`, `workdir: .../OpenCut-AI/apps/web`, port 3001.

- Để server **chạy nguyên**. **KHÔNG tự stop** trừ khi User yêu cầu test "tắt Platform".
- Kiểm tra: `background_process list` / `status` / `logs`.
- Sau khi sửa `next.config.ts` → **restart** server (next.config KHÔNG HMR).

#### L.3 — Worktree realities (ĐỌC KỸ — tránh lặp sai lầm)

1. **OpenCut-AI KHÔNG có trong worktree.** Nó là nested git repo riêng, chỉ tồn tại ở main worktree `C:\DevWork\Auto_Video_Editor\OpenCut-AI`. Để test thay đổi OpenCut-AI → làm việc trong thư mục đó (tạo branch riêng `git -C .../OpenCut-AI checkout -b ...`), KHÔNG trong worktree Platform.
2. **Artifacts bị gitignore KHÔNG có trong worktree mới:** `public/assets/audio/tts/*.mp3`, `public/scripts/opencut_*.json` (do pipeline sinh ra, `*.mp3` bị gitignore). Worktree = trống. Để test live, **copy artifact thật từ main worktree** (file gitignored → không ô nhiễm git):
   ```powershell
   Copy-Item "C:\DevWork\Auto_Video_Editor\public\assets\audio\tts\*.mp3" "public\assets\audio\tts\"
   Copy-Item "C:\DevWork\Auto_Video_Editor\public\scripts\opencut_*.json" "public\scripts\"
   ```
3. **KHÔNG tạo file giả/mock** (VD fake `.mp3` 10 byte) để "smoke test" — User ghét và đó không phải verify thật. Luôn dùng artifact thật từ main worktree.

#### L.4 — Browser verification: Chrome DevTools MCP (KHÔNG screenshot)

Dùng bộ tool `chrome-devtools_*` để mở browser thật:
- `chrome-devtools_new_page` / `navigate_page` — mở URL
- `chrome-devtools_take_snapshot` — đọc DOM dạng **text** (a11y tree): xem tracks, nút, text
- `chrome-devtools_evaluate_script` — chạy JS đọc trạng thái thật (IndexedDB, editor state, fetch test)
- `chrome-devtools_list_network_requests` — xem API calls thực tế
- `chrome-devtools_list_console_messages` — xem errors
- `chrome-devtools_select_page` (`bringToFront: true`) — đưa tab lên cho User xem

> 🚨 **Model KHÔNG đọc được screenshot** (image input không hỗ trợ). **TUYỆT ĐỐI KHÔNG** dùng `take_screenshot` rồi claim "tôi thấy X" — đó là bịa kết quả. **Phải dùng `take_snapshot` (text DOM) hoặc `evaluate_script` (đọc state thật)**, báo kết quả dựa trên output text trả về.

Mở trang cho User xem xong → **đừng đóng tab**. Để server + browser chạy nguyên, báo User tự check.

#### L.5 — Cross-origin CORS

OpenCut-AI (`:3001`) gọi Platform (`:3000`) = cross-origin. **Mỗi path Platform serve cho OpenCut-AI phải có CORS header** trong `next.config.ts`:
```ts
{ source: "/<path>/:path*", headers: [
  { key: "Access-Control-Allow-Origin", value: "http://localhost:3001" },
  { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
]}
```
Path đã có CORS: `/api/assets/:path*`, `/scripts/:path*` (project JSON import), `/api/opencut/:path*`, `/assets/:path*`. **Thiếu CORS → browser block → "Failed to fetch".**

#### L.6 — Verify pattern chuẩn (làm theo thứ tự)

1. Start cả 2 server (background_process, L.2). Chờ `ready`.
2. Nếu cần artifact → copy thật từ main worktree (L.3).
3. `curl` endpoint Platform xác nhận `200` + headers đúng (Content-Type, CORS).
4. `chrome-devtools_new_page` mở editor / URL import.
5. **Chờ load** — import có thể mất **60–180 giây** (bottleneck là `importMediaPhase2` sinh 51 ảnh placeholder qua `genPNGBlob`, CHƯA phải 33 lần fetch audio). Đừng kết luận sớm: dùng `evaluate_script` poll cho đến khi audio elements có `mediaId` local (UUID, không còn `media-tts-`) thay vì `sleep` cố định, rồi `take_snapshot` xác nhận UI.
6. `list_network_requests` xác nhận API calls đúng (VD `/api/assets/tts/...` → `200`). **Lưu ý:** network log bị clear giữa các redirect (import flow có 2-3 redirect) → dùng `includePreservedRequests: true`, hoặc fallback `evaluate_script` đếm `performance.getEntriesByType('resource').filter(e => e.name.includes('/api/assets/tts/'))`.
7. `list_console_messages` xác nhận KHÔNG có error liên quan đến feature.
8. Để browser + server chạy nguyên, đưa tab lên (`select_page` + `bringToFront`), báo User check.

#### L.7 — Reset state để re-test (OpenCut-AI IndexedDB)

OpenCut-AI cache project/media trong IndexedDB. Để re-import sạch (xóa project cũ đang chặn test):
```js
// chrome-devtools_evaluate_script
const dbs = await indexedDB.databases();
for (const d of dbs) await new Promise(r=>{
  const q = indexedDB.deleteDatabase(d.name);
  q.onsuccess=q.onerror=q.onblocked=()=>r();
});
localStorage.clear(); sessionStorage.clear();
```

> ⚠️ **Lưu ý version-control:** OpenCut-AI có feature version-control (branch/commit) bị **race khi React StrictMode double-invoke ở dev** → log `ConstraintError "by-name"` (non-fatal, đã catch). Nếu import bị chặn kỳ lạ → reset IndexedDB như trên rồi retry.

#### L.8 — Import flow (tham khảo)

OpenCut-AI import project qua URL: `http://localhost:3001/editor/x?import=<URL_JSON>`. URL JSON thường là `http://localhost:3000/scripts/opencut_<id>.json`. Flow: fetch JSON → `postProcessProject` → localStorage → redirect → `importProjectPhase1` (IndexedDB) → redirect → `importMediaPhase2` (fetch+store media). Cả chain cross-origin → cần CORS ở L.5.

---
