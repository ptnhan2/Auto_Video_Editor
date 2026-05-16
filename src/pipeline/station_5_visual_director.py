import os
import re
import sys
import json
import math
import importlib
from typing import List

from dotenv import load_dotenv
from sqlalchemy.orm import joinedload

# Ensure the parent directory is in the path
sys.path.append(os.getcwd())

_logger = importlib.import_module('src.shared.logger')
setup_logger = _logger.setup_logger
log_ai_interaction = _logger.log_ai_interaction
log_tool_execution = _logger.log_tool_execution
log_logic_transition = _logger.log_logic_transition
log_db_operation = _logger.log_db_operation
log_environment_info = _logger.log_environment_info

_db = importlib.import_module('src.db.database')
SessionLocal = _db.SessionLocal

_schema = importlib.import_module('src.db.schema')
Storyboard = _schema.Storyboard

_config = importlib.import_module('src.config')
get_model_for_station = _config.get_model_for_station

_llm = importlib.import_module('src.shared.api_clients.llm_client')
generate_content = _llm.generate_content
embed_texts = _llm.embed_texts

load_dotenv(".env.local")

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

logger = setup_logger("station_5_visual_director")

# Global Registry State
available_actions = []
available_expressions = []
available_backgrounds = []
# Layer 2 Continuity Tracking
last_known_positions = {}

def cosine_similarity(a: List[float], b: List[float]) -> float:
    dot_product = sum(x * y for x, y in zip(a, b))
    magnitude_a = math.sqrt(sum(x * x for x in a))
    magnitude_b = math.sqrt(sum(x * x for x in b))
    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0
    return dot_product / (magnitude_a * magnitude_b)

def search_animation_registry(query: str) -> list:
    """Tìm kiếm Action, Expression và Background trong kho."""
    log_logic_transition(logger, "TOOL_START", "search_animation_registry", {"query": query})
    
    all_items = (
        [{"type": "Action", **a} for a in available_actions] + 
        [{"type": "Expression", **e} for e in available_expressions] +
        [{"type": "Background", **b} for b in available_backgrounds]
    )
    if not all_items:
        return []
    
    docs = [f"{item.get('id')} {item.get('description')}" for item in all_items]
    q_emb = embed_texts([query])
    if not q_emb:
        return all_items[:5]
    
    doc_embs = embed_texts(docs)
    scored = []
    for i, item in enumerate(all_items):
        if i < len(doc_embs):
            score = cosine_similarity(q_emb[0], doc_embs[i])
            scored.append((score, item))
            
    scored.sort(key=lambda x: x[0], reverse=True)
    res = [item for _, item in scored[:6]]
    log_tool_execution(logger, "search_animation_registry", {"query": query}, res)
    return res

def update_storyboard_visuals(
    storyboard_id: str,
    layout_style: str,
    camera_concept: str,
    asset_dynamics: str,
    visual_metaphor: str,
    transition_in: str,
    atmosphere_fx: str,
    action_id: str,
    expression_tag: str,
    background_id: str,
    characters_state: str # JSON string containing list of {character_id, position, movement, action_id, expression_tag}
) -> dict:
    params = locals()
    log_logic_transition(logger, "TOOL_START", "update_storyboard_visuals", params)
    db = SessionLocal()
    try:
        log_db_operation(logger, "query", "Storyboard", {"id": storyboard_id})
        shot = db.query(Storyboard).filter(Storyboard.id == storyboard_id).first()
        if not shot:
            res = {"error": "Storyboard not found"}
            log_tool_execution(logger, "update_storyboard_visuals", params, res)
            return res
        
        update_data = {
            "layout_style": layout_style,
            "camera_concept": camera_concept,
            "asset_dynamics": asset_dynamics,
            "visual_metaphor": visual_metaphor,
            "transition_in": transition_in,
            "atmosphere_fx": atmosphere_fx,
            "action_id": action_id,
            "expression_tag": expression_tag,
            "background_id": background_id,
            "character_position": characters_state
        }
        
        log_db_operation(logger, "update", "Storyboard", {"id": storyboard_id}, update_data)
        shot.layout_style = layout_style
        shot.camera_concept = camera_concept
        shot.asset_dynamics = asset_dynamics
        shot.visual_metaphor = visual_metaphor
        shot.transition_in = transition_in
        shot.atmosphere_fx = atmosphere_fx
        shot.action_id = action_id
        shot.expression_tag = expression_tag
        shot.background_id = background_id
        shot.character_position = characters_state
        
        # Update Continuity Tracking
        if characters_state and characters_state.strip():
            try:
                states = json.loads(characters_state)
                if isinstance(states, list):
                    for char in states:
                        last_known_positions[char['character_id']] = char['position']
            except Exception as e:
                logger.warning(f"⚠️ Failed to update raccord tracking: {e}")

        db.commit()
        res = {"status": "success", "message": f"Updated shot {storyboard_id} successfully."}
        log_tool_execution(logger, "update_storyboard_visuals", params, res)
        return res
    except Exception as e:
        db.rollback()
        res = {"status": "error", "message": str(e)}
        log_tool_execution(logger, "update_storyboard_visuals", params, res)
        return res
    finally:
        db.close()

