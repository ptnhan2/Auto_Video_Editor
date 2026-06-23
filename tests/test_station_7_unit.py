"""Unit tests for OpenCut v10 assembler — Issue #200.

Verifies:
- build_opencut_project() tạo JSON có version: 10
- Video track chứa VideoElement với mediaId, startTime, duration đúng
- Audio track "Lời thoại" có AudioElement với volume: 1.0
- Audio track "SFX" có AudioElement với volume: 0.8
- Audio track "Nhạc nền" có AudioElement với volume: 0.3
- Text track "Subtitles" có TextElement với content và transform
- transitionOut lấy từ opencut_transition JSON column
- effects lấy từ opencut_effects JSON column
- Scene marker được tạo tại scene boundary
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402, F401

from src.pipeline.station_7_video_compiler import (  # noqa: E402
    build_opencut_project,
    build_video_element,
    build_audio_element,
    build_text_subtitle_element,
    save_opencut_project,
    _uid,
    _iso_now,
    _make_transform,
    DEFAULT_CANVAS_WIDTH,
)


# ── Helpers ───────────────────────────────────────────────────────────

def _make_shot(overrides=None):
    """Tạo shot dict mẫu để test builder."""
    base = {
        "shotId": "shot_001",
        "durationSeconds": 5.0,
        "actors": [],
        "bgmId": None,
        "sfxId": None,
        "opencut_transition": None,
        "opencut_effects": [],
    }
    if overrides:
        base.update(overrides)
    return base


def _make_scene(scene_id="scene_001", shots=None, scene_idx=0):
    """Tạo scene dict mẫu để test builder."""
    return {
        "sceneId": scene_id,
        "backgroundId": "bg_transparent",
        "totalDurationSeconds": sum(
            float(s.get("durationSeconds", 0)) for s in (shots or [])
        ),
        "shots": shots or [],
    }


# ── AC1: build_opencut_project() tạo JSON có version: 10 ──────────────

def test_build_opencut_project_has_version_10():
    """AC1: Root project JSON phải có 'version': 10."""
    scenes = [_make_scene(shots=[_make_shot()])]
    project = build_opencut_project("ep_001", "Test Episode", scenes)
    assert project["version"] == 10, f"Expected version 10, got {project['version']}"
    assert "metadata" in project
    assert "scenes" in project
    assert "settings" in project


# ── AC2: Video track chứa VideoElement với mediaId, startTime, duration ─

def test_video_track_contains_video_element():
    """AC2: Video track có VideoElement với mediaId, startTime, duration đúng."""
    scenes = [_make_scene(shots=[_make_shot({"durationSeconds": 5.0})])]
    project = build_opencut_project("ep_001", "Test Episode", scenes)

    video_track = project["scenes"][0]["tracks"][0]
    assert video_track["type"] == "video"
    assert video_track["isMain"] is True

    video_elem = video_track["elements"][0]
    assert video_elem["type"] == "video"
    assert "mediaId" in video_elem, "VideoElement must have mediaId"
    assert video_elem["startTime"] == 0.0
    assert video_elem["duration"] == 5.0


# ── AC3: Audio track "Lời thoại" có AudioElement với volume: 1.0 ───────

def test_dialogue_track_has_volume_1():
    """AC3: Audio track 'Lời thoại' có AudioElement với volume: 1.0."""
    shot = _make_shot({
        "actors": [{
            "characterId": "char_001",
            "dialogue": "Xin chào!",
            "audioId": "tts_001",
            "audioDuration": 3.0,
            "isSpeaking": True,
        }],
    })
    scenes = [_make_scene(shots=[shot])]
    project = build_opencut_project("ep_001", "Test Episode", scenes)

    dialogue_track = None
    for track in project["scenes"][0]["tracks"]:
        if track["name"] == "Lời thoại":
            dialogue_track = track
            break

    assert dialogue_track is not None, "Must have 'Lời thoại' audio track"
    assert dialogue_track["type"] == "audio"

    dialogue_elem = dialogue_track["elements"][0]
    assert dialogue_elem["volume"] == 1.0, (
        f"Dialogue volume must be 1.0, got {dialogue_elem['volume']}"
    )
    assert dialogue_elem["type"] == "audio"


# ── AC4: Audio track "SFX" có AudioElement với volume: 0.8 ─────────────

def test_sfx_track_has_volume_0_8():
    """AC4: Audio track 'SFX' có AudioElement với volume: 0.8."""
    shot = _make_shot({
        "sfxId": "sfx_whoosh",
        "durationSeconds": 5.0,
    })
    scenes = [_make_scene(shots=[shot])]
    project = build_opencut_project("ep_001", "Test Episode", scenes)

    sfx_track = None
    for track in project["scenes"][0]["tracks"]:
        if track["name"] == "SFX":
            sfx_track = track
            break

    assert sfx_track is not None, "Must have 'SFX' audio track"
    assert sfx_track["type"] == "audio"

    sfx_elem = sfx_track["elements"][0]
    assert sfx_elem["volume"] == 0.8, (
        f"SFX volume must be 0.8, got {sfx_elem['volume']}"
    )


# ── AC5: Audio track "Nhạc nền" có AudioElement với volume: 0.3 ────────

def test_bgm_track_has_volume_0_3():
    """AC5: Audio track 'Nhạc nền' có AudioElement với volume: 0.3."""
    shot = _make_shot({
        "bgmId": "bgm_ambient",
        "durationSeconds": 5.0,
    })
    scenes = [_make_scene(shots=[shot])]
    project = build_opencut_project("ep_001", "Test Episode", scenes)

    bgm_track = None
    for track in project["scenes"][0]["tracks"]:
        if track["name"] == "Nhạc nền":
            bgm_track = track
            break

    assert bgm_track is not None, "Must have 'Nhạc nền' audio track"
    assert bgm_track["type"] == "audio"

    bgm_elem = bgm_track["elements"][0]
    assert bgm_elem["volume"] == 0.3, (
        f"BGM volume must be 0.3, got {bgm_elem['volume']}"
    )


# ── AC6: Text track "Subtitles" có TextElement với content và transform ─

def test_subtitle_track_has_text_element_with_content_and_transform():
    """AC6: Text track 'Subtitles' có TextElement với content và transform."""
    shot = _make_shot({
        "actors": [{
            "characterId": "char_001",
            "dialogue": "Xin chào, hôm nay trời đẹp!",
            "audioId": "tts_001",
            "audioDuration": 3.5,
            "isSpeaking": True,
        }],
    })
    scenes = [_make_scene(shots=[shot])]
    project = build_opencut_project("ep_001", "Test Episode", scenes)

    text_track = None
    for track in project["scenes"][0]["tracks"]:
        if track["name"] == "Subtitles":
            text_track = track
            break

    assert text_track is not None, "Must have 'Subtitles' text track"
    assert text_track["type"] == "text"

    text_elem = text_track["elements"][0]
    assert text_elem["type"] == "text"
    assert text_elem["content"] == "Xin chào, hôm nay trời đẹp!"
    assert "transform" in text_elem, "TextElement must have transform"
    assert text_elem["transform"]["position"]["x"] == DEFAULT_CANVAS_WIDTH / 2
    assert text_elem["transform"]["position"]["y"] == 920  # SUBTITLE_Y_POSITION


# ── AC7: transitionOut lấy từ opencut_transition JSON column ───────────

def test_transition_out_from_opencut_transition_column():
    """AC7: transitionOut được lấy trực tiếp từ opencut_transition JSON."""
    shot = _make_shot({
        "opencut_transition": {"type": "cross-dissolve", "duration": 0.5},
    })
    scenes = [_make_scene(shots=[shot])]
    project = build_opencut_project("ep_001", "Test Episode", scenes)

    video_elem = project["scenes"][0]["tracks"][0]["elements"][0]
    assert video_elem["transitionOut"] is not None
    assert video_elem["transitionOut"]["type"] == "cross-dissolve"
    assert video_elem["transitionOut"]["duration"] == 0.5


# ── AC8: effects lấy từ opencut_effects JSON column ────────────────────

def test_effects_from_opencut_effects_column():
    """AC8: effects được lấy trực tiếp từ opencut_effects JSON."""
    shot = _make_shot({
        "opencut_effects": [
            {"type": "zoom", "intensity": 1.5},
            {"type": "grain", "intensity": 0.3},
        ],
    })
    scenes = [_make_scene(shots=[shot])]
    project = build_opencut_project("ep_001", "Test Episode", scenes)

    video_elem = project["scenes"][0]["tracks"][0]["elements"][0]
    assert len(video_elem["effects"]) == 2
    assert video_elem["effects"][0]["type"] == "zoom"
    assert video_elem["effects"][0]["intensity"] == 1.5
    assert video_elem["effects"][1]["type"] == "grain"
    assert video_elem["effects"][1]["intensity"] == 0.3


# ── AC9: Scene marker tại scene boundary ──────────────────────────────

def test_scene_marker_at_scene_boundary():
    """AC9: Scene marker được tạo tại mỗi scene boundary (scene idx > 0)."""
    scene1 = _make_scene(
        scene_id="scene_001",
        shots=[_make_shot({"durationSeconds": 10.0})],
    )
    scene2 = _make_scene(
        scene_id="scene_002",
        shots=[_make_shot({"durationSeconds": 5.0, "shotId": "shot_002"})],
    )
    project = build_opencut_project("ep_001", "Test Episode", [scene1, scene2])

    # Scene 1 (idx=0) không có marker
    markers_scene1 = project["scenes"][0].get("markers", [])
    assert len(markers_scene1) == 0, "First scene should not have boundary marker"

    # Scene 2 (idx=1) có marker tại thời điểm bắt đầu scene (total_duration của scene trước)
    markers_scene2 = project["scenes"][1].get("markers", [])
    assert len(markers_scene2) == 1, "Second scene must have boundary marker"
    marker = markers_scene2[0]
    assert marker["time"] == 10.0, (
        f"Marker time should be scene1 duration (10.0), got {marker['time']}"
    )
    assert marker["color"] == "yellow"
    assert "Scene 2" in marker["note"]


# ── Builder unit tests ────────────────────────────────────────────────

def test_uid_is_unique_hex_string():
    """_uid() returns unique 8-char hex strings."""
    ids = {_uid() for _ in range(100)}
    assert len(ids) == 100, "All 100 calls should produce unique IDs"
    for uid in ids:
        assert len(uid) == 8
        int(uid, 16)  # Must be valid hex


def test_iso_now_format():
    """_iso_now() returns ISO 8601 string ending with .000Z."""
    ts = _iso_now()
    assert ts.endswith(".000Z"), f"Expected .000Z suffix, got: {ts}"
    assert "T" in ts, "ISO 8601 must contain T separator"


def test_make_transform_defaults():
    """_make_transform() with no args returns default transform."""
    t = _make_transform()
    assert t["scale"] == 1.0
    assert t["position"] == {"x": 0, "y": 0}
    assert t["rotate"] == 0


def test_make_transform_custom_values():
    """_make_transform() with custom position, scale, rotate."""
    t = _make_transform(x=320, y=540, scale=1.5, rotate=45)
    assert t["scale"] == 1.5
    assert t["position"] == {"x": 320, "y": 540}
    assert t["rotate"] == 45


def test_build_video_element_minimal():
    """build_video_element() with required fields only."""
    elem = build_video_element("media_001", "Test Shot", 0.0, 10.0)
    assert elem["type"] == "video"
    assert elem["mediaId"] == "media_001"
    assert elem["startTime"] == 0.0
    assert elem["duration"] == 10.0
    assert elem["transitionOut"] is None
    assert elem["effects"] == []


def test_build_video_element_with_transition_and_effects():
    """build_video_element() with transitionOut and effects."""
    elem = build_video_element(
        "media_001", "Test Shot", 2.0, 8.0,
        transition_out={"type": "page-peel", "duration": 0.5},
        effects=[{"type": "grain", "intensity": 0.3}],
    )
    assert elem["transitionOut"] == {"type": "page-peel", "duration": 0.5}
    assert elem["effects"] == [{"type": "grain", "intensity": 0.3}]


def test_build_audio_element_upload():
    """build_audio_element() with source_type='upload' includes mediaId."""
    elem = build_audio_element("media_bgm", "BGM", 0.0, 30.0, volume=0.3)
    assert elem["type"] == "audio"
    assert elem["sourceType"] == "upload"
    assert elem["mediaId"] == "media_bgm"
    assert elem["volume"] == 0.3
    assert "sourceUrl" not in elem


def test_build_audio_element_library():
    """build_audio_element() with source_type='library' includes sourceUrl."""
    elem = build_audio_element(
        "lib_001", "Library Track", 0.0, 5.0,
        source_type="library", source_url="https://example.com/audio.mp3",
    )
    assert elem["sourceType"] == "library"
    assert elem["sourceUrl"] == "https://example.com/audio.mp3"
    assert "mediaId" not in elem


def test_build_text_subtitle_element():
    """build_text_subtitle_element() returns proper TextElement."""
    elem = build_text_subtitle_element(
        "Hello world!", 2.0, 3.5,
        word_timings=[{"word": "Hello", "start": 0.0, "end": 0.5}],
        font_size=60,
    )
    assert elem["type"] == "text"
    assert elem["content"] == "Hello world!"
    assert elem["startTime"] == 2.0
    assert elem["duration"] == 3.5
    assert elem["fontSize"] == 60
    assert elem["wordTimings"] == [{"word": "Hello", "start": 0.0, "end": 0.5}]
    assert elem["transform"]["position"]["x"] == 960
    assert elem["transform"]["position"]["y"] == 920


def test_save_opencut_project_writes_file(tmp_path):
    """save_opencut_project() writes valid JSON to disk."""
    project = {"version": 10, "test": True}
    output = tmp_path / "test_project.json"
    save_opencut_project(project, str(output))

    assert output.exists()
    with open(output, "r", encoding="utf-8") as f:
        import json
        loaded = json.load(f)
    assert loaded["version"] == 10
    assert loaded["test"] is True


def test_empty_scene_still_returns_valid_project():
    """build_opencut_project() with empty scene list returns valid structure."""
    project = build_opencut_project("ep_001", "Empty Episode", [])
    assert project["version"] == 10
    assert project["scenes"] == []
    assert project["currentSceneId"] == ""
    assert project["metadata"]["duration"] == 0.0


def test_shot_with_zero_duration_skipped():
    """Shot with duration=0 should not produce any video element."""
    shot = _make_shot({"durationSeconds": 0.0})
    scenes = [_make_scene(shots=[shot])]
    project = build_opencut_project("ep_001", "Test", scenes)

    video_track = project["scenes"][0]["tracks"][0]
    assert len(video_track["elements"]) == 0, (
        "Zero-duration shot must not create a video element"
    )
