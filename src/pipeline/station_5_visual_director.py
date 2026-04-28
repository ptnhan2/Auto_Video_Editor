import os
import sys
# Ensure the parent directory is in the path
sys.path.append(os.getcwd())

import json
import math
from src.shared.logger import setup_logger, log_ai_interaction, log_tool_execution, log_logic_transition, log_db_operation, log_environment_info
from typing import List, Dict, Any
from google import genai
from google.genai import types
from dotenv import load_dotenv
from sqlalchemy.orm import joinedload

from src.db.database import SessionLocal
from src.db.schema import Storyboard, Episode, Character
from src.config import get_model_for_station

load_dotenv(".env.local")

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

logger = setup_logger("station_5_visual_director")

api_key = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY")
client = genai.Client(api_key=api_key)

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
    if magnitude_a == 0 or magnitude_b == 0: return 0.0
    return dot_product / (magnitude_a * magnitude_b)

def embed_texts(texts: List[str]) -> List[List[float]]:
    try:
        result = client.models.embed_content(model='gemini-embedding-2-preview', contents=texts)
        return [e.values for e in result.embeddings] if hasattr(result, "embeddings") else []
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        return []

def search_animation_registry(query: str) -> list:
    """Tìm kiếm Action, Expression và Background trong kho."""
    log_logic_transition(logger, "TOOL_START", "search_animation_registry", {"query": query})
    
    all_items = (
        [{"type": "Action", **a} for a in available_actions] + 
        [{"type": "Expression", **e} for e in available_expressions] +
        [{"type": "Background", **b} for b in available_backgrounds]
    )
    if not all_items: return []
    
    docs = [f"{item.get('id')} {item.get('description')}" for item in all_items]
    q_emb = embed_texts([query])
    if not q_emb: return all_items[:5]
    
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
Nhiệm vụ của bạn là thực hiện quy trình thiết kế theo DÂY CHUYỀN LẮP RÁP (Sequential Pipeline) để biến các mảnh giấy 2D thành tác phẩm kể chuyện cuốn hút.

QUY TRÌNH 3 GIAI ĐOẠN CHO MỖI SHOT:
GIAI ĐOẠN 1: THIẾT KẾ KHUNG HÌNH (Cinematic Base)
- Chốt `layout_style` và `camera_concept`.
GIAI ĐOẠN 2: DÀN CẢNH NHÂN VẬT (Character Staging)
- Xếp nhân vật vào 9 ô lưới (`characters_state`) và gán `asset_dynamics` dựa trên Layout ở GĐ1.
GIAI ĐOẠN 3: HOÀN THIỆN & KHỚP ASSET (Polish & Assets)
- Thêm `visual_metaphor`, `transition_in`, `atmosphere_fx`.
- Tìm ID asset phù hợp và gọi tool `update_storyboard_visuals`.

CÁC TRỤC SÁNG TẠO:
- Layout: diorama, scrapbook, split_screen, frame_in_frame, isometric, top_down, matchbox, continuous_scroll.
- Camera Concept: endless_pan, micro_macro_zoom, whip_pan, camera_shake, crash_zoom, dutch_roll, dolly_zoom_2d.
- Asset Dynamics: stop_motion_stutter, spring_overshoot, wobble_jitter, float_drift, paper_fold, hinge_rigging, smear_2d.
- Visual Metaphor: red_string, highlight_redact, kinetic_typography, magnifying_glass, blueprint_overlay, polaroid_frame.
- Transition: paper_tear, ink_bleed, object_wipe, graphic_match_cut, page_flip, burn_reveal.
- Atmosphere: drop_shadows, halftone_filter, paper_texture, light_leaks, chromatic_aberration, film_grain.

