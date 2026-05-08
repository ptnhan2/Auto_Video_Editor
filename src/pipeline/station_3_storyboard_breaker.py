import os
import sys
import importlib

from google.genai import types
from dotenv import load_dotenv
from sqlalchemy import and_

# Ensure the parent directory is in the path so we can import src modules
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
Episode = _schema.Episode
Character = _schema.Character
Scene = _schema.Scene
EpisodeCharacter = _schema.EpisodeCharacter
Storyboard = _schema.Storyboard
StoryboardCharacter = _schema.StoryboardCharacter

_llm = importlib.import_module('src.shared.api_clients.llm_client')
start_chat = _llm.start_chat

load_dotenv(".env.local")

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Logging config
logger = setup_logger("station_3_breaker")

# ==========================================
# TOOL DEFINITIONS
# ==========================================

def read_storyboard_context(episode_id: str, drama_id: str) -> dict:
    """Đọc kịch bản và thực thể liên quan để chuẩn bị phân rã storyboard."""
    log_logic_transition(logger, "TOOL_START", "read_storyboard_context", {"episode_id": episode_id})
    db = SessionLocal()
    try:
        log_db_operation(logger, "query", "Episode", {"id": episode_id})
        ep = db.query(Episode).filter(Episode.id == episode_id).first()
        if not ep:
            return {"error": "Episode not found"}
        
        script = ep.script_content or ep.content
        
        log_db_operation(logger, "query", "EpisodeCharacter", {"episode_id": episode_id})
        char_links = db.query(EpisodeCharacter).filter(EpisodeCharacter.episode_id == episode_id).all()
        linked_char_ids = {link.character_id for link in char_links}
        
        all_chars = db.query(Character).filter(and_(Character.drama_id == drama_id, Character.deleted_at.is_(None))).all()
        all_scenes = db.query(Scene).filter(and_(Scene.drama_id == drama_id, Scene.deleted_at.is_(None))).all()
        
        characters = [{"id": c.id, "name": c.name, "role": c.role} for c in all_chars if c.id in linked_char_ids]
        scenes = [{"id": s.id, "location": s.location, "time": s.time} for s in all_scenes]
        
        result = {
            "episode": {"id": ep.id, "title": ep.title},
            "script": script,
            "characters": characters,
            "scenes": scenes
        }
        log_tool_execution(logger, "read_storyboard_context", {"episode_id": episode_id}, result)
        return result
    finally:
        db.close()

def save_storyboards(episode_id: str, storyboards: list[dict]) -> dict:
    """Lưu danh sách storyboard (Chế độ APPEND - Ghi thêm).
    
    LƯU Ý: Tool này sẽ THÊM MỚI các shot vào database. Việc xóa dữ liệu cũ đã được thực hiện tự động khi bắt đầu phiên làm việc.
    AI có thể gọi tool này nhiều lần để lưu hết toàn bộ các phân cảnh.
    
    Args:
        episode_id: ID tập phim.
        storyboards: List các dict {shot_number, scene_id, speaker_id, character_ids, action, dialogue, description}.
    """
    log_logic_transition(logger, "TOOL_START", "save_storyboards", {"count": len(storyboards)})
    db = SessionLocal()
    try:
        total_duration = 0
        for sb in storyboards:
            duration = sb.get("duration", 5)
            new_sb = Storyboard(
                episode_id=episode_id,
                scene_id=sb.get("scene_id"),
                speaker_id=sb.get("speaker_id"),
                storyboard_number=sb.get("shot_number"),
                action=sb.get("action"),
                dialogue=sb.get("dialogue") or "",
                description=sb.get("description"),
                duration=duration
            )
            db.add(new_sb)
            db.flush()
            
            for cid in sb.get("character_ids", []):
                db.add(StoryboardCharacter(storyboard_id=new_sb.id, character_id=cid))
            total_duration += duration
        
        db.commit()
        res = {"status": "success", "shots_added": len(storyboards), "total_duration": total_duration}
        log_tool_execution(logger, "save_storyboards", None, res)
        return res
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()

# ==========================================
# AGENT WORKFLOW
# ==========================================

