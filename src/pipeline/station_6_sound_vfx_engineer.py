import os
import sys
import json
import math
from datetime import datetime
from typing import List

from google.genai import types
from dotenv import load_dotenv

# Ensure the parent directory is in the path
sys.path.append(os.getcwd())

from src.shared.logger import setup_logger, log_ai_interaction, log_tool_execution, log_logic_transition, log_db_operation
from src.db.database import SessionLocal
from src.db.schema import Storyboard
from src.shared.api_clients.llm_client import start_chat, embed_texts

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
Nhiệm vụ: Thiết kế âm thanh và kỹ xảo cho từng Shot (Storyboard).

Quy trình làm việc:
1. Bạn sẽ nhận được thông tin về Shot bao gồm: ID, Action, Dialogue, Atmosphere, Visual Metaphor.
2. Dùng tool `search_audio_vfx_registry` để tìm kiếm các ID phù hợp trong kho tài nguyên hiện có.
   - Tìm BGM (Nhạc nền): Dựa trên trường `atmosphere` (ví dụ: vui vẻ -> bgm_happy, căng thẳng -> bgm_tense).
   - Tìm SFX (Hiệu ứng âm thanh): Dựa trên trường `action` hoặc các hành động vật lý (ví dụ: "bước chân" -> sfx_footsteps, "đánh" -> sfx_punch).
   - Tìm VFX (Hiệu ứng hình ảnh): Dựa trên `visual_metaphor` hoặc mô tả cảnh (ví dụ: "chớp" -> vfx_flash_white, "rung lắc" -> vfx_screen_shake).
3. Nếu tìm thấy ID phù hợp, hãy sử dụng tool `update_storyboard_audio` để cập nhật dữ liệu cho Shot (lưu ý: BGM truyền vào `bgm_track`, SFX truyền vào `sfx_id`, VFX truyền vào list `vfx_tags`). Cung cấp chuỗi rỗng "" hoặc list rỗng [] nếu không cần dùng.
4. Fallback: Nếu kho tài nguyên KHÔNG có ID phù hợp nhưng cảnh quay bắt buộc phải có hiệu ứng đó để truyền đạt cảm xúc, hãy dùng tool `report_missing_asset` để báo cáo thiếu tài nguyên, đưa ra mô tả (description) chi tiết và `suggested_id` theo chuẩn đặt tên. Sau đó gọi `update_storyboard_audio` với các ID trống.
5. Chỉ thực hiện update MỘT LẦN duy nhất cho mỗi shot.
"""

def run_station_6_sound_vfx_engineer(episode_id: str, registry_path: str):
    global available_sfx, available_vfx, available_bgm
    log_logic_transition(logger, "AGENT_INIT", f"Sound/VFX Engineer for Episode: {episode_id}")
    
    if os.path.exists(registry_path):
        with open(registry_path, "r", encoding="utf-8") as f:
            registry = json.load(f)
        available_sfx = registry.get("sfx", [])
        available_vfx = registry.get("vfx", [])
        available_bgm = registry.get("bgm", [])

    db = SessionLocal()
    storyboards = db.query(Storyboard).filter(Storyboard.episode_id == episode_id).order_by(Storyboard.storyboard_number).all()
    db.close()

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        tools=[search_audio_vfx_registry, update_storyboard_audio, report_missing_asset],
    )
    chat = start_chat("station_6_vfx", config)
    for sb in storyboards:
        prompt = f"Storyboard ID: {sb.id}\nShot {sb.storyboard_number}\nAction: {sb.action}\nDialogue: {sb.dialogue}\nAtmosphere: {sb.atmosphere}\nVisual Metaphor: {sb.visual_metaphor}"
        response = chat.send_message(prompt)
        log_ai_interaction(logger, SYSTEM_PROMPT, prompt, response)

    logger.info(f"\n✨ [AI SUMMARY]\nHoàn thành thiết kế âm thanh cho Episode {episode_id}.\n")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)
    run_station_6_sound_vfx_engineer(sys.argv[1], "public/asset_registry.json")
