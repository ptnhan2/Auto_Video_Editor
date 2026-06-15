# 🤖 AI AGENTS CONSTITUTION & PROJECT STRUCTURE

**IMPORTANT:** All AI agents must read and adhere to this document and `WORKFLOW.md` before creating, modifying, or moving any files. Failure to comply with the directory structure will result in immediate rejection of the task.

## 1. OFFICIAL PROJECT STRUCTURE (100% STRICT - DOMAIN DRIVEN)

To prevent fragmentation, this project uses a **Feature-Sliced/Domain-Driven** architecture. Every file MUST reside within this hierarchy. No new files are allowed at the Root level (except system configs like `package.json`).

```text
/ (Root)
├── /src                   # Core source code & Backend Services
│   ├── /app               # Next.js Pages & Layouts (UI Tools ONLY: action-builder, bg-editor)
│   ├── /pipeline          # 🌟 PIPELINE LOGIC (Data/Video processing pipelines)
│   ├── /services          # 🌟 DOMAIN-DRIVEN LOGIC (All business logic goes here)
│   │   ├── /ai-director   # AI generation scripts, triple-script-engine, director
│   │   ├── /character     # Character pipeline, rigger, action-factory, rig-anatomy
│   │   ├── /asset-manager # Asset registry, ingestors, missing assets backlog processing
│   │   └── /video-builder # Subtitles sync, chunk scripts, stitch video, render prep
│   ├── /shared            # Shared utilities across domains
│   │   ├── /api-clients   # LLM providers (nano-banana-v2, vercel-ai, tts_manager)
│   │   └── /types         # TypeScript definitions and interfaces (ai-schemas, animation)
│   └── /ui                # Reusable React components for /app (ExpressionPlayer, etc.)
│
├── /remotion              # Video Rendering Logic ONLY (Runs in Puppeteer)
│   ├── /components        # Video-specific visual components (e.g., Puppet.tsx)
│   ├── /compositions      # Assembly of components into video scenes
│   └── Root.tsx           # Remotion entry point
│
├── /scripts               # 🌟 CLI ENTRY POINTS ONLY (Terminal Automation)
│                          # MUST NOT contain business logic. These are thin wrappers
│                          # that import from /src/services and execute.
│
├── /public                # Static Assets
│   └── /assets            # Unified Asset Pipeline (expressions, items, backgrounds, etc.)
│
├── /.archive              # Trash/Deprecated/Lab code. Agents should ignore this folder.
└── /docs                  # Planning artifacts, architecture, and logs
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

_Last updated: May 2026_
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

## 3. TECHNOLOGY PIVOT — Remotion to OpenCut

### Rule J: "Remotion Deprecated — OpenCut is the Video Editor"

**Effective:** 2026-06-15

Remotion has been **completely removed** from the technology stack. All Remotion code has been archived to .archive/remotion/.`r

**Why:** Remotion is a programmatic render engine, NOT a video editor. The project requires a CapCut-like editor that can be controlled by AI via API.

**New direction:** The project is pivoting to integrate **OpenCut** (open-source video editor) as the primary editor engine. OpenCut provides: professional timeline (multi-track, ripple edit, snapping, undo/redo), preview panel, asset management, export capabilities.

**Platform role:** The Next.js Platform continues as the **management layer** (drama/episode/asset management, pipeline trigger, AI orchestration). OpenCut handles the **editing layer**.

**Remaining stack:** Next.js + React (Web Platform), Python S1-S7 Pipeline (content generation), SQLite (data), OpenCut (video editing).

**For AI coding agents:** If you see emotion/, @remotion/, or Remotion-related code, it is **DEPRECATED**. Do NOT modify, use, or reference it. Direct all video editing work to OpenCut integration.