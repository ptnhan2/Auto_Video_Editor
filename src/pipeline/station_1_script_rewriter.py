import os
import sys
import importlib

from google.genai import types
from dotenv import load_dotenv

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

_llm = importlib.import_module('src.shared.api_clients.llm_client')
start_chat = _llm.start_chat

load_dotenv(".env.local")

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Logging config
logger = setup_logger("station_1_rewriter")

# ==========================================
# TOOL DEFINITIONS
# ==========================================

def read_episode_script(episode_id: str) -> dict:
    """Đọc nội dung kịch bản gốc của tập phim (Read the script content of the current episode)."""
    log_logic_transition(logger, "TOOL_START", "read_episode_script", {"episode_id": episode_id})
    db = SessionLocal()
    try:
        log_db_operation(logger, "query", "Episode", {"id": episode_id})
        ep = db.query(Episode).filter(Episode.id == episode_id).first()
        if not ep:
            res = {"error": f"Episode not found (id={episode_id})"}
            log_tool_execution(logger, "read_episode_script", {"episode_id": episode_id}, res)
            return res
        content = ep.content or ep.script_content
        if not content:
            res = {"error": f"Episode has no content (id={episode_id})"}
            log_tool_execution(logger, "read_episode_script", {"episode_id": episode_id}, res)
            return res
        
        result = {"content": content, "word_count": len(content), "episode_id": episode_id}
        log_tool_execution(logger, "read_episode_script", {"episode_id": episode_id}, result)
        return result
    finally:
        db.close()

def rewrite_to_screenplay(episode_id: str, instructions: str = "") -> dict:
    """Lấy nội dung để AI viết lại thành kịch bản định dạng chuẩn (Screenplay)."""
    log_logic_transition(logger, "TOOL_START", "rewrite_to_screenplay", {"episode_id": episode_id, "instructions": instructions})
    db = SessionLocal()
    try:
        log_db_operation(logger, "query", "Episode", {"id": episode_id})
        ep = db.query(Episode).filter(Episode.id == episode_id).first()
        if not ep:
            res = {"error": "Episode not found"}
            log_tool_execution(logger, "rewrite_to_screenplay", {"episode_id": episode_id}, res)
            return res
        source = ep.content or ep.script_content
        if not source:
            res = {"error": "Episode has no content to rewrite"}
            log_tool_execution(logger, "rewrite_to_screenplay", {"episode_id": episode_id}, res)
            return res
            
        instruction_text = f"""Hãy viết lại nội dung sau đây thành kịch bản định dạng.

Quy chuẩn định dạng:
- Tiêu đề cảnh: ## S[Số thứ tự] | Nội cảnh/Ngoại cảnh · Địa điểm | Khoảng thời gian
- Mô tả hành động: Đoạn văn tự nhiên, không chứa ngôn ngữ máy quay
- Đối thoại: Tên nhân vật: (Trạng thái/Biểu cảm) Nội dung lời thoại
- Mỗi cảnh chứa nội dung khoảng 30-60 giây

{instructions or ''}

【Nội dung gốc】
{source}"""
        result = {"source_content_preview": source[:100] + "...", "instruction": instruction_text}
        log_tool_execution(logger, "rewrite_to_screenplay", {"episode_id": episode_id}, result)
        return result
    finally:
        db.close()

def save_script(episode_id: str, content: str) -> dict:
    """Lưu nội dung kịch bản đã được viết lại vào tập phim."""
    log_logic_transition(logger, "TOOL_START", "save_script", {"episode_id": episode_id, "content_length": len(content)})
    db = SessionLocal()
    try:
        log_db_operation(logger, "query", "Episode", {"id": episode_id})
        ep = db.query(Episode).filter(Episode.id == episode_id).first()
        if not ep:
            res = {"error": "Episode not found"}
            log_tool_execution(logger, "save_script", {"episode_id": episode_id}, res)
            return res
            
        if len(content) < 100:
            res = {"error": "Kịch bản quá ngắn. Vui lòng viết lại đầy đủ."}
            log_tool_execution(logger, "save_script", {"episode_id": episode_id}, res)
            return res
        
        log_db_operation(logger, "update", "Episode", {"id": episode_id}, {"script_content_length": len(content)})
        ep.script_content = content
        db.commit()
        result = {"message": "Script saved successfully", "word_count": len(content)}
        log_tool_execution(logger, "save_script", {"episode_id": episode_id}, result)
        return result
    except Exception as e:
        db.rollback()
        res = {"error": str(e)}
        log_tool_execution(logger, "save_script", {"episode_id": episode_id}, res)
        return res
    finally:
        db.close()

