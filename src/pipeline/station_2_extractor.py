import os
import sys

# Ensure the parent directory is in the path so we can import src modules
sys.path.append(os.getcwd())

from src.shared.logger import setup_logger, log_ai_interaction, log_tool_execution, log_logic_transition, log_db_operation, log_environment_info
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types
from dotenv import load_dotenv
from sqlalchemy import and_

from src.db.database import SessionLocal
from src.db.schema import Episode, Character, Scene, EpisodeCharacter, EpisodeScene, Drama
from src.config import get_model_for_station

load_dotenv(".env.local")

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Logging config
logger = setup_logger("station_2_extractor")

# ==========================================
# TOOL DEFINITIONS
# ==========================================

def read_script_for_extraction(episode_id: str) -> dict:
    """Đọc kịch bản định dạng chuẩn (Screenplay) để bóc tách nhân vật và bối cảnh."""
    log_logic_transition(logger, "TOOL_START", "read_script_for_extraction", {"episode_id": episode_id})
    db = SessionLocal()
    try:
        log_db_operation(logger, "query", "Episode", {"id": episode_id})
        ep = db.query(Episode).filter(Episode.id == episode_id).first()
        if not ep:
            res = {"error": f"Episode not found (id={episode_id})"}
            log_tool_execution(logger, "read_script_for_extraction", {"episode_id": episode_id}, res)
            return res
        content = ep.script_content or ep.content
        if not content:
            res = {"error": f"Episode has no script content (id={episode_id})"}
            log_tool_execution(logger, "read_script_for_extraction", {"episode_id": episode_id}, res)
            return res
        
        result = {"script": content}
        log_tool_execution(logger, "read_script_for_extraction", {"episode_id": episode_id}, result)
        return result
    finally:
        db.close()

def read_existing_characters(episode_id: str, drama_id: str) -> dict:
    """Đọc danh sách các nhân vật đã tồn tại trong dự án."""
    log_logic_transition(logger, "TOOL_START", "read_existing_characters", {"episode_id": episode_id, "drama_id": drama_id})
    db = SessionLocal()
    try:
        log_db_operation(logger, "query", "Character", {"drama_id": drama_id})
        all_chars = db.query(Character).filter(
            and_(Character.drama_id == drama_id, Character.deleted_at.is_(None))
        ).all()
        
        chars_data = [
            {
                "id": c.id, 
                "name": c.name, 
                "role": c.role, 
                "description": c.description,
                "appearance": c.appearance,
                "personality": c.personality
            } 
            for c in all_chars
        ]
        
        result = {
            "total_count": len(chars_data),
            "characters": chars_data
        }
        log_tool_execution(logger, "read_existing_characters", {"drama_id": drama_id}, result)
        return result
    finally:
        db.close()

def save_dedup_characters(episode_id: str, drama_id: str, characters: list[dict]) -> dict:
    """Lưu danh sách nhân vật với đầy đủ thông tin chi tiết.
    
    Args:
        episode_id: ID tập phim.
        drama_id: ID dự án.
        characters: List các dict {name, role, description, appearance, personality}.
    """
    log_logic_transition(logger, "TOOL_START", "save_dedup_characters", {"count": len(characters)})
    db = SessionLocal()
    try:
        results = {"created": 0, "updated": 0}
        for char in characters:
            name = char.get("name")
            if not name: continue
            
            log_db_operation(logger, "query", "Character", {"name": name, "drama_id": drama_id})
            existing = db.query(Character).filter(
                and_(Character.drama_id == drama_id, Character.name == name, Character.deleted_at.is_(None))
            ).first()
            
            if existing:
                log_db_operation(logger, "update", "Character", {"id": existing.id}, char)
                existing.role = char.get("role") or existing.role
                existing.description = char.get("description") or existing.description
                existing.appearance = char.get("appearance") or existing.appearance
                existing.personality = char.get("personality") or existing.personality
                db.commit()
                char_id = existing.id
                results["updated"] += 1
            else:
                log_db_operation(logger, "create", "Character", None, char)
                new_char = Character(
                    drama_id=drama_id, 
                    name=name, 
                    role=char.get("role", ""),
                    description=char.get("description", ""),
                    appearance=char.get("appearance", ""),
                    personality=char.get("personality", "")
                )
                db.add(new_char)
                db.commit()
                db.refresh(new_char)
                char_id = new_char.id
                results["created"] += 1
            
            # Link to episode
            link = db.query(EpisodeCharacter).filter(
                and_(EpisodeCharacter.episode_id == episode_id, EpisodeCharacter.character_id == char_id)
            ).first()
            if not link:
                db.add(EpisodeCharacter(episode_id=episode_id, character_id=char_id))
                db.commit()
                
        res = {"status": "success", "results": results}
        log_tool_execution(logger, "save_dedup_characters", None, res)
        return res
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()

