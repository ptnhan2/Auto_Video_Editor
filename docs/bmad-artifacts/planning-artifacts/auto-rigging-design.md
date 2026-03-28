# Auto-Rigging Pipeline Design (SAM + SVG)

## Overview
The pipeline transforms a 2D character image into a rigged SVG character ready for animation in Remotion.

## Workflow Steps

1.  **Image Upload & Preprocessing**
    *   User uploads a PNG/JPG of a character.
    *   Backend stores the original image in Supabase Storage.

2.  **Segmentation (SAM - Segment Anything Model)**
    *   Service: `Modal.com` (Python/GPU).
    *   Input: Image URL/Buffer.
    *   Output: Multiple binary masks (PNG) for body parts (`head`, `torso`, `left_arm`, `right_arm`, `left_leg`, `right_leg`).
    *   Logic: Uses predefined prompts or automatic mask generation tailored for humanoid characters.

3.  **Vectorization (Image to SVG)**
    *   Service: `src/features/library/services/vectorizer.ts`.
    *   Tool: `vtracer` or `potrace`.
    *   Input: Segmented PNG masks.
    *   Output: Individual SVG paths for each part.
    *   Post-processing: Combine paths into a single SVG file with named IDs matching the parts.

4.  **Auto-Rigging (Skeleton Generation)**
    *   Service: `src/features/library/services/rigger.ts`.
    *   Logic:
        *   Analyze SVG bounds for each part.
        *   Determine `Pivot Points` based on part connectivity (e.g., shoulder connects arm to torso).
        *   Generate a `Skeleton JSON` structure.
    *   Skeleton Data Format:
        ```json
        {
          "parts": {
            "head": { "id": "head", "pivot": { "x": 0.5, "y": 0.9 }, "parentId": "torso" },
            "torso": { "id": "torso", "pivot": { "x": 0.5, "y": 0.5 }, "parentId": null },
            ...
          }
        }
        ```

5.  **Character Metadata & Storage**
    *   Store SVG content and Skeleton JSON in Supabase `characters` table.

## Technical Stack
*   **Modal.com**: GPU-accelerated SAM inference.
*   **Potrace/vtracer**: Vectorization.
*   **Zustand**: Managing character state in the Editor.
*   **Remotion**: Rendering the rigged SVG using the Skeleton data.
