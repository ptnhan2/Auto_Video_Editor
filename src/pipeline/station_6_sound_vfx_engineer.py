import os
import sys
import json
import math
import importlib
from datetime import datetime
from typing import List

from dotenv import load_dotenv

# Ensure the parent directory is in the path
sys.path.append(os.getcwd())

_logger = importlib.import_module('src.shared.logger')
setup_logger = _logger.setup_logger
log_ai_interaction = _logger.log_ai_interaction
log_tool_execution = _logger.log_tool_execution
log_logic_transition = _logger.log_logic_transition
log_db_operation = _logger.log_db_operation

_db = importlib.import_module('src.db.database')
SessionLocal = _db.SessionLocal

_schema = importlib.import_module('src.db.schema')
Storyboard = _schema.Storyboard

_llm = importlib.import_module('src.shared.api_clients.llm_client')
start_chat = _llm.start_chat
embed_texts = _llm.embed_texts

load_dotenv(".env.local")

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

logger = setup_logger("station_6_sound_vfx_engineer")

# Global Registry State
available_sfx = []
available_vfx = []
available_bgm = []

def cosine_similarity(a: List[float], b: List[float]) -> float:
    dot_product = sum(x * y for x, y in zip(a, b))
    magnitude_a = math.sqrt(sum(x * x for x in a))
    magnitude_b = math.sqrt(sum(x * x for x in b))
    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0
    return dot_product / (magnitude_a * magnitude_b)