def save_dedup_scenes(episode_id: str, drama_id: str, scenes: list[dict]) -> dict:
    """Lưu danh sách bối cảnh với đầy đủ thông tin.
    
    Args:
        episode_id: ID tập phim (BẮT BUỘC để liên kết).
        drama_id: ID dự án.
        scenes: List các dict {location, time, prompt}.
    """
    log_logic_transition(logger, "TOOL_START", "save_dedup_scenes", {"count": len(scenes)})
    db = SessionLocal()
    try:
        results = {"created": 0, "reused": 0}
        for scene in scenes:
            location = scene.get("location")
            if not location: continue
            time_val = scene.get("time", "")
            
            log_db_operation(logger, "query", "Scene", {"location": location, "time": time_val})
            existing = db.query(Scene).filter(
                and_(Scene.drama_id == drama_id, Scene.location == location, Scene.time == time_val, Scene.deleted_at.is_(None))
            ).first()
            
            if existing:
                scene_id = existing.id
                results["reused"] += 1
            else:
                log_db_operation(logger, "create", "Scene", None, scene)
                new_scene = Scene(
                    drama_id=drama_id, 
                    episode_id=episode_id, # Đảm bảo có episode_id
                    location=location, 
                    time=time_val, 
                    prompt=scene.get("prompt", location)
                )
                db.add(new_scene)
                db.commit()
                db.refresh(new_scene)
                scene_id = new_scene.id
                results["created"] += 1
                
            # Link to episode via pivot
            link = db.query(EpisodeScene).filter(
                and_(EpisodeScene.episode_id == episode_id, EpisodeScene.scene_id == scene_id)
            ).first()
            if not link:
                db.add(EpisodeScene(episode_id=episode_id, scene_id=scene_id))
                db.commit()
                
        res = {"status": "success", "results": results}
        log_tool_execution(logger, "save_dedup_scenes", None, res)
        return res
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()

# ==========================================
# AGENT WORKFLOW
# ==========================================

SYSTEM_PROMPT = """Bạn là chuyên gia trích xuất thực thể (Character & Scene) từ kịch bản điện ảnh.

NHIỆM VỤ QUAN TRỌNG:
1. Trích xuất TẤT CẢ nhân vật xuất hiện trong kịch bản (bao gồm nhân vật chính, phụ và quần chúng). 
2. BẮT BUỘC phải bao gồm nhân vật "Narrator" (Người dẫn chuyện) để xử lý các phần dẫn dắt không thuộc lời thoại nhân vật.
3. Với mỗi nhân vật, bạn PHẢI cung cấp đầy đủ:
   - name: Tên chính xác.
   - role: Vai trò (Chính/Phụ/Narrator).
   - description: Chi tiết về lai lịch và tính cách.
   - appearance: Mô tả ngoại hình cực kỳ chi tiết để AI có thể vẽ hình.
   - personality: Đặc điểm tâm lý.

4. Trích xuất TẤT CẢ bối cảnh (Scene):
   - location, time, prompt (mô tả cảnh bằng tiếng Anh).

QUY TRÌNH:
1. Gọi `read_script_for_extraction`.
2. Gọi `read_existing_characters`.
3. Phân tích và trích xuất (Không được bỏ sót bất kỳ ai, dù chỉ xuất hiện 1 giây).
4. Gọi `save_dedup_characters`.
5. Gọi `save_dedup_scenes`.
"""

def run_station_2_agent(episode_id: str):
    log_logic_transition(logger, "AGENT_INIT", f"Extractor Agent for Episode: {episode_id}")
    log_environment_info(logger)
    
    db = SessionLocal()
    try:
        log_db_operation(logger, "query", "Episode", {"id": episode_id})
        ep = db.query(Episode).filter(Episode.id == episode_id).first()
        if not ep:
            logger.error(f"❌ Episode ID: {episode_id} not found")
            return False
        drama_id = ep.drama_id

        # TỰ ĐỘNG ĐẢM BẢO CÓ NARRATOR TRONG DB CHO DRAMA NÀY
        log_db_operation(logger, "query", "Character", {"name": "Narrator", "drama_id": drama_id})
        narrator = db.query(Character).filter(and_(Character.drama_id == drama_id, Character.name == "Narrator")).first()
        if not narrator:
            log_logic_transition(logger, "AUTO_FIX", "Creating missing Narrator character")
            narrator = Character(
                drama_id=drama_id, 
                name="Narrator", 
                role="Narrator", 
                description="Người dẫn chuyện mặc định",
                appearance="Không hiển thị hình ảnh trực tiếp, chỉ có giọng nói"
            )
            db.add(narrator)
            db.commit()
            db.refresh(narrator)
        
        # Link Narrator to Episode if not linked
        link = db.query(EpisodeCharacter).filter(and_(EpisodeCharacter.episode_id == episode_id, EpisodeCharacter.character_id == narrator.id)).first()
        if not link:
            db.add(EpisodeCharacter(episode_id=episode_id, character_id=narrator.id))
            db.commit()

    finally:
        db.close()
        
    api_key = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY")
    client = genai.Client(api_key=api_key)
    model_name = get_model_for_station("station_2_extractor")

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        temperature=0.2,
        tools=[read_script_for_extraction, read_existing_characters, save_dedup_characters, save_dedup_scenes],
    )

    initial_message = f"Thực hiện bóc tách nhân vật và bối cảnh cho episode_id='{episode_id}' (drama_id='{drama_id}'). Hãy cung cấp thông tin cực kỳ chi tiết."
    
    log_logic_transition(logger, "AGENT_RUN", f"Sending request to {model_name}")
    try:
        chat = client.chats.create(model=model_name, config=config)
        response = chat.send_message(initial_message)
        log_ai_interaction(logger, SYSTEM_PROMPT, initial_message, response)
        log_logic_transition(logger, "AGENT_COMPLETE", f"Finished station 2 for {episode_id}")
        
        logger.info(f"\n✨ [AI SUMMARY]\n{response.text}\n")
        return True
    except Exception as e:
        logger.error(f"❌ Agent Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        run_station_2_agent(sys.argv[1])
    else:
        logger.error("Vui lòng cung cấp episode_id.")
