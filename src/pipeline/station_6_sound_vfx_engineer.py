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

from src.db.database import SessionLocal
from src.db.schema import Storyboard, Episode
from src.config import get_model_for_station

load_dotenv(".env.local")

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

logger = setup_logger("station_6_sound_vfx_engineer")

api_key = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY")
client = genai.Client(api_key=api_key)

# Global Registry State
available_sfx = []
available_vfx = []
available_bgm = []

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

def search_audio_vfx_registry(query: str) -> list:
    """Tìm kiếm SFX, VFX và BGM trong kho."""
    log_logic_transition(logger, "TOOL_START", "search_audio_vfx_registry", {"query": query})
    
    all_items = (
        [{"type": "SFX", **item} for item in available_sfx] +
        [{"type": "VFX", **item} for item in available_vfx] +
        [{"type": "BGM", **item} for item in available_bgm]
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
    log_tool_execution(logger, "search_audio_vfx_registry", {"query": query}, res)
    return res

def update_storyboard_audio(storyboard_id: str, sfx_id: str, vfx_tags: list[str], bgm_track: str) -> dict:
    log_logic_transition(logger, "TOOL_START", "update_storyboard_audio", {"storyboard_id": storyboard_id})
    db = SessionLocal()
    try:
        shot = db.query(Storyboard).filter(Storyboard.id == storyboard_id).first()
        if not shot: return {"error": "Not found"}
        
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
    return {"status": "reported"}

SYSTEM_PROMPT = """Bạn là Kỹ sư Âm thanh và VFX (Sound & VFX Engineer). 
Nhiệm vụ: Thiết kế âm thanh và kỹ xảo cho từng Shot.
1. Dùng `search_audio_vfx_registry` để tìm ID phù hợp (SFX, VFX, BGM).
2. Gọi `update_storyboard_audio` để lưu toàn bộ tham số."""

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

    model_name = get_model_for_station("station_6_vfx")
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        tools=[search_audio_vfx_registry, update_storyboard_audio, report_missing_asset],
    )
    chat = client.chats.create(model=model_name, config=config)
    for sb in storyboards:
        prompt = f"Shot {sb.storyboard_number}. Action: {sb.action}, Dialogue: {sb.dialogue}"
        response = chat.send_message(prompt)
        log_ai_interaction(logger, SYSTEM_PROMPT, prompt, response)

    logger.info(f"\n✨ [AI SUMMARY]\nHoàn thành thiết kế âm thanh cho Episode {episode_id}.\n")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2: sys.exit(1)
    run_station_6_sound_vfx_engineer(sys.argv[1], "public/asset_registry.json")