# ==========================================
# AGENT WORKFLOW
# ==========================================

SYSTEM_PROMPT = """# Hướng dẫn viết lại kịch bản (Script Rewriter)

Bạn là một Biên kịch chuyên nghiệp. Nhiệm vụ của bạn là chuyển đổi văn bản tiểu thuyết thành kịch bản điện ảnh chi tiết.

## NGUYÊN TẮC QUAN TRỌNG:
1. **KHÔNG TÓM TẮT**: Tuyệt đối không được lược bỏ tình tiết. Kịch bản viết lại phải có độ chi tiết và độ dài tương đương hoặc dài hơn nội dung gốc. 
2. **GIỮ NGUYÊN CỐT TRUYỆN**: Không thay đổi các sự kiện chính và mối quan hệ nhân vật.
3. **TRỰC QUAN HÓA**: Chuyển các đoạn miêu tả nội tâm hoặc lời kể thành hành động có thể quan sát được hoặc lời thoại.
4. **NHỊP ĐỘ (PACING)**: Chia nhỏ thành các cảnh từ 30-60 giây.
5. **KHÔNG DÙNG NGÔN NGỮ MÁY QUAY**: Không viết "Zoom in", "Pan left", v.v.

## ĐỊNH DẠNG CHUẨN:

## S01 | Nội cảnh · Địa điểm | Khoảng thời gian
Mô tả hành động tự nhiên...
Nhân vật A: (Biểu cảm) Lời thoại...

## CÁC BƯỚC THỰC HIỆN (BẮT BUỘC):
1. Gọi `read_episode_script` để lấy toàn bộ nội dung gốc.
2. Gọi `rewrite_to_screenplay` để nhận hướng dẫn bổ sung.
3. Thực hiện viết lại TOÀN BỘ nội dung theo định dạng chuẩn. Đảm bảo dung lượng nội dung (word count) không bị sụt giảm quá nhiều so với bản gốc.
4. Gọi `save_script` để lưu kết quả. BẠN PHẢI GỬI TOÀN BỘ KỊCH BẢN, KHÔNG ĐƯỢC NGẮT QUÃNG.
"""

def run_station_1_agent(episode_id: str):
    log_logic_transition(logger, "AGENT_INIT", f"Script Rewriter Agent for Episode: {episode_id}")
    
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        temperature=0.7,
        tools=[read_episode_script, rewrite_to_screenplay, save_script],
    )

    initial_message = f"Hãy thực hiện viết lại TOÀN BỘ kịch bản cho tập phim có episode_id='{episode_id}' theo đúng quy trình. Lưu ý KHÔNG TÓM TẮT, giữ nguyên độ chi tiết của truyện gốc."
    
    log_logic_transition(logger, "AGENT_RUN", "Sending request to model")
    
    try:
        chat = start_chat("station_1_rewriter", config)
        response = chat.send_message(initial_message)
        
        log_ai_interaction(logger, SYSTEM_PROMPT, initial_message, response)
        log_logic_transition(logger, "AGENT_COMPLETE", f"Finished station 1 for {episode_id}")
        
        # Display AI Summary
        logger.info(f"\n✨ [AI SUMMARY]\n{response.text}\n")
        return True
    except Exception as e:
        logger.error(f"❌ Agent Error: {e}")
        return False

if __name__ == "__main__":
    from src.db.database import init_db

    import argparse
    
    log_environment_info(logger)
    log_logic_transition(logger, "STARTUP", "Initializing Station 1")

    parser = argparse.ArgumentParser(description="Run Station 1 Script Rewriter for a specific episode.")
    parser.add_argument("episode_id", help="Episode ID to process")
    args = parser.parse_args()
    
    init_db()
    log_logic_transition(logger, "AGENT_START", f"Running rewriting agent for episode_id={args.episode_id}")
    
    success = run_station_1_agent(args.episode_id)
    if not success:
        log_logic_transition(logger, "SHUTDOWN", "Station 1 execution FAILED")
        sys.exit(1)
    
    log_logic_transition(logger, "SHUTDOWN", "Station 1 execution finished")
