# 🤖 AI AGENTS CONSTITUTION & PROJECT STRUCTURE

**IMPORTANT:** All AI agents must read and adhere to this document before creating, modifying, or moving any files. Failure to comply with the directory structure will result in immediate rejection of the task.

## 1. OFFICIAL PROJECT STRUCTURE (100% STRICT)

Every file MUST reside within this hierarchy. No new files are allowed at the Root level (except system configs like `package.json`).

```text
/ (Root)
├── /src                   # Core source code (No one-off scripts)
│   ├── /components        # UI Components (Buttons, Control Panels, etc.)
│   ├── /config            # SENSITIVE: Configuration files (e.g., rigging.ts)
│   ├── /constants         # Project constants (e.g., rig-anatomy.ts)
│   ├── /lib               # Utility functions, shared helpers (e.g., nano-banana.ts)
│   ├── /types             # TypeScript definitions and interfaces
│   └── /app               # Next.js Pages & Layouts (Tool UI)
│
├── /remotion              # Video Rendering Logic ONLY
│   ├── /components        # Video-specific visual components (e.g., Puppet.tsx)
│   ├── /compositions      # Assembly of components into video scenes
│   └── Root.tsx           # Remotion entry point
│
├── /scripts               # CLI SCRIPTS (Terminal Automation)
│   ├── /core              # Core data generation (rigger, character gen)
│   └── /tools             # Auxiliary/Helper tools (builders, verifiers)
│
├── /public                # Static Assets
│   ├── /assets            # Unified Asset Pipeline (expressions, items, backgrounds, etc.)
│   └── /animations        # (Deprecated - transitioning to Action Factory)
│
└── /docs                  # Planning artifacts, architecture, and logs
```

## 2. AI DISCIPLINE RULES

### Rule A: "The Root is Lava"

Do NOT create files in the project root. If you are creating a script, it goes to `/scripts`. If it's a library, `/src/lib`.

### Rule B: "Open-Closed Configs"

Files in `/src/config` are sensitive.

- You may **APPEND** new configuration keys.
- You are **FORBIDDEN** from modifying or deleting existing keys unless explicitly commanded by the User.

### Rule C: "Frozen Blocks"

Respect the `// 🔒 FROZEN BLOCK` markers in code. These contain the user-validated algorithms. Do not attempt to optimize or rewrite them.

### Rule D: "The Great Migration Protocol"

If you find a file that is misplaced (not following the structure above), your first priority is to **MOVE** it and **FIX** all broken import paths immediately.

### Rule E: "AI-First API Design (Function Calling Centric)"

The ultimate "end-user" of this system's runtime is NOT a human, but **Gemini via Function Calling**.
Therefore, all components, props, and schemas must be designed for an LLM to understand and use easily:

- **Semantic Naming:** Use clear, descriptive names for IDs (`talk_sad`, `run_cycle`) instead of arbitrary names (`action_01`).
- **Strict Enums:** Use strict string literals/enums (e.g., `facingDirection: 'left' | 'right'`) rather than expecting the AI to guess arbitrary values like CSS transforms.
- **Abstract Complexity:** Hide pixel-perfect coordinates or complex math from the AI's API. Provide high-level relative positioning (e.g., `position: 'left'`) that the internal React/Remotion engine converts to absolute values.
- **Safe Fallbacks:** Ensure robust error handling and fallbacks if the AI hallucinates an ID.

---

_Last updated: March 2026_
