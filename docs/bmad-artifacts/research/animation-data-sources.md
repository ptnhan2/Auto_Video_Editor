# Research Report: 2D Skeletal Animation JSON Datasets

## Objective

Identify and document open-source sources for 2D pose data or animation keyframes in JSON/CSV format that can be mapped to our 10-part coordinate system.

## Findings

### Common 2D Skeletal Animation Standards

1.  **Spine 2D:** Industry standard for 2D skeletal animation in games. Exports robust JSON format detailing bones, slots, attachments, and complex keyframe data.
2.  **DragonBones:** An open-source alternative to Spine, often used in web/mobile games. Uses a similar JSON structure for skeletal data and animations.
3.  **Lottie:** primarily vector-based (After Effects), but can contain complex transform data over time. Not strictly "skeletal" in the traditional gaming sense (unless rigged in AE using plugins like DUIK), but very standard for UI/web.

### Datasets and Repositories

**1. EsotericSoftware/spine-runtimes (Spineboy Example)**

- **Source URL:** `https://github.com/EsotericSoftware/spine-runtimes/blob/4.1/examples/spineboy/export/spineboy-ess.json`
- **Data Format:** Spine 2D JSON format.
  - Contains a `bones` array detailing the hierarchy and initial relative positions/lengths/rotations.
  - Contains an `animations` object containing specific cycles (e.g., `walk`, `run`, `jump`).
  - Within an animation, data is organized by `bones`, then by specific transforms (e.g., `rotate`, `translate`), providing keyframes with `time` and `value`/`angle`.
- **Mapping Complexity:** Moderate.
  - _Pros:_ High-quality, industry-standard data. Very smooth curves.
  - _Cons:_ Spine's JSON is complex. The bone hierarchy is more complex than our 10-part system (includes things like "front-fist", "front-bracer", etc.).
  - _Action:_ We would need to extract the absolute rotation/translation data over time for the bones that correspond most closely to our 10 parts (e.g., map Spine's "front-thigh" to our `legL`, "front-shin" to lower leg, etc.) and discard the rest. The keyframes often use Bezier curves, so we might need to sample the data at fixed intervals to simplify mapping to our system.

**2. DragonBones Examples**

- **Source URL:** (Various GitHub repos contain exported DragonBones JSON, though a definitive central repo is harder to pin down than Spine. Searching for DragonBones JSON examples yields results).
- **Data Format:** DragonBones JSON. Similar conceptually to Spine. Contains `armature` data (bones) and `animation` data (timelines for bone transforms).
- **Mapping Complexity:** Moderate. Similar challenges to Spine. The bone naming conventions differ, and the hierarchy must be simplified to match our 10 parts.

## Conclusion and Next Steps

Finding "ready-to-use", perfectly normalized keyframes exactly matching a simple 10-part rig is difficult, as most high-quality open-source animations are built for specific, more complex rigs (like Spineboy).

**Recommendation:**
The most viable path is to write a script that parses a standard Spine JSON export (like `spineboy-ess.json`), maps the relevant complex bones down to our simpler 10 parts (e.g., calculating absolute angles), and samples the animation at a fixed frame rate (e.g., 30fps) to generate a flat array of frames matching our `walk_cycle.json` format. This avoids manual frame-by-frame editing while leveraging professional animation data.
