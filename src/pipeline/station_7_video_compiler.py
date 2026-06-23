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


# ── OpenCut v10 Builder Constants ────────────────────────────────────

DEFAULT_FPS = 30
DEFAULT_CANVAS_WIDTH = 1920
DEFAULT_CANVAS_HEIGHT = 1080
CURRENT_SCHEMA_VERSION = 10
SUBTITLE_Y_POSITION = 920  # Vị trí Y mặc định cho subtitle


# ── OpenCut v10 Helpers ──────────────────────────────────────────────

def _uid() -> str:
    """Sinh unique ID ngắn gọn để dễ đọc log.

    Returns:
        String 8 ký tự hex từ UUID4.
    """
    return str(uuid.uuid4())[:8]


def _iso_now() -> str:
    """Trả về ISO 8601 timestamp hiện tại (UTC).

    Returns:
        ISO 8601 string format "2026-06-23T12:00:00.000Z".
    """
    return datetime.now(timezone.utc).isoformat().replace("+00:00", ".000Z")


def _make_transform(
    x: float = 0, y: float = 0, scale: float = 1.0, rotate: float = 0.0,
) -> dict[str, Any]:
    """Tạo Transform object cho OpenCut element.

    Args:
        x: Vị trí X (pixel, gốc top-left).
        y: Vị trí Y (pixel, gốc top-left).
        scale: Tỉ lệ phóng to/thu nhỏ (default 1.0).
        rotate: Góc xoay (degree, default 0.0).

    Returns:
        Transform dict {"scale": float, "position": {"x": float, "y": float}, "rotate": float}.
    """
    return {
        "scale": scale,
        "position": {"x": x, "y": y},
        "rotate": rotate,
    }


def _make_subtitle_background() -> dict[str, Any]:
    """Tạo TextBackground mặc định cho subtitle.

    Returns:
        TextBackground dict với nền đen bán trong suốt, bo góc 8px.
    """
    return {
        "enabled": True,
        "color": "#00000080",
        "cornerRadius": 8,
        "paddingX": 12,
        "paddingY": 4,
    }


# ── OpenCut v10 Element Builders ─────────────────────────────────────