def report_missing_asset(storyboard_id: str, asset_type: str, description: str, suggested_id: str) -> dict:
    log_logic_transition(logger, "TOOL_START", "report_missing_asset", {"type": asset_type, "id": suggested_id})
    return {"status": "reported"}

SYSTEM_PROMPT = """Bạn là Senior Motion Graphics Editor chuyên trách hệ thống Remotion (Phong cách Paper Cutout).
Nhiệm vụ của bạn là xử lý MỘT LƯỢT (single-pass) một batch các shot, xuất ra 1 JSON duy nhất chứa toàn bộ quyết định visual.

QUY TRÌNH XỬ LÝ BATCH (1 BƯỚC DUY NHẤT):
Bạn nhận được danh sách các shot (đã có gợi ý asset pre-fetch). Với MỖI shot, thực hiện:
1. [Phân tích] Xét action + nhân vật + continuity từ shot trước → chốt mood.
2. [Thiết kế] Chọn `layout_style` + `camera_concept` + `asset_dynamics` phù hợp.
3. [Dàn cảnh] Đặt nhân vật vào 9-grid + chọn `visual_metaphor`, `transition_in`, `atmosphere_fx`.
4. [Chọn Asset] Chọn action_id, expression_tag, background_id từ danh sách gợi ý. Nếu không có asset phù hợp, điền "MISSING: <mô tả>".
QUAN TRỌNG: Suy luận THEO THỨ TỰ shot, dùng state_tracker để theo dõi quỹ đạo nhân vật (raccord).

CÁC TRỤC SÁNG TẠO:
- Layout: diorama, scrapbook, split_screen, frame_in_frame, isometric, top_down, matchbox, continuous_scroll.
- Camera Concept: endless_pan, micro_macro_zoom, whip_pan, camera_shake, crash_zoom, dutch_roll, dolly_zoom_2d.
- Asset Dynamics: stop_motion_stutter, spring_overshoot, wobble_jitter, float_drift, paper_fold, hinge_rigging, smear_2d.
- Visual Metaphor: red_string, highlight_redact, kinetic_typography, magnifying_glass, blueprint_overlay, polaroid_frame.
- Transition: paper_tear, ink_bleed, object_wipe, graphic_match_cut, page_flip, burn_reveal.
- Atmosphere: drop_shadows, halftone_filter, paper_texture, light_leaks, chromatic_aberration, film_grain.

QUY TẮC QUẢN LÝ NHÂN VẬT:
- Vị trí lưới (Lower Half Grid): `front_left`, `front_center`, `front_right`, `mid_left`, `mid_center`, `mid_right`, `back_left`, `back_center`, `back_right`.
- Luôn duy trì rắc-co (Continuity): dùng state_tracker để ghi nhận vị trí mới của từng nhân vật sau mỗi shot.
"""

