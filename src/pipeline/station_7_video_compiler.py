import os
import sys
import json
import re
import importlib

from sqlalchemy.orm import joinedload

sys.path.append(os.getcwd())

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

_logger = importlib.import_module('src.shared.logger')
setup_logger = _logger.setup_logger
log_logic_transition = _logger.log_logic_transition
log_db_operation = _logger.log_db_operation
log_environment_info = _logger.log_environment_info

_db = importlib.import_module('src.db.database')
SessionLocal = _db.SessionLocal

_schema = importlib.import_module('src.db.schema')
Storyboard = _schema.Storyboard
Episode = _schema.Episode

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
                    "totalDurationSeconds": 0,
                    "shots": []
                }

            shot = {
                "shotId": str(sb.id),
                "durationSeconds": float(sb.duration) if sb.duration and sb.duration >= 0.5 else 5.0,
                "actors": [],
                "layoutStyle": sb.layout_style if sb.layout_style else None,
                "visualMetaphor": sb.visual_metaphor if sb.visual_metaphor else None,
                "transitionIn": sb.transition_in if sb.transition_in else None,
                "atmosphereFx": sb.atmosphere_fx if sb.atmosphere_fx else None,
                "assetDynamics": sb.asset_dynamics if sb.asset_dynamics else None,
                "camera": _parse_camera(sb.camera_concept),
                "bgmId": _parse_bgm_id(sb.bgm_prompt),
                "sfxId": _parse_sfx_id(sb.sound_effect),
                "vfxId": None  # Expand later if vfx is extracted
            }

            characters = list(sb.characters) if sb.characters else []
            speaking_char_id = sb.speaker_id

            # Phân tích character_position từ DB
            char_states = {}
            if getattr(sb, "character_position", None):
                try:
                    state_list = json.loads(sb.character_position)
                    if isinstance(state_list, list):
                        for state in state_list:
                            char_id = state.get("character_id")
                            if char_id:
                                char_states[char_id] = state
                except Exception as e:
                    logger.warning(f"Failed to parse character_position JSON for storyboard {sb.id}: {e}")

            for char in characters:
                is_speaker = speaking_char_id == char.id
                dialogue_text = sb.dialogue if is_speaker else None
                
                # Áp dụng trạng thái cụ thể của nhân vật nếu có
                state = char_states.get(char.id, {})

                actor = {
                    "characterId": char.id,
                    "actionId": state.get("action_id") or sb.action_id or "idle",
                    "expressionId": state.get("expression_tag") or sb.expression_tag or "neutral",
                    "expressionTag": state.get("expression_tag") or sb.expression_tag or "neutral",
                    "facing": state.get("facing") or "left",
                    "position": state.get("position") or "mid_center",
                    "dialogue": dialogue_text,
                    "isSpeaking": is_speaker and bool(sb.dialogue),
                }

                if state.get("movement"):
                    actor["movement"] = state["movement"]

                audio_id = _extract_audio_id(sb.tts_audio_url)
                if audio_id and is_speaker:
                    actor["audioId"] = audio_id

                shot["actors"].append(actor)

            # Cleanup None keys in shot to match Zod optional/nullable nicely
            for key in ("layoutStyle", "visualMetaphor", "transitionIn", "atmosphereFx", "assetDynamics", "camera", "bgmId", "sfxId", "vfxId"):
                if shot.get(key) is None:
                    del shot[key]

            current_scene["shots"].append(shot)
            current_scene["totalDurationSeconds"] += shot["durationSeconds"]

        if current_scene is not None:
            scenes.append(current_scene)

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

        # Cập nhật danh sách file cho Remotion Studio
        try:
            scripts = [f for f in os.listdir(output_dir) if f.endswith(".json") and os.path.getsize(os.path.join(output_dir, f)) > 10]
            anim_dir = os.path.join(os.getcwd(), "public", "animations")
            anims = [f for f in os.listdir(anim_dir) if f.endswith(".json")] if os.path.exists(anim_dir) else []
            char_dir = os.path.join(os.getcwd(), "public", "assets", "humanoid")
            chars = [d for d in os.listdir(char_dir) if os.path.isdir(os.path.join(char_dir, d))] if os.path.exists(char_dir) else []
            
            gen_content = f"// Generated by station_7_video_compiler.py\n"
            gen_content += f"export const scriptFiles: string[] = {json.dumps(scripts, indent=2)};\n"
            gen_content += f"export const actionFiles: string[] = {json.dumps(anims, indent=2)};\n"
            gen_content += f"export const characterFolders: string[] = {json.dumps(chars, indent=2)};\n"
            
            gen_path = os.path.join(os.getcwd(), "remotion", "_generated-files.ts")
            with open(gen_path, "w", encoding="utf-8") as f:
                f.write(gen_content)
        except Exception as e:
            logger.warning(f"Failed to generate remotion/_generated-files.ts: {e}")

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
