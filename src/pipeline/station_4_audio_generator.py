import os
import sys
import asyncio
import importlib

# Ensure the parent directory is in the path
sys.path.append(os.getcwd())

_logger = importlib.import_module('src.shared.logger')
setup_logger = _logger.setup_logger
log_logic_transition = _logger.log_logic_transition
log_db_operation = _logger.log_db_operation
log_environment_info = _logger.log_environment_info

_tts = importlib.import_module('src.shared.api_clients.tts_manager')
TTSManager = _tts.TTSManager

_db = importlib.import_module('src.db.database')
SessionLocal = _db.SessionLocal

_schema = importlib.import_module('src.db.schema')
Storyboard = _schema.Storyboard
Character = _schema.Character
Episode = _schema.Episode

# Logging config
logger = setup_logger("station_4_audio")

async def process_shot(shot_data, tts_manager, semaphore):
    """Xử lý đơn lẻ một shot (Nhận data dạng dict thay vì SQLAlchemy object)."""
    async with semaphore:
        if not shot_data["dialogue"]:
            return None
        
        audio_id = f"aud_sb{shot_data['id']}"
        log_logic_transition(logger, "TTS_START", f"Rendering Shot {shot_data['storyboard_number']}", {"id": audio_id})
        
        # Gọi TTS
        success, result = await tts_manager.render(shot_data["dialogue"], "edge", shot_data["voice_id"], audio_id)
        
        if success:
            filepath = os.path.join(tts_manager.asset_dir, f"{audio_id}.mp3")
            duration = 5
            if os.path.exists(filepath):
                try:
                    from mutagen.mp3 import MP3
                    audio = MP3(filepath)
                    duration = int(audio.info.length) + 1
                except Exception:
                    duration = len(shot_data["dialogue"]) // 10 + 1
            
            return {"id": shot_data["id"], "duration": duration, "audio_url": f"/assets/audio/tts/{audio_id}.mp3"}
        else:
            logger.error(f"❌ TTS Error for {audio_id}: {result}")
            return None

async def run_audio_generator(episode_id: str):
    log_logic_transition(logger, "AGENT_INIT", f"Parallel Audio Generator (Safe Session) for Episode: {episode_id}")
    log_environment_info(logger)
    
    # 1. Đọc dữ liệu và đóng session ngay
    db = SessionLocal()
    try:
        log_db_operation(logger, "query", "Episode", {"id": episode_id})
        episode_record = db.query(Episode).filter(Episode.id == episode_id).first()
        if not episode_record:
            return False

        log_db_operation(logger, "query", "Storyboard", {"episode_id": episode_id})
        storyboards = db.query(Storyboard).filter(Storyboard.episode_id == episode_id).order_by(Storyboard.storyboard_number).all()
        
        # Chuyển data sang dict để dùng sau khi đóng session
        shots_to_process = []
        for sb in storyboards:
            voice_id = "vi-VN-HoaiMyNeural"
            if sb.speaker_id:
                char = db.query(Character).filter(Character.id == sb.speaker_id).first()
                if char and char.voice_style:
                    voice_id = char.voice_style
            
            shots_to_process.append({
                "id": sb.id,
                "storyboard_number": sb.storyboard_number,
                "dialogue": sb.dialogue,
                "voice_id": voice_id
            })
    finally:
        db.close()
        
    if not shots_to_process:
        logger.warning("No storyboards to process.")
        return False

    # 2. Xử lý async (Không chạm vào DB)
    tts_manager = TTSManager()
    semaphore = asyncio.Semaphore(10)
    tasks = [process_shot(s, tts_manager, semaphore) for s in shots_to_process]
    results = await asyncio.gather(*tasks)
    
    # 3. Mở session mới để lưu kết quả
    db = SessionLocal()
    try:
        total_duration = 0
        success_count = 0
        for res in results:
            if res:
                sb_record = db.query(Storyboard).filter(Storyboard.id == res["id"]).first()
                if sb_record:
                    sb_record.duration = res["duration"]
                    sb_record.tts_audio_url = res["audio_url"]
                    total_duration += res["duration"]
                    success_count += 1
        
        ep_record = db.query(Episode).filter(Episode.id == episode_id).first()
        if ep_record:
            ep_record.duration = (total_duration // 60) + 1
            
        db.commit()
        log_logic_transition(logger, "AGENT_COMPLETE", f"Finished station 4. Processed {success_count} shots.")
        logger.info(f"\n✨ [SUMMARY]\nĐã hoàn thành thu âm an toàn. Tổng thời lượng: {ep_record.duration if ep_record else 0} phút.\n")
        return True
    except Exception as e:
        logger.error(f"❌ Error saving results: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        asyncio.run(run_audio_generator(sys.argv[1]))
    else:
        logger.error("Vui lòng cung cấp episode_id.")
