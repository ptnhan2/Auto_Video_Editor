import os
import sys
import json
import re
import uuid
import importlib
from datetime import datetime, timezone
from typing import Any

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


DEFAULT_FPS = 30
DEFAULT_CANVAS_WIDTH = 1920
DEFAULT_CANVAS_HEIGHT = 1080
CURRENT_SCHEMA_VERSION = 10
SUBTITLE_Y_POSITION = 920


def _uid() -> str:
    """Sinh unique ID cho OpenCut element/project."""
    return str(uuid.uuid4())


def _iso_now() -> str:
    """Trả về ISO 8601 timestamp hiện tại (UTC).
    Returns:
        ISO string dạng 2026-06-25T12:00:00.123456Z (valid JS Date parseable).
    """
    now = datetime.now(timezone.utc)
    return now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond:06d}Z"


def _make_transform(
    x: float = 0, y: float = 0, scale: float = 1.0, rotate: float = 0.0,
) -> dict[str, Any]:
    return {"scale": scale, "position": {"x": x, "y": y}, "rotate": rotate}


def _make_subtitle_background() -> dict[str, Any]:
    return {"enabled": True, "color": "#00000080", "cornerRadius": 8, "paddingX": 12, "paddingY": 4}


def build_video_element(
    media_id: str, name: str, start_time: float, duration: float,
    source_duration: float | None = None,
    transition_out: dict[str, Any] | None = None,
    effects: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    return {
        "id": _uid(), "name": name, "duration": duration, "startTime": start_time,
        "trimStart": 0.0, "trimEnd": 0.0, "sourceDuration": source_duration or duration,
        "type": "video", "mediaId": media_id, "muted": False, "hidden": False,
        "playbackRate": 1.0, "transform": _make_transform(), "opacity": 1.0,
        "blendMode": "normal", "transitionOut": transition_out, "crop": None,
        "mask": None, "effects": effects or [],
    }


def build_text_subtitle_element(
    content: str, start_time: float, duration: float,
    word_timings: list[dict[str, Any]] | None = None,
    font_size: int = 48, position_y: float | None = None,
) -> dict[str, Any]:
    y = position_y if position_y is not None else SUBTITLE_Y_POSITION
    return {
        "id": _uid(), "name": f"Sub: {content[:30]}", "duration": duration,
        "startTime": start_time, "trimStart": 0.0, "trimEnd": 0.0,
        "type": "text", "content": content, "fontSize": font_size,
        "fontFamily": "Arial", "color": "#FFFFFF", "highlightColor": "#FFD700",
        "wordTimings": word_timings or [], "wordPopScale": 1.15,
        "background": _make_subtitle_background(), "textAlign": "center",
        "fontWeight": "bold", "fontStyle": "normal", "textDecoration": "none",
        "letterSpacing": 0, "lineHeight": 1.2, "hidden": False,
        "transform": _make_transform(x=DEFAULT_CANVAS_WIDTH / 2, y=y),
        "opacity": 1.0, "blendMode": "normal",
    }


def build_audio_element(
    media_id: str, name: str, start_time: float, duration: float,
    source_duration: float | None = None, volume: float = 1.0,
    source_type: str = "upload", source_url: str | None = None,
) -> dict[str, Any]:
    element: dict[str, Any] = {
        "id": _uid(), "name": name, "duration": duration, "startTime": start_time,
        "trimStart": 0.0, "trimEnd": 0.0, "sourceDuration": source_duration or duration,
        "type": "audio", "sourceType": source_type, "volume": volume,
        "muted": False, "playbackRate": 1.0,
    }
    if source_type == "upload":
        element["mediaId"] = media_id
    else:
        element["sourceUrl"] = source_url
    return element


def build_opencut_project(
    episode_id: str, episode_name: str,
    compiled_scenes: list[dict[str, Any]],
    canvas_width: int = DEFAULT_CANVAS_WIDTH,
    canvas_height: int = DEFAULT_CANVAS_HEIGHT,
    fps: int = DEFAULT_FPS,
) -> dict[str, Any]:
    now_iso = _iso_now()
    project_id = _uid()
    opencut_scenes: list[dict[str, Any]] = []
    total_duration = 0.0

    for scene_idx, scene_data in enumerate(compiled_scenes):
        shots = scene_data.get("shots", [])
        video_elements: list[dict[str, Any]] = []
        dialogue_audio: list[dict[str, Any]] = []
        sfx_audio: list[dict[str, Any]] = []
        subtitle_elements: list[dict[str, Any]] = []
        bgm_elements: list[dict[str, Any]] = []

        scene_start_time = total_duration
        current_time = 0.0

        for shot in shots:
            duration = float(shot.get("durationSeconds", 0))
            if duration <= 0:
                continue

            media_id = f"media-video-{shot.get('shotId', _uid())}"
            video_elements.append(build_video_element(
                media_id=media_id,
                name=f"Shot {shot.get('shotId', '?')}",
                start_time=scene_start_time + current_time,
                duration=duration,
                transition_out=shot.get("opencut_transition"),
                effects=shot.get("opencut_effects", []),
            ))

            bgm_id = shot.get("bgmId")
            if bgm_id and not bgm_elements:
                bgm_elements.append(build_audio_element(
                    media_id=f"media-bgm-{bgm_id}", name=f"BGM: {bgm_id}",
                    start_time=scene_start_time,
                    duration=sum(float(s.get("durationSeconds", 0)) for s in shots),
                    volume=0.3,
                ))

            sfx_id = shot.get("sfxId")
            if sfx_id:
                sfx_audio.append(build_audio_element(
                    media_id=f"media-sfx-{sfx_id}", name=f"SFX: {sfx_id}",
                    start_time=scene_start_time + current_time,
                    duration=duration, volume=0.8,
                ))

            for actor in shot.get("actors", []):
                dialogue = (actor.get("dialogue") or "").strip()
                if not dialogue:
                    continue

                audio_id = actor.get("audioId")
                audio_dur = float(actor.get("audioDuration", duration))
                word_timings = actor.get("wordTimings")

                subtitle_elements.append(build_text_subtitle_element(
                    content=dialogue,
                    start_time=scene_start_time + current_time,
                    duration=audio_dur, word_timings=word_timings,
                ))

                if audio_id:
                    dialogue_audio.append(build_audio_element(
                        media_id=f"media-tts-{audio_id}",
                        name=f"Dialogue: {dialogue[:30]}",
                        start_time=scene_start_time + current_time,
                        duration=audio_dur, volume=1.0,
                    ))

            current_time += duration

        tracks: list[dict[str, Any]] = []
        tracks.append({"id": _uid(), "name": "Main Track", "color": "default", "type": "video", "elements": video_elements, "isMain": True, "muted": False, "hidden": False, "volume": 1.0})

        if dialogue_audio:
            tracks.append({"id": _uid(), "name": "Lời thoại", "color": "green", "type": "audio", "elements": dialogue_audio, "muted": False, "volume": 1.0, "pan": 0})
        if sfx_audio:
            tracks.append({"id": _uid(), "name": "SFX", "color": "orange", "type": "audio", "elements": sfx_audio, "muted": False, "volume": 1.0, "pan": 0})
        if bgm_elements:
            tracks.append({"id": _uid(), "name": "Nhạc nền", "color": "blue", "type": "audio", "elements": bgm_elements, "muted": False, "volume": 1.0, "pan": 0})
        if subtitle_elements:
            tracks.append({"id": _uid(), "name": "Subtitles", "color": "yellow", "type": "text", "elements": subtitle_elements, "hidden": False})

        markers: list[dict[str, Any]] = []
        if scene_idx > 0:
            markers.append({"id": _uid(), "time": total_duration, "note": f"Scene {scene_idx + 1}", "color": "yellow", "createdAt": int(datetime.now(timezone.utc).timestamp() * 1000)})

        scene_duration = current_time
        total_duration += scene_duration

        opencut_scenes.append({"id": _uid(), "name": f"Scene {scene_idx + 1}", "isMain": scene_idx == 0, "tracks": tracks, "bookmarks": [], "markers": markers, "createdAt": now_iso, "updatedAt": now_iso})

    project: dict[str, Any] = {
        "metadata": {"id": project_id, "name": episode_name, "thumbnail": None, "duration": total_duration, "createdAt": now_iso, "updatedAt": now_iso},
        "scenes": opencut_scenes,
        "currentSceneId": opencut_scenes[0]["id"] if opencut_scenes else "",
        "settings": {"fps": fps, "canvasSize": {"width": canvas_width, "height": canvas_height}, "originalCanvasSize": None, "background": {"type": "color", "color": "#000000"}, "proxyEditing": False, "proxyResolution": None},
        "version": CURRENT_SCHEMA_VERSION,
    }
    return project


def save_opencut_project(project: dict[str, Any], output_path: str) -> None:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(project, f, indent=2, ensure_ascii=False)


def _parse_sfx_id(sound_effect):
    if not sound_effect:
        return None
    try:
        return json.loads(sound_effect).get("sfx_id")
    except (json.JSONDecodeError, TypeError):
        return None


def _parse_bgm_id(bgm_prompt):
    if not bgm_prompt:
        return None
    return re.sub(r'[^a-z0-9]+', '_', bgm_prompt.lower().strip()).strip('_') or None


def _extract_audio_id(tts_audio_url):
    if not tts_audio_url:
        return None
    return os.path.splitext(os.path.basename(tts_audio_url))[0]


def compile_episode(episode_id):
    log_logic_transition(logger, "STATION_START", f"Compiling episode: {episode_id}")
    log_environment_info(logger)
    db = SessionLocal()
    try:
        log_db_operation(logger, "query", "Episode", {"id": episode_id})
        episode = db.query(Episode).filter(Episode.id == episode_id).first()
        if not episode:
            return {"error": f"Episode {episode_id} not found"}
        title = episode.title or f"Episode {episode_id}"
        log_db_operation(logger, "query", "Storyboard", {"episode_id": episode_id})
        storyboards = (db.query(Storyboard).options(joinedload(Storyboard.characters)).filter(Storyboard.episode_id == episode_id).order_by(Storyboard.storyboard_number).all())
        if not storyboards:
            return {"error": f"No storyboards found for episode {episode_id}"}
        logger.info(f"Found {len(storyboards)} storyboards")
        scenes, current_scene = [], None
        for sb in storyboards:
            scene_id = sb.scene_id or f"scene_{sb.storyboard_number:03d}"
            if current_scene is None or current_scene["sceneId"] != scene_id:
                if current_scene is not None:
                    scenes.append(current_scene)
                current_scene = {"sceneId": scene_id, "backgroundId": sb.background_id or "bg_transparent", "totalDurationSeconds": 0, "shots": []}
            shot = {
                "shotId": str(sb.id), "durationSeconds": float(sb.duration) if sb.duration and sb.duration >= 0.5 else 5.0,
                "actors": [], "layoutStyle": sb.layout_style if sb.layout_style else None,
                "visualMetaphor": sb.visual_metaphor if sb.visual_metaphor else None,
                "transitionIn": sb.transition_in if sb.transition_in else None,
                "atmosphereFx": sb.atmosphere_fx if sb.atmosphere_fx else None,
                "assetDynamics": sb.asset_dynamics if sb.asset_dynamics else None,
                "camera": {"type": sb.camera_concept} if sb.camera_concept else None,
                "bgmId": _parse_bgm_id(sb.bgm_prompt), "sfxId": _parse_sfx_id(sb.sound_effect), "vfxId": None,
                "opencut_transition": json.loads(sb.opencut_transition) if getattr(sb, "opencut_transition", None) else None,
                "opencut_effects": json.loads(sb.opencut_effects) if getattr(sb, "opencut_effects", None) else [],
            }
            characters = list(sb.characters) if sb.characters else []
            speaking_char_id = sb.speaker_id
            char_states = {}
            if getattr(sb, "character_position", None):
                try:
                    state_list = json.loads(sb.character_position)
                    if isinstance(state_list, list):
                        for state in state_list:
                            if state.get("character_id"):
                                char_states[state["character_id"]] = state
                except Exception:
                    pass
            for char in characters:
                is_speaker = speaking_char_id == char.id
                state = char_states.get(char.id, {})
                actor = {
                    "characterId": char.id, "actionId": state.get("action_id") or sb.action_id or "idle",
                    "expressionId": state.get("expression_tag") or sb.expression_tag or "neutral",
                    "expressionTag": state.get("expression_tag") or sb.expression_tag or "neutral",
                    "facing": state.get("facing") or "left", "position": state.get("position") or "mid_center",
                    "dialogue": sb.dialogue if is_speaker else None,
                    "isSpeaking": is_speaker and bool(sb.dialogue),
                }
                if state.get("movement"):
                    actor["movement"] = state["movement"]
                audio_id = _extract_audio_id(sb.tts_audio_url)
                if audio_id and is_speaker:
                    actor["audioId"] = audio_id
                shot["actors"].append(actor)
            for key in ("layoutStyle", "visualMetaphor", "transitionIn", "atmosphereFx", "assetDynamics", "camera", "bgmId", "sfxId", "vfxId"):
                if shot.get(key) is None:
                    del shot[key]
            current_scene["shots"].append(shot)
            current_scene["totalDurationSeconds"] += shot["durationSeconds"]
        if current_scene is not None:
            scenes.append(current_scene)
        project = build_opencut_project(episode_id, title, scenes)
        output_dir = os.path.join(os.getcwd(), "public", "scripts")
        output_path = os.path.join(output_dir, f"opencut_{episode_id}.json")
        save_opencut_project(project, output_path)
        log_logic_transition(logger, "STATION_COMPLETE", f"Compiled {len(scenes)} scenes to OpenCut v10 project")
        logger.info(f"OpenCut v10 project written to: {output_path}")
        return project
    except Exception as e:
        logger.error(f"Compilation error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        logger.error("Usage: python station_7_video_compiler.py <episode_id>")
        sys.exit(1)
    compile_episode(sys.argv[1])
