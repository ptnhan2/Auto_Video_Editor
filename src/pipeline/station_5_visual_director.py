import os
import re
import sys
import json
import math
import hashlib
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
AssetQueue = _schema.AssetQueue

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
    """TÃ¬m kiáº¿m Action, Expression vÃ  Background trong kho."""
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
    characters_state: str, # JSON string containing list of {character_id, position, movement, action_id, expression_tag}
    opencut_transition: str | None = None,  # JSON: {"type":"page-peel","duration":0.5}
    opencut_effects: str | None = None,     # JSON: [{"type":"zoom","intensity":1.5}]
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
        shot.opencut_transition = opencut_transition
        shot.opencut_effects = opencut_effects
        
        # Update Continuity Tracking
        if characters_state and characters_state.strip():
            try:
                states = json.loads(characters_state)
                if isinstance(states, list):
                    for char in states:
                        last_known_positions[char['character_id']] = char['position']
            except Exception as e:
                logger.warning(f"âš ï¸ Failed to update raccord tracking: {e}")

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
    hash_key = hashlib.md5(f"{asset_type}{description}".encode()).hexdigest()
    db = SessionLocal()
    try:
        entry = AssetQueue(
            asset_type=asset_type,
            prompt=description,
            hash_key=hash_key,
            status="PENDING",
            priority=0,
        )
        db.add(entry)
        db.commit()
        log_db_operation(logger, "insert", "AssetQueue", {"asset_type": asset_type, "hash_key": hash_key})
        return {"status": "reported", "queued": True, "hash_key": hash_key}
    except Exception as e:
        db.rollback()
        logger.warning(f"Failed to queue asset request: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

SYSTEM_PROMPT = """Báº¡n lÃ  Senior Motion Graphics Editor chuyÃªn trÃ¡ch OpenCut-AI Timeline Video Editor.
Nhiá»‡m vá»¥ cá»§a báº¡n lÃ  xá»­ lÃ½ Má»˜T LÆ¯á»¢T (single-pass) má»™t batch cÃ¡c shot, xuáº¥t ra 1 JSON duy nháº¥t chá»©a toÃ n bá»™ quyáº¿t Ä‘á»‹nh visual.

QUY TRÃŒNH Xá»¬ LÃ BATCH (1 BÆ¯á»šC DUY NHáº¤T):
Báº¡n nháº­n Ä‘Æ°á»£c danh sÃ¡ch cÃ¡c shot (Ä‘Ã£ cÃ³ gá»£i Ã½ asset pre-fetch). Vá»›i Má»–I shot, thá»±c hiá»‡n:
1. [PhÃ¢n tÃ­ch] XÃ©t action + nhÃ¢n váº­t + continuity tá»« shot trÆ°á»›c â†’ chá»‘t mood.
2. [Thiáº¿t káº¿] Chá»n `layout_style` + `camera_concept` + `asset_dynamics` phÃ¹ há»£p.
3. [DÃ n cáº£nh] Äáº·t nhÃ¢n váº­t vÃ o 9-grid + chá»n `visual_metaphor`, `transition_in`, `atmosphere_fx`.
4. [Chá»n Asset] Chá»n action_id, expression_tag, background_id tá»« danh sÃ¡ch gá»£i Ã½. Náº¿u khÃ´ng cÃ³ asset phÃ¹ há»£p, Ä‘iá»n "MISSING: <mÃ´ táº£>".
QUAN TRá»ŒNG: Suy luáº­n THEO THá»¨ Tá»° shot, dÃ¹ng state_tracker Ä‘á»ƒ theo dÃµi quá»¹ Ä‘áº¡o nhÃ¢n váº­t (raccord).

CÃC TRá»¤C SÃNG Táº O:
- Layout: diorama, scrapbook, split_screen, frame_in_frame, isometric, top_down, matchbox, continuous_scroll.
- Camera Concept: zoom, shake, pan, rotate, static.
- Asset Dynamics: stop_motion_stutter, spring_overshoot, wobble_jitter, float_drift, paper_fold, hinge_rigging, smear_2d.
- Visual Metaphor: red_string, highlight_redact, kinetic_typography, magnifying_glass, blueprint_overlay, polaroid_frame.
- Transition: cross-dissolve, dip-black, slide-left, slide-right, wipe-left, wipe-right, zoom, iris-wipe, clock-wipe, morph, glitch, film-burn, page-peel, spin, push, fade-white, checkerboard, dissolve-zoom, band-slide, cube-spin.
- Atmosphere: grain, chromatic, vignette, blur, glow, shadow, halftone, light-leak, paper-texture.

QUY Táº®C QUáº¢N LÃ NHÃ‚N Váº¬T:
- Vá»‹ trÃ­ lÆ°á»›i (Canvas 1920x1080, gá»‘c top-left): top_left(320,270), top_center(960,270), top_right(1600,270), mid_left(320,540), mid_center(960,540), mid_right(1600,540), bottom_left(320,810), bottom_center(960,810), bottom_right(1600,810).
- LuÃ´n duy trÃ¬ ráº¯c-co (Continuity): dÃ¹ng state_tracker Ä‘á»ƒ ghi nháº­n vá»‹ trÃ­ má»›i cá»§a tá»«ng nhÃ¢n váº­t sau má»—i shot.
"""

def run_station_5_visual_director(episode_id: str, registry_path: str):
    global last_known_positions
    last_known_positions = {} # Reset for new episode session
    global available_actions, available_expressions, available_backgrounds
    
    log_logic_transition(logger, "AGENT_INIT", f"Parallel Visual Director (Graphic Paradigm) for Episode: {episode_id}")
    log_environment_info(logger)
    
    if not os.path.exists(registry_path):
        logger.error(f"âŒ Registry not found: {registry_path}")
        return False
        
    with open(registry_path, "r", encoding="utf-8") as f:
        registry = json.load(f)
    available_actions = registry.get("actions", [])
    available_expressions = registry.get("expressions", [])
    available_backgrounds = registry.get("backgrounds", [])
    logger.info(f"ðŸ“š Loaded registry: {len(available_actions)} actions, {len(available_expressions)} expressions.")

    db = SessionLocal()
    log_db_operation(logger, "query", "Storyboard", {"episode_id": episode_id})
    # Use joinedload to prevent DetachedInstanceError when accessing sb.characters
    storyboards = db.query(Storyboard).options(joinedload(Storyboard.characters)).filter(Storyboard.episode_id == episode_id).order_by(Storyboard.storyboard_number).all()

    if not storyboards:
        db.close()
        logger.warning(f"âš ï¸ No storyboards found for episode {episode_id}.")
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
            "Báº¡n lÃ  Äáº¡o diá»…n HÃ¬nh áº£nh. Báº¡n cÃ³ cÃ¡i nhÃ¬n toÃ n cáº£nh vá» cÃ¡c shot tiáº¿p theo."
        ]
        parts.append(f"--- Lá»ŠCH Sá»¬ Tá»ª BATCH TRÆ¯á»šC ---\n{compact_history}\n")

        for sb in batch_shots:
            char_names = ", ".join([c.name for c in sb.characters])
            pf = prefetch_data.get(sb.id, {})
            actions_str = ", ".join([a.get("id", "") for a in pf.get("actions", [])])
            expr_str = ", ".join([e.get("id", "") for e in pf.get("expressions", [])])
            bg_str = ", ".join([b.get("id", "") for b in pf.get("backgrounds", [])])

            parts.append(f"=== SHOT {sb.storyboard_number} (ID: {sb.id}) ===")
            parts.append(f"Action: {sb.action}")
            parts.append(f"Characters: {char_names}")
            parts.append("Gá»£i Ã½ Asset (ÄÃ£ pre-fetch):")
            parts.append(f" - Actions: [{actions_str}]")
            parts.append(f" - Expressions: [{expr_str}]")
            parts.append(f" - Backgrounds: [{bg_str}]\n")

        parts.append(
            """YÃŠU Cáº¦U:
Thá»±c hiá»‡n tÆ° duy cho Cáº¢ BATCH vÃ  xuáº¥t 1 JSON duy nháº¥t. Báº¯t buá»™c cÃ³ 2 pháº§n:
1. "reasoning_and_tracking": Máº£ng suy luáº­n cho tá»«ng shot, Äáº¶C BIá»†T chÃº Ã½ State Tracking (quá»¹ Ä‘áº¡o di chuyá»ƒn nhÃ¢n váº­t tá»« shot nÃ y sang shot khÃ¡c).
2. "final_updates": Máº£ng quyáº¿t Ä‘á»‹nh cuá»‘i cÃ¹ng cho Tá»ªNG shot. CHá»ŒN Asset ID tá»« danh sÃ¡ch gá»£i Ã½. Náº¿u khÃ´ng cÃ³, Ä‘iá»n "MISSING: <mÃ´ táº£>".

Äá»‹nh dáº¡ng JSON:
{
  "reasoning_and_tracking": [
    {
      "shot": 1,
      "logic": "<lÃ½ do chá»n layout/camera vÃ  asset>",
      "state_tracker": {"<char>": "<position_má»›i>"}
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
      "action_id": "<asset_id_hoáº·c_MISSING>",
      "expression_tag": "<asset_id_hoáº·c_MISSING>",
      "background_id": "<asset_id_hoáº·c_MISSING>",
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

        transition_in = shot_update.get("transition_in", "")
        camera_concept = shot_update.get("camera_concept", "")

        # Build OpenCut-native JSON columns trực tiếp từ S5 decisions
        opencut_transition_json = json.dumps(
            {"type": transition_in, "duration": 0.5}
        ) if transition_in else None

        effects_list = []
        if camera_concept:
            effects_list.append({"type": camera_concept, "intensity": 1.0})
        if atmosphere_fx:
            effects_list.append({"type": atmosphere_fx, "intensity": 0.3})
        opencut_effects_json = json.dumps(effects_list) if effects_list else None

        result = update_storyboard_visuals(
            storyboard_id=sb.id,
            layout_style=shot_update.get("layout_style", ""),
            camera_concept=camera_concept,
            asset_dynamics=shot_update.get("asset_dynamics", ""),
            visual_metaphor=shot_update.get("visual_metaphor", ""),
            transition_in=transition_in,
            atmosphere_fx=atmosphere_fx,
            action_id=shot_update.get("action_id", ""),
            expression_tag=shot_update.get("expression_tag", ""),
            background_id=shot_update.get("background_id", ""),
            characters_state=json.dumps(shot_update.get("character_positions", [])),
            opencut_transition=opencut_transition_json,
            opencut_effects=opencut_effects_json,
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
        f"ðŸš€ ZERO-TOOL Batch processing {total_shots} shots (size={BATCH_SIZE})"
    )

    for batch_idx in range(0, total_shots, BATCH_SIZE):
        batch_shots = storyboards[batch_idx : batch_idx + BATCH_SIZE]
        batch_num = (batch_idx // BATCH_SIZE) + 1
        logger.info(f"ðŸ“¦ Batch {batch_num}: Processing {len(batch_shots)} shots")

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
                prompt = original_prompt + "\n\n[Sá»¬A Lá»–I] " + feedback
                time.sleep(2)
        else:
            # Executed when loop completes without break (all retries exhausted)
            logger.error(
                f"Batch {batch_num}: ALL retries exhausted â€” "
                f"applying best-effort updates with possible gaps"
            )

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

        # Refresh ORM objects so _build_compact_history sees updated visual data
        # from previous batches (update_storyboard_visuals uses a separate DB session).
        db.expire_all()

    db.close()
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)
    run_station_5_visual_director(sys.argv[1], "public/asset_registry.json")