def search_audio_vfx_registry(query: str) -> list:
    """Tìm kiếm SFX, VFX và BGM trong kho."""
    log_logic_transition(logger, "TOOL_START", "search_audio_vfx_registry", {"query": query})
    
    all_items = (
        [{"type": "SFX", **item} for item in available_sfx] +
        [{"type": "VFX", **item} for item in available_vfx] +
        [{"type": "BGM", **item} for item in available_bgm]
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
    log_tool_execution(logger, "search_audio_vfx_registry", {"query": query}, res)
    return res

def update_storyboard_audio(storyboard_id: str, sfx_id: str, vfx_tags: list[str], bgm_track: str) -> dict:
    log_logic_transition(logger, "TOOL_START", "update_storyboard_audio", {"storyboard_id": storyboard_id})
    db = SessionLocal()
    try:
        shot = db.query(Storyboard).filter(Storyboard.id == storyboard_id).first()
        if not shot:
            return {"error": "Storyboard not found"}
        
        # Verify SFX ID exists if provided
        if sfx_id and not any(item.get('id') == sfx_id for item in available_sfx):
            logger.warning(f"SFX ID {sfx_id} not found in registry")
            
        # Verify VFX tags exist if provided
        for vfx in vfx_tags:
            if not any(item.get('id') == vfx for item in available_vfx):
                logger.warning(f"VFX ID {vfx} not found in registry")
                
        # Verify BGM track exists if provided
        if bgm_track and not any(item.get('id') == bgm_track for item in available_bgm):
             logger.warning(f"BGM ID {bgm_track} not found in registry")
        
        update_data = {
            "sound_effect": json.dumps({"sfx_id": sfx_id, "vfx_tags": vfx_tags}, ensure_ascii=False),
            "bgm_prompt": bgm_track
        }
        
        log_db_operation(logger, "update", "Storyboard", {"id": storyboard_id}, update_data)
        shot.sound_effect = update_data["sound_effect"]
        shot.bgm_prompt = update_data["bgm_prompt"]
        db.commit()
        return {"status": "success"}
    finally:
        db.close()

def report_missing_asset(storyboard_id: str, asset_type: str, description: str, suggested_id: str) -> dict:
    log_logic_transition(logger, "TOOL_START", "report_missing_asset", {"type": asset_type, "id": suggested_id})
    
    backlog_path = os.path.join("public", "missing_assets_backlog.jsonl")
    
    entry = {
        "storyboard_id": storyboard_id,
        "asset_type": asset_type,
        "description": description,
        "suggested_id": suggested_id,
        "reported_at": datetime.now().isoformat()
    }
    
    with open(backlog_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        
    return {"status": "reported"}

SYSTEM_PROMPT = """Bạn là Kỹ sư Âm thanh và VFX (Sound & VFX Engineer).
Nhiệm vụ của bạn là xử lý MỘT LƯỢT (single-pass) một batch các shot, xuất ra 1 JSON duy nhất chứa toàn bộ quyết định âm thanh & VFX.

QUY TRÌNH XỬ LÝ BATCH (1 BƯỚC DUY NHẤT):
Bạn nhận được danh sách các shot (đã có gợi ý asset pre-fetch). Với MỖI shot, thực hiện:
1. [Phân tích] Xét `action`, `atmosphere`, `visual_metaphor` của shot → xác định mood âm thanh.
2. [Chọn BGM] Dựa trên `atmosphere` → chọn nhạc nền phù hợp từ danh sách gợi ý BGM.
3. [Chọn SFX] Dựa trên `action` hoặc các hành động vật lý → chọn hiệu ứng âm thanh từ danh sách gợi ý SFX.
4. [Chọn VFX] Dựa trên `visual_metaphor` hoặc mô tả cảnh → chọn hiệu ứng hình ảnh từ danh sách gợi ý VFX.
5. [Fallback] Nếu không có asset phù hợp, điền "MISSING: <mô tả>" cho trường tương ứng. Với VFX là list, dùng ["MISSING: <mô tả>"].

QUAN TRỌNG: Chọn Asset ID từ danh sách gợi ý. Xử lý THEO THỨ TỰ shot để duy trì tính liên tục của mood âm thanh.
"""

def run_station_6_sound_vfx_engineer(episode_id: str, registry_path: str):
    global available_sfx, available_vfx, available_bgm
    from sqlalchemy.orm import joinedload
    
    _config = importlib.import_module('src.config')
    get_model_for_station = _config.get_model_for_station
    generate_content = _llm.generate_content

    log_logic_transition(logger, "AGENT_INIT", f"Sound/VFX Engineer (Batch) for Episode: {episode_id}")
    
    if os.path.exists(registry_path):
        with open(registry_path, "r", encoding="utf-8") as f:
            registry = json.load(f)
        available_sfx = registry.get("sfx", [])
        available_vfx = registry.get("vfx", [])
        available_bgm = registry.get("bgm", [])
    else:
        logger.error(f"❌ Registry not found: {registry_path}")
        return False

    db = SessionLocal()
    try:
        storyboards = db.query(Storyboard).options(joinedload(Storyboard.characters)).filter(
            Storyboard.episode_id == episode_id
        ).order_by(Storyboard.storyboard_number).all()

        if not storyboards:
            logger.warning(f"⚠️ No storyboards found for episode {episode_id}.")
            return False

        model_name = get_model_for_station("station_6_vfx")
        BATCH_SIZE = 10
        ASSET_TYPE_MAP = {"sfx_id": "SFX", "vfx_tags": "VFX", "bgm_track": "BGM"}

        # --- INNER HELPERS ---

        def _prefetch_audio_assets_for_batch(batch_shots):
            """Pre-fetch audio asset suggestions for each shot via embedding search.
            
            Searches SFX, VFX, and BGM registries so the LLM prompt includes concrete
            asset IDs without any tool calling loop.
            """
            results = {}
            for sb in batch_shots:
                sfx = search_audio_vfx_registry(f"{sb.action} sound effect")
                vfx = search_audio_vfx_registry(f"{sb.visual_metaphor or sb.action} visual effect")
                bgm = search_audio_vfx_registry(f"{sb.atmosphere or ''} background music")
                results[sb.id] = {
                    "sfx": [item for item in sfx if item.get("type") == "SFX"][:5],
                    "vfx": [item for item in vfx if item.get("type") == "VFX"][:5],
                    "bgm": [item for item in bgm if item.get("type") == "BGM"][:5],
                }
            return results

        def _build_compact_history(previous_shots) -> str:
            """Build compact audio history from shots already processed in earlier batches.
            
            Extracts SFX and BGM decisions to give the LLM continuity context.
            """
            if not previous_shots:
                return "None"
            history_lines = []
            for s in previous_shots:
                sfx = ""
                if s.sound_effect:
                    try:
                        data = json.loads(s.sound_effect)
                        sfx = data.get("sfx_id", "None")
                    except Exception:
                        sfx = s.sound_effect
                history_lines.append(
                    f"Shot {s.storyboard_number}: SFX={sfx}, BGM={s.bgm_prompt or 'None'}"
                )
            return "\n".join(history_lines)

        def _build_zero_tool_prompt(batch_shots, compact_history, prefetch_data):
            """Build a single text prompt requesting all audio decisions for the entire batch.
            
            Includes pre-fetched asset suggestions so the LLM picks IDs directly.
            """
            parts = [
                "Bạn là Kỹ sư Âm thanh & VFX. Bạn có cái nhìn toàn cảnh về các shot tiếp theo."
            ]
            parts.append(f"--- LỊCH SỬ TỪ BATCH TRƯỚC ---\n{compact_history}\n")

            for sb in batch_shots:
                char_names = ", ".join([c.name for c in sb.characters]) if sb.characters else "None"
                pf = prefetch_data.get(sb.id, {})
                sfx_str = ", ".join([a.get("id", "") for a in pf.get("sfx", [])])
                vfx_str = ", ".join([a.get("id", "") for a in pf.get("vfx", [])])
                bgm_str = ", ".join([a.get("id", "") for a in pf.get("bgm", [])])

                parts.append(f"=== SHOT {sb.storyboard_number} (ID: {sb.id}) ===")
                parts.append(f"Action: {sb.action}")
                parts.append(f"Dialogue: {sb.dialogue or 'None'}")
                parts.append(f"Atmosphere: {sb.atmosphere or 'None'}")
                parts.append(f"Visual Metaphor: {sb.visual_metaphor or 'None'}")
                parts.append(f"Characters: {char_names}")
                parts.append("Gợi ý Asset (Đã pre-fetch):")
                parts.append(f" - SFX: [{sfx_str}]")
                parts.append(f" - VFX: [{vfx_str}]")
                parts.append(f" - BGM: [{bgm_str}]\n")

            parts.append(
                """YÊU CẦU:
Thực hiện tư duy cho CẢ BATCH và xuất 1 JSON duy nhất. Bắt buộc có 2 phần:
1. "reasoning_and_tracking": Mảng suy luận cho từng shot, ghi rõ lý do chọn mỗi asset.
2. "final_updates": Mảng quyết định cuối cùng cho TỪNG shot. CHỌN Asset ID từ danh sách gợi ý. Nếu không có, điền "MISSING: <mô tả>".

Định dạng JSON:
{
  "reasoning_and_tracking": [
    {
      "shot": 1,
      "logic": "<lý do chọn SFX/VFX/BGM>",
      "audio_mood": "<mood âm thanh tổng thể>"
    }
  ],
  "final_updates": [
    {
      "shot_number": 1,
      "storyboard_id": "<id>",
      "sfx_id": "<asset_id_hoặc_MISSING:_mô_tả>",
      "vfx_tags": ["<asset_id>", "<asset_id>"],
      "bgm_track": "<asset_id_hoặc_MISSING:_mô_tả>"
    }
  ]
}"""
            )
            return "\n".join(parts)

        def _parse_zero_tool_response(text: str) -> list:
            """Extract the 'final_updates' array from the LLM batch JSON response.
            
            Strips markdown code fences, finds JSON object via brace extraction,
            and returns the final_updates list. Returns empty list on failure.
            """
            if not text:
                return []
            import re
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

        def _apply_shot_audio_updates(sb, shot_update) -> bool:
            """Apply parsed audio decisions to a single storyboard shot.
            
            Handles MISSING asset reporting for sfx_id, vfx_tags, and bgm_track.
            Calls update_storyboard_audio() to persist changes.
            Returns True on success.
            """
            if not shot_update:
                logger.warning(f"No update data for shot {sb.storyboard_number}")
                return False

            sfx_id = shot_update.get("sfx_id", "")
            vfx_tags = shot_update.get("vfx_tags", [])
            bgm_track = shot_update.get("bgm_track", "")

            # Normalize types
            if not isinstance(vfx_tags, list):
                vfx_tags = [vfx_tags] if vfx_tags else []

            # Handle MISSING for sfx_id
            if sfx_id and str(sfx_id).startswith("MISSING:"):
                desc = str(sfx_id).replace("MISSING:", "").strip()
                report_missing_asset(sb.id, ASSET_TYPE_MAP["sfx_id"], desc, f"auto_sfx_{sb.id}")
                sfx_id = ""

            # Handle MISSING for vfx_tags (each item)
            cleaned_vfx = []
            for vtag in vfx_tags:
                vtag_str = str(vtag) if vtag else ""
                if vtag_str.startswith("MISSING:"):
                    desc = vtag_str.replace("MISSING:", "").strip()
                    report_missing_asset(sb.id, ASSET_TYPE_MAP["vfx_tags"], desc, f"auto_vfx_{sb.id}")
                else:
                    cleaned_vfx.append(vtag_str)
            vfx_tags = cleaned_vfx

            # Handle MISSING for bgm_track
            if bgm_track and str(bgm_track).startswith("MISSING:"):
                desc = str(bgm_track).replace("MISSING:", "").strip()
                report_missing_asset(sb.id, ASSET_TYPE_MAP["bgm_track"], desc, f"auto_bgm_{sb.id}")
                bgm_track = ""

            result = update_storyboard_audio(
                storyboard_id=sb.id,
                sfx_id=sfx_id,
                vfx_tags=vfx_tags,
                bgm_track=bgm_track,
            )
            if result.get("status") == "error" or result.get("error"):
                logger.warning(
                    f"Shot {sb.storyboard_number}: DB update failed - "
                    f"{result.get('message', result.get('error', 'unknown'))}"
                )
                return False

            log_logic_transition(logger, "SHOT_COMPLETE", f"Finished Shot {sb.storyboard_number}")
            return True

        # --- MAIN BATCH LOOP ---
        total_shots = len(storyboards)
        any_batch_failed = False
        logger.info(f"🚀 ZERO-TOOL Batch processing {total_shots} shots (size={BATCH_SIZE})")

        for batch_idx in range(0, total_shots, BATCH_SIZE):
            batch_shots = storyboards[batch_idx : batch_idx + BATCH_SIZE]
            batch_num = (batch_idx // BATCH_SIZE) + 1
            logger.info(f"📦 Batch {batch_num}: Processing {len(batch_shots)} shots")

            prev_sbs = [
                s for s in storyboards
                if s.storyboard_number < batch_shots[0].storyboard_number
            ]
            compact_history = _build_compact_history(prev_sbs)

            prefetch_data = _prefetch_audio_assets_for_batch(batch_shots)

            prompt = _build_zero_tool_prompt(batch_shots, compact_history, prefetch_data)
            import time
            from src.shared.schema_validator import (
                S6_SHOT_SCHEMA,
                S6_JSON_SCHEMA,
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
                        response_format=S6_JSON_SCHEMA,
                        enable_json_schema_validation=True,
                    )
                except Exception as e:
                    logger.error(
                        f"Batch {batch_num} LLM call failed "
                        f"(attempt {attempt}/{MAX_RETRIES}): {e}"
                    )
                    if attempt < MAX_RETRIES:
                        time.sleep(2)
                    any_batch_failed = True
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
                    updates, S6_SHOT_SCHEMA, len(batch_shots)
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
            else:
                # Executed when loop completes without break (all retries exhausted)
                logger.error(
                    f"Batch {batch_num}: ALL retries exhausted — "
                    f"applying best-effort updates with possible gaps"
                )

            for sb in batch_shots:
                shot_update = next(
                    (
                        u for u in updates
                        if u.get("storyboard_id") == sb.id
                        or u.get("shot_number") == sb.storyboard_number
                    ),
                    None,
                )
                _apply_shot_audio_updates(sb, shot_update)

            # Refresh ORM objects so _build_compact_history sees committed audio updates
            # from previous batches (update_storyboard_audio uses a separate DB session).
            db.expire_all()

        logger.info(f"\n✨ [AI SUMMARY]\nHoàn thành thiết kế âm thanh cho Episode {episode_id}.\n")
        return not any_batch_failed
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)
    run_station_6_sound_vfx_engineer(sys.argv[1], "public/asset_registry.json")