SYSTEM_PROMPT = """Bạn là Đạo diễn Phân cảnh (Storyboard Breaker). Nhiệm vụ của bạn là chia nhỏ kịch bản thành các khung hình (Shots) chi tiết.

QUY TẮC VÀNG:
1. TẬP TRUNG NỘI DUNG: Nhiệm vụ chính là phân đoạn kịch bản và đảm bảo mọi câu thoại (`dialogue`) đều được đưa vào các Shot.
2. KHÔNG QUYẾT ĐỊNH KỸ THUẬT HÌNH ẢNH: Bạn KHÔNG CẦN quan tâm đến cỡ cảnh (shot_type), góc máy (angle) hay chuyển động (movement). Việc này sẽ do Đạo diễn hình ảnh ở trạm sau thực hiện.
3. MÔ TẢ HÀNH ĐỘNG: Cung cấp mô tả hành động (`action`) và bối cảnh (`description`) một cách tự nhiên để làm tiền đề cho trạm sau chọn asset.
4. PHÂN LOẠI SPEAKER CHÍNH XÁC: Gán `speaker_id` của nhân vật tương ứng, hoặc "Narrator" cho các phần dẫn dắt.
5. CHẾ ĐỘ APPEND: Nếu kịch bản quá dài, hãy gọi tool `save_storyboards` NHIỀU LẦN. Đảm bảo số thứ tự `shot_number` tăng dần liên tục (1, 2, 3...).

QUY TRÌNH:
1. Gọi `read_storyboard_context`.
2. Phân tích kịch bản.
3. Gọi `save_storyboards` một hoặc nhiều lần để lưu TOÀN BỘ các phân cảnh.
"""

def run_station_3_agent(episode_id: str):
    log_logic_transition(logger, "AGENT_INIT", f"Storyboard Breaker for Episode: {episode_id}")
    log_environment_info(logger)
    
    db = SessionLocal()
    try:
        log_db_operation(logger, "query", "Episode", {"id": episode_id})
        ep = db.query(Episode).filter(Episode.id == episode_id).first()
        if not ep:
            return False
        drama_id = ep.drama_id
        
        # 1. Dọn dẹp dữ liệu cũ TRƯỚC khi AI bắt đầu làm việc
        log_logic_transition(logger, "CLEANUP", f"Deleting old storyboards for episode {episode_id}")
        existing_sbs = db.query(Storyboard).filter(Storyboard.episode_id == episode_id).all()
        for sb in existing_sbs:
            db.query(StoryboardCharacter).filter(StoryboardCharacter.storyboard_id == sb.id).delete()
        db.query(Storyboard).filter(Storyboard.episode_id == episode_id).delete()
        db.commit()

        # 2. Đảm bảo Narrator tồn tại
        narrator = db.query(Character).filter(and_(Character.drama_id == drama_id, Character.name == "Narrator")).first()
        if not narrator:
            narrator = Character(drama_id=drama_id, name="Narrator", role="Narrator")
            db.add(narrator)
            db.commit()
            db.refresh(narrator)
            
    finally:
        db.close()
    
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        temperature=0.2,
        tools=[read_storyboard_context, save_storyboards],
    )

    initial_message = f"Phân rã kịch bản cho episode_id='{episode_id}' (drama_id='{drama_id}'). Hãy chia thành các shots nhỏ, chi tiết và lưu lại toàn bộ."
    
    log_logic_transition(logger, "AGENT_RUN", "Sending request to model")
    try:
        chat = start_chat("station_3_breaker", config)
        response = chat.send_message(initial_message)
        log_ai_interaction(logger, SYSTEM_PROMPT, initial_message, response)
        log_logic_transition(logger, "AGENT_COMPLETE", f"Finished station 3 for {episode_id}")
        
        logger.info(f"\n✨ [AI SUMMARY]\n{response.text}\n")
        return True
    except Exception as e:
        logger.error(f"❌ Agent Error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        success = run_station_3_agent(sys.argv[1])
        if not success:
            sys.exit(1)
    else:
        logger.error("Vui lòng cung cấp episode_id.")
        sys.exit(1)