QUY TẮC QUẢN LÝ NHÂN VẬT:
- Vị trí lưới (Lower Half Grid): `front_left`, `front_center`, `front_right`, `mid_left`, `mid_center`, `mid_right`, `back_left`, `back_center`, `back_right`.
- Luôn duy trì rắc-co (Continuity) dựa trên dữ liệu "Last known positions".
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
    
    # Stateless Processing Loop
    for sb in storyboards:
        # 1. Thu thập "Lịch sử tiến trình" rút gọn từ Database (Để giữ rắc-co)
        # Lấy tất cả các shot trước đó trong cùng episode
        prev_sbs = [s for s in storyboards if s.storyboard_number < sb.storyboard_number]
        history_lines = []
        for s in prev_sbs:
            # Rút gọn vị trí nhân vật từ JSON string
            pos_summary = "None"
            if s.character_position:
                try:
                    data = json.loads(s.character_position)
                    pos_summary = ", ".join([f"{c['character_id'][:5]}: {c['position']}" for c in data])
                except: pass
            history_lines.append(f"Shot {s.storyboard_number}: [Layout: {s.layout_style}] [Cam: {s.camera_concept}] [FX: {s.visual_metaphor}] [Pos: {pos_summary}]")
        
        compact_history = "\n".join(history_lines) # Gửi toàn bộ lịch sử rút gọn của tập phim để rắc-co tuyệt đối
        
        # 2. Lấy danh sách nhân vật hiện tại
        char_names = ", ".join([c.name for c in sb.characters])
        char_ids = ", ".join([c.id for c in sb.characters])
        
        log_logic_transition(logger, "SHOT_START", f"Processing Shot {sb.storyboard_number} (ID: {sb.id})", {
            "action": sb.action[:50] + "...",
            "characters": char_names
        })

        # GIAI ĐOẠN 1: THIẾT KẾ KHUNG HÌNH (Stateless)
        log_logic_transition(logger, "PHASE_1_LAYOUT", f"Determining cinematic base (Stateless)")
        p1 = f"--- LỊCH SỬ TIẾN TRÌNH ---\n{compact_history}\n\n"
        p1 += f"--- SHOT HIỆN TẠI {sb.storyboard_number} ---\n"
        p1 += f"Nội dung: {sb.action}\nNhân vật: {char_names}\n"
        p1 += "GIAI ĐOẠN 1: Hãy chọn `layout_style` và `camera_concept` phù hợp nhất."
        
        res1 = client.models.generate_content(
            model=model_name,
            config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
            contents=p1
        )
        log_ai_interaction(logger, SYSTEM_PROMPT, p1, res1)
        stage_1_decision = res1.text

        # GIAI ĐOẠN 2: DÀN CẢNH NHÂN VẬT (Stateless)
        log_logic_transition(logger, "PHASE_2_STAGING", f"Positioning characters (Stateless)")
        p2 = f"--- LỊCH SỬ TIẾN TRÌNH ---\n{compact_history}\n\n"
        p2 += f"--- QUYẾT ĐỊNH GĐ1 ---\n{stage_1_decision}\n\n"
        p2 += f"GIAI ĐOẠN 2: Hãy xếp vị trí 9-grid cho các nhân vật ({char_names}) và chọn `asset_dynamics` cho họ."
        
        res2 = client.models.generate_content(
            model=model_name,
            config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
            contents=p2
        )
        log_ai_interaction(logger, SYSTEM_PROMPT, p2, res2)
        stage_2_decision = res2.text

        # GIAI ĐOẠN 3: HOÀN THIỆN & KHỚP ASSET (Stateless)
        log_logic_transition(logger, "PHASE_3_POLISH", f"Matching assets and saving (Stateless)")
        p3 = f"--- LỊCH SỬ TIẾN TRÌNH ---\n{compact_history}\n\n"
        p3 += f"--- QUYẾT ĐỊNH GĐ1&2 ---\n{stage_1_decision}\n{stage_2_decision}\n\n"
        p3 += f"Shot ID: {sb.id}\nAction thô: {sb.action}\n"
        p3 += "GIAI ĐOẠN 3: Hãy thêm `visual_metaphor`, `atmosphere_fx`, tìm asset IDs và gọi tool `update_storyboard_visuals`."
        
        res3 = client.models.generate_content(
            model=model_name,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                tools=[search_animation_registry, update_storyboard_visuals, report_missing_asset]
            ),
            contents=p3
        )
        log_ai_interaction(logger, SYSTEM_PROMPT, p3, res3)

        log_logic_transition(logger, "SHOT_COMPLETE", f"Finished Shot {sb.storyboard_number}")

    logger.info(f"\n✨ [SUMMARY]\nĐã hoàn thành thiết kế Motion Graphics cho {len(storyboards)} shots của Episode {episode_id}.\n")
    db.close()
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2: sys.exit(1)
    run_station_5_visual_director(sys.argv[1], "public/asset_registry.json")