def run_station_5_visual_director(episode_id: str, registry_path: str):
    global last_known_positions
    last_known_positions = {} # Reset for new episode session
    global available_actions, available_expressions, available_backgrounds
    
    log_logic_transition(logger, "AGENT_INIT", f"Parallel Visual Director (Graphic Paradigm) for Episode: {episode_id}")
    log_environment_info(logger)
    
    if not os.path.exists(registry_path):
        logger.error(f"❌ Registry not found: {registry_path}")
        return False
        
    with open(registry_path, "r", encoding="utf-8") as f:
        registry = json.load(f)
    available_actions = registry.get("actions", [])
    available_expressions = registry.get("expressions", [])
    available_backgrounds = registry.get("backgrounds", [])
    logger.info(f"📚 Loaded registry: {len(available_actions)} actions, {len(available_expressions)} expressions.")

    db = SessionLocal()
    log_db_operation(logger, "query", "Storyboard", {"episode_id": episode_id})
    # Use joinedload to prevent DetachedInstanceError when accessing sb.characters
    storyboards = db.query(Storyboard).options(joinedload(Storyboard.characters)).filter(Storyboard.episode_id == episode_id).order_by(Storyboard.storyboard_number).all()

    if not storyboards:
        db.close()
        logger.warning(f"⚠️ No storyboards found for episode {episode_id}.")
        return False

    model_name = get_model_for_station("station_5_visual")
    BATCH_SIZE = 10
    ASSET_TYPE_MAP = {"action_id": "Action", "expression_tag": "Expression", "background_id": "Background"}

    def _prefetch_assets_for_batch(batch_shots):
        """Pre-fetch top-5 asset suggestions for each shot via embedding search.

        Runs search_animation_registry() for actions, expressions, and backgrounds
        so the LLM prompt can include concrete asset IDs without tool calling.
        """
        results = {}
        for sb in batch_shots:
            actions = search_animation_registry(f"{sb.action} action")
            expressions = search_animation_registry(f"{sb.action} expression")
            backgrounds = search_animation_registry(f"{sb.action} background")
            results[sb.id] = {
                "actions": actions[:5],
                "expressions": expressions[:5],
                "backgrounds": backgrounds[:5],
            }
        return results

    def _build_compact_history(previous_shots) -> str:
        """Build a compact history string from previous shots for raccord continuity.

        Extracts layout, camera concept, and character positions from DB state
        of all shots before the current batch.
        """
        if not previous_shots:
            return "None"
        history_lines = []
        for s in previous_shots:
            pos = "None"
            if s.character_position:
                try:
                    data = json.loads(s.character_position)
                    pos = ", ".join(
                        [
                            f"{c.get('character_id', '')[:5]}: {c.get('position', '')}"
                            for c in data
                        ]
                    )
                except Exception:
                    pass
            history_lines.append(
                f"Shot {s.storyboard_number}: Layout={s.layout_style}, "
                f"Cam={s.camera_concept}, Pos=[{pos}]"
            )
        return "\n".join(history_lines)

    def _build_zero_tool_prompt(batch_shots, compact_history, prefetch_data):
        """Build a single text prompt that asks the LLM to produce all visual
        decisions for the entire batch at once (layout, staging, asset selection).

        Includes pre-fetched asset suggestions so the LLM can pick IDs directly
        without any tool calling loop.
        """
        parts = [
            "Bạn là Đạo diễn Hình ảnh. Bạn có cái nhìn toàn cảnh về các shot tiếp theo."
        ]
        parts.append(f"--- LỊCH SỬ TỪ BATCH TRƯỚC ---\n{compact_history}\n")

        for sb in batch_shots:
            char_names = ", ".join([c.name for c in sb.characters])
            pf = prefetch_data.get(sb.id, {})
            actions_str = ", ".join([a.get("id", "") for a in pf.get("actions", [])])
            expr_str = ", ".join([e.get("id", "") for e in pf.get("expressions", [])])
            bg_str = ", ".join([b.get("id", "") for b in pf.get("backgrounds", [])])

            parts.append(f"=== SHOT {sb.storyboard_number} (ID: {sb.id}) ===")
            parts.append(f"Action: {sb.action}")
            parts.append(f"Characters: {char_names}")
            parts.append("Gợi ý Asset (Đã pre-fetch):")
            parts.append(f" - Actions: [{actions_str}]")
            parts.append(f" - Expressions: [{expr_str}]")
            parts.append(f" - Backgrounds: [{bg_str}]\n")

        parts.append(
            """YÊU CẦU:
Thực hiện tư duy cho CẢ BATCH và xuất 1 JSON duy nhất. Bắt buộc có 2 phần:
1. "reasoning_and_tracking": Mảng suy luận cho từng shot, ĐẶC BIỆT chú ý State Tracking (quỹ đạo di chuyển nhân vật từ shot này sang shot khác).
2. "final_updates": Mảng quyết định cuối cùng cho TỪNG shot. CHỌN Asset ID từ danh sách gợi ý. Nếu không có, điền "MISSING: <mô tả>".

Định dạng JSON:
{
  "reasoning_and_tracking": [
    {
      "shot": 1,
      "logic": "<lý do chọn layout/camera và asset>",
      "state_tracker": {"<char>": "<position_mới>"}
    }
  ],
  "final_updates": [
    {
      "shot_number": 1,
      "storyboard_id": "<id>",
      "layout_style": "<enum>",
      "camera_concept": "<enum>",
      "asset_dynamics": "<enum>",
      "visual_metaphor": "<enum>",
      "transition_in": "<enum>",
      "atmosphere_fx": "<enum>",
      "action_id": "<asset_id_hoặc_MISSING>",
      "expression_tag": "<asset_id_hoặc_MISSING>",
      "background_id": "<asset_id_hoặc_MISSING>",
      "character_positions": [{"character_id": "<id>", "position": "<9-grid>"}]
    }
  ]
}"""
        )
        return "\n".join(parts)

    def _parse_zero_tool_response(text: str) -> list:
        """Extract the 'final_updates' array from the LLM batch JSON response.

        Handles JSON wrapped in markdown code fences or embedded in prose.
        Uses brace-finding (first '{' to last '}') for nested JSON robustness.
        Returns empty list on any parse failure.
        """
        if not text:
            return []
        # Strip markdown code fences before brace extraction
        stripped = re.sub(r"```(?:json)?\s*", "", text)
        stripped = re.sub(r"\s*```", "", stripped)
        try:
            start = stripped.find("{")
            end = stripped.rfind("}")
            if start == -1 or end == -1:
                logger.warning("No JSON object found in batch response")
                return []
            json_str = stripped[start : end + 1]
            data = json.loads(json_str)
            return data.get("final_updates", [])
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            logger.error(f"Failed to parse batch JSON: {e}")
            return []

    def _apply_shot_updates(sb, shot_update) -> bool:
        """Apply parsed visual decisions to a single storyboard shot.

        Handles MISSING asset reporting with correct asset type casing
        and deterministic DB update via update_storyboard_visuals().
        Returns True on success, False if shot skipped or DB update failed.
        """
        if not shot_update:
            logger.warning(
                f"No update data generated for shot {sb.storyboard_number}"
            )
            return False

        for key in ["action_id", "expression_tag", "background_id"]:
            val = shot_update.get(key, "")
            if val and val.startswith("MISSING:"):
                desc = val.replace("MISSING:", "").strip()
                report_missing_asset(sb.id, ASSET_TYPE_MAP[key], desc, f"auto_{key}_{sb.id}")
                shot_update[key] = ""

        atmosphere_fx = shot_update.get("atmosphere_fx") or ""
        if isinstance(atmosphere_fx, list):
            atmosphere_fx = ", ".join(str(x) for x in atmosphere_fx if x is not None)

        result = update_storyboard_visuals(
            storyboard_id=sb.id,
            layout_style=shot_update.get("layout_style", ""),
            camera_concept=shot_update.get("camera_concept", ""),
            asset_dynamics=shot_update.get("asset_dynamics", ""),
            visual_metaphor=shot_update.get("visual_metaphor", ""),
            transition_in=shot_update.get("transition_in", ""),
            atmosphere_fx=atmosphere_fx,
            action_id=shot_update.get("action_id", ""),
            expression_tag=shot_update.get("expression_tag", ""),
            background_id=shot_update.get("background_id", ""),
            characters_state=json.dumps(shot_update.get("character_positions", [])),
        )
        if result.get("status") == "error":
            logger.warning(
                f"Shot {sb.storyboard_number}: DB update failed - "
                f"{result.get('message', 'unknown')}"
            )
            return False

        log_logic_transition(logger, "SHOT_COMPLETE", f"Finished Shot {sb.storyboard_number}")
        return True

    total_shots = len(storyboards)
    logger.info(
        f"🚀 ZERO-TOOL Batch processing {total_shots} shots (size={BATCH_SIZE})"
    )

    for batch_idx in range(0, total_shots, BATCH_SIZE):
        batch_shots = storyboards[batch_idx : batch_idx + BATCH_SIZE]
        batch_num = (batch_idx // BATCH_SIZE) + 1
        logger.info(f"📦 Batch {batch_num}: Processing {len(batch_shots)} shots")

        prev_sbs = [
            s
            for s in storyboards
            if s.storyboard_number < batch_shots[0].storyboard_number
        ]
        compact_history = _build_compact_history(prev_sbs)

        prefetch_data = _prefetch_assets_for_batch(batch_shots)

        prompt = _build_zero_tool_prompt(batch_shots, compact_history, prefetch_data)
        import time
        from src.shared.schema_validator import (
            S5_SHOT_SCHEMA,
            S5_JSON_SCHEMA,
            validate_batch_updates,
            build_validation_feedback,
        )

        log_logic_transition(logger, "ZERO_TOOL_CALL", f"Batch {batch_num}")

        MAX_RETRIES = 2
        updates = []
        original_prompt = prompt  # save for retry with feedback

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                res = generate_content(
                    model_name,
                    system_prompt=SYSTEM_PROMPT,
                    contents=prompt,
                    response_format=S5_JSON_SCHEMA,
                    enable_json_schema_validation=True,
                )
            except Exception as e:
                logger.error(
                    f"Batch {batch_num} LLM call failed "
                    f"(attempt {attempt}/{MAX_RETRIES}): {e}"
                )
                if attempt < MAX_RETRIES:
                    time.sleep(2)
                continue

            text = ""
            if res and res.choices:
                text = res.choices[0].message.content or ""
            log_ai_interaction(logger, SYSTEM_PROMPT, prompt, res)

            updates = _parse_zero_tool_response(text)
            if not updates:
                logger.warning(
                    f"Batch {batch_num}: JSON parse produced no updates "
                    f"(attempt {attempt}/{MAX_RETRIES})"
                )
                if attempt < MAX_RETRIES:
                    time.sleep(2)
                continue

            # Layer 2+3: Client-side validation + smart feedback
            is_valid, validation_errors = validate_batch_updates(
                updates, S5_SHOT_SCHEMA, len(batch_shots)
            )
            if is_valid:
                logger.info(
                    f"Batch {batch_num}: Validation PASS (attempt {attempt})"
                )
                break

            logger.warning(
                f"Batch {batch_num}: Validation FAIL "
                f"(attempt {attempt}/{MAX_RETRIES})"
            )
            for shot_idx, errs in validation_errors.items():
                logger.warning(f"  {shot_idx}: {errs}")

            if attempt < MAX_RETRIES:
                feedback = build_validation_feedback(validation_errors)
                prompt = original_prompt + "\n\n[SỬA LỖI] " + feedback
                time.sleep(2)

        for sb in batch_shots:
            shot_update = next(
                (
                    u
                    for u in updates
                    if u.get("storyboard_id") == sb.id
                    or u.get("shot_number") == sb.storyboard_number
                ),
                None,
            )
            _apply_shot_updates(sb, shot_update)

    db.close()
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)
    run_station_5_visual_director(sys.argv[1], "public/asset_registry.json")
