# ⚠️ DEPRECATION NOTICE — Remotion → OpenCut (June 2026)

This directory contains historical planning artifacts that reference Remotion as the video rendering engine.

Remotion has been removed from the tech stack. The project now uses OpenCut-AI (forked from Ekaanth/OpenCut-AI, MIT license) as the video editor engine.

For AI coding agents:
- Documents referencing remotion/, @remotion/player, @remotion/renderer, npx remotion studio, or npx remotion render describe DEPRECATED workflows.
- The current architecture is documented in AGENTS.md (Rule J) and docs/architecture/opencut_project_schema.json.
- Do NOT implement features based on Remotion architecture in these historical documents.
- Refer to Epic #197 (OpenCut Integration) for current video editor work.
