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
- **Abstract Complexity:** Hide pixel-perfect coordinates or complex math from the AI's API. Provide high-level relative positioning (e.g., `position: 'left'`) that the internal React/Remotion engine converts to absolute values.
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

#### Agent Constitutions

Detailed agent rules are defined in:
- `.kilo/agent/worker.md` — Worker agent rules
- `.kilo/agent/manager.md` — Manager agent rules

All agents MUST read their respective constitution before starting any task.

---

_Last updated: May 2026_