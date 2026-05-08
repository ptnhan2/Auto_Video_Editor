# src/shared/logger.py
import logging
import os
import sys
from datetime import datetime
import json
import platform
import psutil

def setup_logger(station_name: str):
    """Thiết lập logger đồng nhất cho các trạm với mức độ chi tiết cao."""
    log_dir = os.path.join(os.getcwd(), "logs")
    os.makedirs(log_dir, exist_ok=True)
    
    log_filename = f"{datetime.now().strftime('%Y-%m-%d')}_{station_name}.log"
    log_path = os.path.join(log_dir, log_filename)
    
    logger = logging.getLogger(station_name)
    logger.setLevel(logging.DEBUG) 
    
    if logger.handlers:
        return logger

    file_formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s [%(name)s] [%(threadName)s]: %(message)s'
    )
    
    console_formatter = logging.Formatter(
        '%(message)s'
    )
    
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(logging.INFO)
    
    file_handler = logging.FileHandler(log_path, encoding='utf-8')
    file_handler.setFormatter(file_formatter)
    file_handler.setLevel(logging.DEBUG)
    
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    return logger

def log_environment_info(logger):
    """Log thông tin môi trường thực thi."""
    logger.debug("\n" + "="*100)
    logger.debug("🌐 [ENVIRONMENT INFO]")
    logger.debug(f"   OS: {platform.system()} {platform.release()}")
    logger.debug(f"   Python: {sys.version}")
    logger.debug(f"   CWD: {os.getcwd()}")
    try:
        mem = psutil.virtual_memory()
        logger.debug(f"   Memory: {mem.available / (1024**3):.2f}GB available / {mem.total / (1024**3):.2f}GB total")
    except Exception:
        pass
    logger.debug("="*100 + "\n")

def log_ai_interaction(logger, system_instruction, user_prompt, response_obj):
    """Log cực kỳ chi tiết tương tác với AI bao gồm cả tool calls."""
    logger.debug("\n" + "="*100)
    logger.debug("🤖 [AI INTERACTION TRACE]")
    logger.debug("="*100)
    
    logger.debug(f"\n[SYSTEM INSTRUCTION]\n{system_instruction}")
    logger.debug("\n" + "-"*50)
    
    logger.debug(f"\n[USER PROMPT SENT]\n{user_prompt}")
    logger.debug("\n" + "-"*50)

    # Log token usage if available
    if hasattr(response_obj, "usage_metadata"):
        usage = response_obj.usage_metadata
        logger.debug(f"\n[TOKEN USAGE]: Prompt={usage.prompt_token_count}, Candidates={usage.candidates_token_count}, Total={usage.total_token_count}")
    
    logger.debug("\n[COMPLETE RAW RESPONSE]\n" + str(response_obj))
    logger.debug("\n" + "="*100 + "\n")

def log_tool_execution(logger, tool_name, args, result):
    """Log chi tiết tham số đầu vào và kết quả trả về của tool."""
    logger.debug(f"🛠️  [TOOL CALL]: {tool_name}")
    logger.debug(f"   Arguments: {json.dumps(args, ensure_ascii=False) if isinstance(args, dict) else args}")
    logger.debug(f"   Result: {json.dumps(result, ensure_ascii=False, indent=2) if isinstance(result, dict) else result}")
    logger.debug("-" * 50)

def log_logic_transition(logger, stage_name, description, metadata=None):
    """Log quá trình chuyển đổi logic hoặc bước thực hiện lớn."""
    logger.info(f"📍 [TRANSITION] {stage_name}: {description}")
    if metadata:
        logger.debug(f"   Metadata: {json.dumps(metadata, ensure_ascii=False)}")

def log_db_operation(logger, operation, table, criteria=None, data=None):
    """Log thao tác với cơ sở dữ liệu."""
    msg = f"🗄️  [DB {operation.upper()}] Table: {table}"
    if criteria:
        msg += f" | Criteria: {criteria}"
    logger.debug(msg)
    if data:
        logger.debug(f"   Data: {json.dumps(data, ensure_ascii=False) if isinstance(data, dict) else data}")