def build_video_element(
    media_id: str,
    name: str,
    start_time: float,
    duration: float,
    source_duration: float | None = None,
    transition_out: dict[str, Any] | None = None,
    effects: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Tạo VideoElement cho OpenCut video track.

    Args:
        media_id: ID của media asset trong storage.
        name: Tên hiển thị trên timeline.
        start_time: Vị trí bắt đầu trên timeline (seconds).
        duration: Độ dài hiển thị (seconds).
        source_duration: Độ dài file gốc (seconds). Nếu không có, dùng duration.
        transition_out: TransitionData dict hoặc None.
        effects: Danh sách Effect dict hoặc None.

    Returns:
        VideoElement dict tương thích với OpenCut v10 schema.
    """
    return {
        "id": _uid(),
        "name": name,
        "duration": duration,
        "startTime": start_time,
        "trimStart": 0.0,
        "trimEnd": 0.0,
        "sourceDuration": source_duration or duration,
        "type": "video",
        "mediaId": media_id,
        "muted": False,
        "hidden": False,
        "playbackRate": 1.0,
        "transform": _make_transform(),
        "opacity": 1.0,
        "blendMode": "normal",
        "transitionOut": transition_out,
        "crop": None,
        "mask": None,
        "effects": effects or [],
    }


def build_text_subtitle_element(
    content: str,
    start_time: float,
    duration: float,
    word_timings: list[dict[str, Any]] | None = None,
    font_size: int = 48,
    position_y: float | None = None,
) -> dict[str, Any]:
    """Tạo TextElement cho OpenCut text track (subtitle).

    Args:
        content: Nội dung subtitle.
        start_time: Vị trí bắt đầu (seconds absolute trên timeline).
        duration: Độ dài hiển thị (seconds).
        word_timings: Danh sách word timing cho karaoke highlight.
        font_size: Cỡ chữ (px).
        position_y: Vị trí Y (px). Default là SUBTITLE_Y_POSITION.

    Returns:
        TextElement dict tương thích với OpenCut v10 schema.
    """
    y = position_y if position_y is not None else SUBTITLE_Y_POSITION
    return {
        "id": _uid(),
        "name": f"Sub: {content[:30]}",
        "duration": duration,
        "startTime": start_time,
        "trimStart": 0.0,
        "trimEnd": 0.0,
        "type": "text",
        "content": content,
        "fontSize": font_size,
        "fontFamily": "Arial",
        "color": "#FFFFFF",
        "highlightColor": "#FFD700",
        "wordTimings": word_timings or [],
        "wordPopScale": 1.15,
        "background": _make_subtitle_background(),
        "textAlign": "center",
        "fontWeight": "bold",
        "fontStyle": "normal",
        "textDecoration": "none",
        "letterSpacing": 0,
        "lineHeight": 1.2,
        "hidden": False,
        "transform": _make_transform(x=DEFAULT_CANVAS_WIDTH / 2, y=y),
        "opacity": 1.0,
        "blendMode": "normal",
    }


def build_audio_element(
    media_id: str,
    name: str,
    start_time: float,
    duration: float,
    source_duration: float | None = None,
    volume: float = 1.0,
    source_type: str = "upload",
    source_url: str | None = None,
) -> dict[str, Any]:
    """Tạo AudioElement cho OpenCut audio track.

    Args:
        media_id: ID của media asset (cho sourceType="upload").
        name: Tên hiển thị.
        start_time: Vị trí trên timeline (seconds).
        duration: Độ dài (seconds).
        source_duration: Độ dài file gốc.
        volume: Âm lượng (0.0 - 2.0).
        source_type: "upload" hoặc "library".
        source_url: URL cho library source.

    Returns:
        AudioElement dict tương thích với OpenCut v10 schema.
    """
    element: dict[str, Any] = {
        "id": _uid(),
        "name": name,
        "duration": duration,
        "startTime": start_time,
        "trimStart": 0.0,
        "trimEnd": 0.0,
        "sourceDuration": source_duration or duration,
        "type": "audio",
        "sourceType": source_type,
        "volume": volume,
        "muted": False,
        "playbackRate": 1.0,
    }
    if source_type == "upload":
        element["mediaId"] = media_id
    else:
        element["sourceUrl"] = source_url
    return element


# ── OpenCut v10 Project Assembler ────────────────────────────────────

def build_opencut_project(
    episode_id: str,
    episode_name: str,
    compiled_scenes: list[dict[str, Any]],
    canvas_width: int = DEFAULT_CANVAS_WIDTH,
    canvas_height: int = DEFAULT_CANVAS_HEIGHT,
    fps: int = DEFAULT_FPS,
) -> dict[str, Any]:
    """Xây dựng SerializedProject JSON từ dữ liệu scene đã compile.

    Nhận output của S7 compiler (VideoScriptData.scenes) và chuyển đổi
    sang định dạng OpenCut-AI v10 project. KHÔNG mapping — dùng trực tiếp
    opencut_transition và opencut_effects từ DB.

    Args:
        episode_id: Episode ID để sinh project ID.
        episode_name: Tên project hiển thị.
        compiled_scenes: Danh sách SceneData từ pipeline.
        canvas_width: Chiều rộng canvas (default 1920).
        canvas_height: Chiều cao canvas (default 1080).
        fps: Frame rate (default 30).

    Returns:
        SerializedProject dict sẵn sàng serialize ra JSON.

    Side Effects: Không có (pure function).
    """
    now_iso = _iso_now()
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

            # ── Video element cho shot ──
            media_id = f"media-video-{shot.get('shotId', _uid())}"

            # Dùng trực tiếp opencut_transition từ DB — KHÔNG mapping
            transition_out = shot.get("opencut_transition")

            # Dùng trực tiếp opencut_effects từ DB — KHÔNG mapping
            shot_effects = shot.get("opencut_effects", [])

            video_elements.append(build_video_element(
                media_id=media_id,
                name=f"Shot {shot.get('shotId', '?')}",
                start_time=scene_start_time + current_time,
                duration=duration,
                transition_out=transition_out,
                effects=shot_effects,
            ))

            # ── Audio: BGM (chỉ thêm 1 lần cho cả scene) ──
            bgm_id = shot.get("bgmId")
            if bgm_id and not bgm_elements:
                bgm_elements.append(build_audio_element(
                    media_id=f"media-bgm-{bgm_id}",
                    name=f"BGM: {bgm_id}",
                    start_time=scene_start_time,
                    duration=sum(
                        float(s.get("durationSeconds", 0)) for s in shots
                    ),
                    volume=0.3,
                ))

            # ── Audio: SFX ──
            sfx_id = shot.get("sfxId")
            if sfx_id:
                sfx_audio.append(build_audio_element(
                    media_id=f"media-sfx-{sfx_id}",
                    name=f"SFX: {sfx_id}",
                    start_time=scene_start_time + current_time,
                    duration=duration,
                    volume=0.8,
                ))

            # ── Subtitle & Dialogue audio từ mỗi actor ──
            for actor in shot.get("actors", []):
                dialogue = actor.get("dialogue", "").strip()
                if not dialogue:
                    continue

                audio_id = actor.get("audioId")
                audio_dur = float(actor.get("audioDuration", duration))
                word_timings = actor.get("wordTimings")

                # Subtitle
                subtitle_elements.append(build_text_subtitle_element(
                    content=dialogue,
                    start_time=scene_start_time + current_time,
                    duration=audio_dur,
                    word_timings=word_timings,
                ))

                # Dialogue audio
                if audio_id:
                    dialogue_audio.append(build_audio_element(
                        media_id=f"media-tts-{audio_id}",
                        name=f"Dialogue: {dialogue[:30]}",
                        start_time=scene_start_time + current_time,
                        duration=audio_dur,
                        volume=1.0,
                    ))

            current_time += duration

        # ── Dựng tracks cho scene ──
        tracks: list[dict[str, Any]] = []

        # Video track (main)
        tracks.append({
            "id": _uid(),
            "name": "Main Track",
            "color": "default",
            "type": "video",
            "elements": video_elements,
            "isMain": True,
            "muted": False,
            "hidden": False,
            "volume": 1.0,
        })

        # Audio track: dialogue
        if dialogue_audio:
            tracks.append({
                "id": _uid(),
                "name": "Lời thoại",
                "color": "green",
                "type": "audio",
                "elements": dialogue_audio,
                "muted": False,
                "volume": 1.0,
                "pan": 0,
            })

        # Audio track: SFX
        if sfx_audio:
            tracks.append({
                "id": _uid(),
                "name": "SFX",
                "color": "orange",
                "type": "audio",
                "elements": sfx_audio,
                "muted": False,
                "volume": 1.0,
                "pan": 0,
            })

        # Audio track: BGM
        if bgm_elements:
            tracks.append({
                "id": _uid(),
                "name": "Nhạc nền",
                "color": "blue",
                "type": "audio",
                "elements": bgm_elements,
                "muted": False,
                "volume": 1.0,
                "pan": 0,
            })

        # Text track: subtitle
        if subtitle_elements:
            tracks.append({
                "id": _uid(),
                "name": "Subtitles",
                "color": "yellow",
                "type": "text",
                "elements": subtitle_elements,
                "hidden": False,
            })

        # Scene markers tại mỗi scene boundary
        markers: list[dict[str, Any]] = []
        if scene_idx > 0:
            markers.append({
                "id": _uid(),
                "time": total_duration,
                "note": f"Scene {scene_idx + 1}",
                "color": "yellow",
                "createdAt": int(datetime.now(timezone.utc).timestamp() * 1000),
            })

        scene_duration = current_time
        total_duration += scene_duration

        opencut_scenes.append({
            "id": scene_data.get("sceneId", _uid()),
            "name": f"Scene {scene_idx + 1}",
            "isMain": scene_idx == 0,
            "tracks": tracks,
            "bookmarks": [],
            "markers": markers,
            "createdAt": now_iso,
            "updatedAt": now_iso,
        })

    # ── Dựng TProject ──
    project: dict[str, Any] = {
        "metadata": {
            "id": _uid(),
            "name": episode_name,
            "thumbnail": None,
            "duration": total_duration,
            "createdAt": now_iso,
            "updatedAt": now_iso,
        },
        "scenes": opencut_scenes,
        "currentSceneId": opencut_scenes[0]["id"] if opencut_scenes else "",
        "settings": {
            "fps": fps,
            "canvasSize": {"width": canvas_width, "height": canvas_height},
            "originalCanvasSize": None,
            "background": {"type": "color", "color": "#000000"},
            "proxyEditing": False,
            "proxyResolution": None,
        },
        "version": CURRENT_SCHEMA_VERSION,
    }

    return project


def save_opencut_project(
    project: dict[str, Any],
    output_path: str,
) -> None:
    """Ghi project ra file JSON với định dạng đẹp.

    Args:
        project: SerializedProject dict từ build_opencut_project().
        output_path: Đường dẫn file output (vd: public/scripts/opencut_{id}.json).

    Side Effects:
        Ghi file JSON ra disk. Ghi đè nếu file đã tồn tại.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(project, f, indent=2, ensure_ascii=False)


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
            logger.warning(f"âš ï¸ No storyboards found for episode {episode_id}")
            return {"error": f"No storyboards found for episode {episode_id}"}

        logger.info(f"ðŸ“Š Found {len(storyboards)} storyboards")

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
                "camera": {"type": sb.camera_concept} if sb.camera_concept else None,
                "bgmId": _parse_bgm_id(sb.bgm_prompt),
                "sfxId": _parse_sfx_id(sb.sound_effect),
                "vfxId": None,  # Expand later if vfx is extracted
                "opencut_transition": json.loads(sb.opencut_transition) if getattr(sb, "opencut_transition", None) else None,
                "opencut_effects": json.loads(sb.opencut_effects) if getattr(sb, "opencut_effects", None) else [],
            }

            characters = list(sb.characters) if sb.characters else []
            speaking_char_id = sb.speaker_id

            # PhÃ¢n tÃ­ch character_position tá»« DB
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
                
                # Ãp dá»¥ng tráº¡ng thÃ¡i cá»¥ thá»ƒ cá»§a nhÃ¢n váº­t náº¿u cÃ³
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

        # ── Dựng OpenCut v10 Project JSON trực tiếp từ scenes ──
        project = build_opencut_project(episode_id, title, scenes)
        output_dir = os.path.join(os.getcwd(), "public", "scripts")
        output_path = os.path.join(output_dir, f"opencut_{episode_id}.json")
        save_opencut_project(project, output_path)

        log_logic_transition(logger, "STATION_COMPLETE",
            f"Compiled {len(scenes)} scenes to OpenCut v10 project: {output_path}")
        logger.info(f"\u2705 OpenCut v10 project written to: {output_path}")

        return project

    except Exception as e:
        logger.error(f"âŒ Compilation error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        logger.error("Usage: python station_7_video_compiler.py <episode_id>")
        sys.exit(1)
    compile_episode(sys.argv[1])
