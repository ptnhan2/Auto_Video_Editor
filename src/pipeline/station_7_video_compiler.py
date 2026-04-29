import os
import sys
sys.path.append(os.getcwd())

import json
import re
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from src.shared.logger import setup_logger, log_logic_transition, log_db_operation, log_environment_info
from src.db.database import SessionLocal
from src.db.schema import Storyboard, Episode
from sqlalchemy.orm import joinedload

logger = setup_logger("station_7_video_compiler")

CAMERA_CONCEPT_MAP = {
    "micro_macro_zoom": {"type": "zoom_in", "intensity": 1.3},
    "crash_zoom": {"type": "zoom_in", "intensity": 1.5},
    "dolly_zoom_2d": {"type": "zoom_in", "intensity": 1.2},
    "endless_pan": {"type": "pan_right"},
    "whip_pan": {"type": "pan_right", "intensity": 1.5},
    "camera_shake": {"type": "static"},
    "dutch_roll": {"type": "static"},
}


def _parse_camera(camera_concept):
    if not camera_concept:
        return None
    concept_lower = camera_concept.lower().strip()
    if concept_lower in CAMERA_CONCEPT_MAP:
        return dict(CAMERA_CONCEPT_MAP[concept_lower])
    if "zoom" in concept_lower:
        return {"type": "zoom_in", "intensity": 1.2}
    if "pan" in concept_lower:
        return {"type": "pan_right"}
    return None


def _parse_sfx_id(sound_effect):
    if not sound_effect:
        return None
    try:
        data = json.loads(sound_effect)
        return data.get("sfx_id")
    except (json.JSONDecodeError, TypeError):
        return None


def _parse_bgm_id(bgm_prompt):
    if not bgm_prompt:
        return None
    slug = re.sub(r'[^a-z0-9]+', '_', bgm_prompt.lower().strip()).strip('_')
    return slug if slug else None


def _extract_audio_id(tts_audio_url):
    if not tts_audio_url:
        return None
    basename = os.path.basename(tts_audio_url)
    return os.path.splitext(basename)[0]


def compile_episode(episode_id):
    log_logic_transition(logger, "STATION_START", f"Compiling episode: {episode_id}")
    log_environment_info(logger)

    db = SessionLocal()
    try:
        log_db_operation(logger, "query", "Episode", {"id": episode_id})
        episode = db.query(Episode).filter(Episode.id == episode_id).first()
        if not episode:
            error_msg = f"Episode {episode_id} not found"
            logger.error(f"\u274c {error_msg}")
            return {"error": error_msg}

        title = episode.title or f"Episode {episode_id}"

        log_db_operation(logger, "query", "Storyboard", {"episode_id": episode_id})
        storyboards = (
            db.query(Storyboard)
            .options(joinedload(Storyboard.characters))
            .filter(Storyboard.episode_id == episode_id)
            .order_by(Storyboard.storyboard_number)
            .all()
        )

        if not storyboards:
            logger.warning(f"⚠️ No storyboards found for episode {episode_id}")
            return {"error": f"No storyboards found for episode {episode_id}"}

        logger.info(f"📊 Found {len(storyboards)} storyboards")

        scenes = []
        current_scene = None

        for sb in storyboards:
            scene_id = sb.scene_id or f"scene_{sb.storyboard_number:03d}"

            if current_scene is None or current_scene["sceneId"] != scene_id:
                if current_scene is not None:
                    scenes.append(current_scene)

                current_scene = {
                    "sceneId": scene_id,
                    "backgroundId": sb.background_id or "bg_transparent",
                    "durationSeconds": sb.duration or 5,
                    "actors": [],
                    "bgmId": _parse_bgm_id(sb.bgm_prompt),
                    "sfxId": _parse_sfx_id(sb.sound_effect),
                    "camera": _parse_camera(sb.camera_concept),
                }

            characters = list(sb.characters) if sb.characters else []
            speaking_char_id = sb.speaker_id

            for char in characters:
                is_speaker = speaking_char_id == char.id
                dialogue_text = sb.dialogue if is_speaker else None

                actor = {
                    "characterId": char.id,
                    "actionId": sb.action_id or "idle",
                    "expressionId": sb.expression_tag or "neutral",
                    "expressionTag": sb.expression_tag or "neutral",
                    "facing": "left",
                    "position": "mid_center",
                    "dialogue": dialogue_text,
                    "isSpeaking": is_speaker and bool(sb.dialogue),
                }

                audio_id = _extract_audio_id(sb.tts_audio_url)
                if audio_id and is_speaker:
                    actor["audioId"] = audio_id

                current_scene["actors"].append(actor)

            if sb.duration and sb.duration > current_scene["durationSeconds"]:
                current_scene["durationSeconds"] = sb.duration

            if not current_scene["bgmId"]:
                current_scene["bgmId"] = _parse_bgm_id(sb.bgm_prompt)
            if not current_scene["sfxId"]:
                current_scene["sfxId"] = _parse_sfx_id(sb.sound_effect)
            if not current_scene["camera"]:
                current_scene["camera"] = _parse_camera(sb.camera_concept)

        if current_scene is not None:
            scenes.append(current_scene)

        for sc in scenes:
            for key in ("bgmId", "sfxId", "camera"):
                if sc.get(key) is None:
                    del sc[key]

        result = {
            "title": title,
            "scenes": scenes,
        }

        output_dir = os.path.join(os.getcwd(), "public", "scripts")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"compiled_{episode_id}.json")

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        log_logic_transition(logger, "STATION_COMPLETE", f"Compiled {len(scenes)} scenes to {output_path}")
        logger.info(f"✅ Output written to: {output_path}")

        return result

    except Exception as e:
        logger.error(f"❌ Compilation error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        logger.error("Usage: python station_7_video_compiler.py <episode_id>")
        sys.exit(1)
    compile_episode(sys.argv[1])
