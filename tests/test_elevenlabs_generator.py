"""Tests for elevenlabs_generator.py — Issue #150 Phase 3.

Verifies against official ElevenLabs API docs:
- SFX: POST /v1/sound-generation → binary audio response (application/octet-stream)
- BGM: POST /v1/music → binary audio stream response
- Key rotation on 429, retry up to MAX_KEY_ROTATION different keys
- Asset registry update appends to audioTracks array
- Unified generator() entry dispatches correctly
"""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from unittest.mock import patch, MagicMock
import importlib.util


# ---------------------------------------------------------------------------
# Helper: import the module under test
# ---------------------------------------------------------------------------

MODULE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "src", "services", "asset-manager", "elevenlabs_generator.py",
)


def _import_module():
    spec = importlib.util.spec_from_file_location("elevenlabs_generator", MODULE_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mod():
    """Import the module under test."""
    return _import_module()


@pytest.fixture
def mock_env_keys(monkeypatch):
    """Set ELEVENLABS_KEYS env var for tests that need it."""
    monkeypatch.setenv("ELEVENLABS_KEYS", "key-alpha,key-beta,key-gamma")


@pytest.fixture
def fake_audio_bytes():
    """Simulate binary MP3 returned by ElevenLabs API."""
    return b"\xff\xfb\x90\x00" + b"\x00" * 1024  # fake MP3 header + padding


@pytest.fixture
def mock_200_response(fake_audio_bytes):
    """Mock a successful API response returning binary audio."""
    resp = MagicMock()
    resp.status_code = 200
    resp.content = fake_audio_bytes  # binary audio, NOT JSON!
    return resp


@pytest.fixture
def mock_429_response():
    """Mock rate-limit response."""
    resp = MagicMock()
    resp.status_code = 429
    return resp


# ===========================================================================
# AC1: generate_sfx — SFX via /v1/sound-generation
# ===========================================================================

def test_generate_sfx_is_callable(mod):
    """AC1: generate_sfx exists and is callable."""
    assert callable(mod.generate_sfx)


def test_generate_sfx_signature(mod):
    """AC1: generate_sfx accepts (asset_type, prompt, hash_key)."""
    import inspect
    sig = inspect.signature(mod.generate_sfx)
    params = list(sig.parameters.keys())
    assert params == ["asset_type", "prompt", "hash_key"]


def test_generate_sfx_returns_12char_asset_id(mod, mock_env_keys, mock_200_response):
    """AC1: On success, returns hash_key[:12] (12-character asset ID)."""
    with patch("requests.post", return_value=mock_200_response):
        with patch("builtins.open", MagicMock()):
            with patch("os.makedirs"):
                with patch("json.load", return_value={"audioTracks": []}):
                    with patch("json.dump"):
                        result = mod.generate_sfx(
                            "sound_effect", "thunder clap",
                            "abcdef1234567890abcdef1234567890"
                        )

    assert result == "abcdef123456"
    assert len(result) == 12


def test_generate_sfx_calls_correct_endpoint(mod, mock_env_keys, mock_200_response):
    """AC1: Calls POST /v1/sound-generation with correct URL and payload."""
    with patch("requests.post", return_value=mock_200_response) as mock_post:
        with patch("builtins.open", MagicMock()):
            with patch("os.makedirs"):
                with patch("json.load", return_value={"audioTracks": []}):
                    with patch("json.dump"):
                        mod.generate_sfx("sound_effect", "explosion boom", "h" * 32)

    call_url = mock_post.call_args[0][0]
    call_payload = mock_post.call_args[1]["json"]
    call_headers = mock_post.call_args[1]["headers"]

    assert call_url == "https://api.elevenlabs.io/v1/sound-generation"
    assert call_payload["text"] == "explosion boom"
    assert call_payload["duration_seconds"] == mod.SFX_DURATION
    assert call_payload["prompt_influence"] == 0.3
    assert "xi-api-key" in call_headers


def test_generate_sfx_saves_mp3_file(mod, mock_env_keys, mock_200_response):
    """AC1: Saves binary audio to public/assets/audio/sfx/{hash}.mp3."""
    fake_open = MagicMock()
    with patch("requests.post", return_value=mock_200_response):
        with patch("builtins.open", fake_open):
            with patch("os.makedirs"):
                with patch("json.load", return_value={"audioTracks": []}):
                    with patch("json.dump"):
                        mod.generate_sfx("sound_effect", "whoosh", "x" * 32)

    # Verify open was called for writing the audio file
    write_calls = [c for c in fake_open.call_args_list if "wb" in str(c)]
    assert len(write_calls) >= 1


def test_generate_sfx_uses_response_content_directly(mod, mock_env_keys, fake_audio_bytes):
    """AC1: Uses res.content (binary) directly — NOT JSON+base64 decode."""
    resp = MagicMock()
    resp.status_code = 200
    resp.content = fake_audio_bytes

    written_data = {}

    class CaptureWrite:
        def __init__(self, path, mode, **kwargs):
            self.path = path
            self.mode = mode
        def __enter__(self): return self
        def __exit__(self, *a): pass
        def write(self, data):
            written_data[self.path] = data

    with patch("requests.post", return_value=resp):
        with patch("builtins.open", side_effect=CaptureWrite):
            with patch("os.makedirs"):
                with patch("json.load", return_value={"audioTracks": []}):
                    with patch("json.dump"):
                        mod.generate_sfx("sound_effect", "test", "z" * 32)

    # The written audio data should match the response content
    found = False
    for path, data in written_data.items():
        if path.endswith(".mp3"):
            assert data == fake_audio_bytes
            found = True
            break
    assert found, "No MP3 file was written"


# ===========================================================================
# AC2: generate_bgm — BGM via /v1/music
# ===========================================================================

def test_generate_bgm_is_callable(mod):
    """AC2: generate_bgm exists and is callable."""
    assert callable(mod.generate_bgm)


def test_generate_bgm_signature(mod):
    """AC2: generate_bgm accepts (asset_type, prompt, hash_key)."""
    import inspect
    sig = inspect.signature(mod.generate_bgm)
    params = list(sig.parameters.keys())
    assert params == ["asset_type", "prompt", "hash_key"]


def test_generate_bgm_calls_music_endpoint(mod, mock_env_keys, mock_200_response):
    """AC2: Calls POST /v1/music (NOT sound-generation)."""
    with patch("requests.post", return_value=mock_200_response) as mock_post:
        with patch("builtins.open", MagicMock()):
            with patch("os.makedirs"):
                with patch("json.load", return_value={"audioTracks": []}):
                    with patch("json.dump"):
                        mod.generate_bgm("bgm", "epic cinematic orchestra", "m" * 32)

    call_url = mock_post.call_args[0][0]
    call_payload = mock_post.call_args[1]["json"]

    assert call_url == "https://api.elevenlabs.io/v1/music"
    assert call_payload["prompt"] is not None
    assert "music_length_ms" in call_payload
    assert call_payload["force_instrumental"] is True


def test_generate_bgm_sets_force_instrumental(mod, mock_env_keys, mock_200_response):
    """AC2: BGM always sets force_instrumental=True (no vocals)."""
    with patch("requests.post", return_value=mock_200_response) as mock_post:
        with patch("builtins.open", MagicMock()):
            with patch("os.makedirs"):
                with patch("json.load", return_value={"audioTracks": []}):
                    with patch("json.dump"):
                        mod.generate_bgm("bgm", "sad piano", "n" * 32)

    assert mock_post.call_args[1]["json"]["force_instrumental"] is True


def test_generate_bgm_uses_default_music_length(mod, mock_env_keys, mock_200_response):
    """AC2: BGM uses BGM_DURATION converted to milliseconds."""
    with patch("requests.post", return_value=mock_200_response) as mock_post:
        with patch("builtins.open", MagicMock()):
            with patch("os.makedirs"):
                with patch("json.load", return_value={"audioTracks": []}):
                    with patch("json.dump"):
                        mod.generate_bgm("bgm", "test music", "p" * 32)

    assert mock_post.call_args[1]["json"]["music_length_ms"] == int(mod.BGM_DURATION * 1000)


def test_generate_bgm_returns_asset_id(mod, mock_env_keys, mock_200_response):
    """AC2: On success, returns hash_key[:12]."""
    with patch("requests.post", return_value=mock_200_response):
        with patch("builtins.open", MagicMock()):
            with patch("os.makedirs"):
                with patch("json.load", return_value={"audioTracks": []}):
                    with patch("json.dump"):
                        result = mod.generate_bgm("bgm", "epic music", "q" * 32)

    assert result == "q" * 12


# ===========================================================================
# AC3: Key rotation on 429
# ===========================================================================

def test_key_rotation_first_429_second_ok(mod, mock_env_keys, mock_200_response,
                                            mock_429_response):
    """AC3: 429 on first key -> rotates to second key -> succeeds."""
    mock_post = MagicMock(side_effect=[mock_429_response, mock_200_response])

    with patch("requests.post", mock_post):
        with patch("builtins.open", MagicMock()):
            with patch("os.makedirs"):
                with patch("json.load", return_value={"audioTracks": []}):
                    with patch("json.dump"):
                        result = mod.generate_sfx("sound_effect", "test", "r" * 32)

    assert result is not None
    assert mock_post.call_count == 2
    assert mock_post.call_args_list[0][1]["headers"]["xi-api-key"] == "key-alpha"
    assert mock_post.call_args_list[1][1]["headers"]["xi-api-key"] == "key-beta"


def test_key_rotation_all_429_fails(mod, mock_env_keys):
    """AC3: All keys return 429 -> returns None."""
    resp_429 = MagicMock()
    resp_429.status_code = 429

    with patch("requests.post", return_value=resp_429) as mock_post:
        with patch("os.makedirs"):
            result = mod.generate_sfx("sound_effect", "test", "s" * 32)

    assert result is None
    assert mock_post.call_count == mod.MAX_KEY_ROTATION


def test_key_rotation_stops_at_max_tries(mod, mock_env_keys, mock_429_response):
    """AC3: Only tries up to MAX_KEY_TRIES keys, not all keys in env."""
    mock_post = MagicMock(return_value=mock_429_response)

    with patch("requests.post", mock_post):
        with patch("os.makedirs"):
            result = mod.generate_sfx("sound_effect", "test", "t" * 32)

    assert result is None
    assert mock_post.call_count == mod.MAX_KEY_ROTATION


# ===========================================================================
# AC4: Asset registry update
# ===========================================================================

def test_registry_appends_sfx_entry(mod, mock_env_keys, mock_200_response):
    """AC4: After SFX success, asset_registry.json gets new sfx entry."""
    existing = {"audioTracks": [
        {"id": "old_bgm", "type": "bgm", "description": "old"}
    ]}
    captured_json = ""

    class ReadRegistry:
        def __enter__(self):
            self.content = json.dumps(existing)
            return self
        def __exit__(self, *a): pass
        def read(self): return self.content

    class WriteRegistry:
        def __init__(self, path, mode, **kwargs):
            self.path = str(path)
            self.mode = mode
        def __enter__(self): return self
        def __exit__(self, *a): pass
        def write(self, data):
            nonlocal captured_json
            captured_json += data

    def mock_open(path, mode="r", *a, **kw):
        ps = str(path)
        if "asset_registry.json" in ps:
            if "w" in mode:
                return WriteRegistry(ps, mode, **kw)
            return ReadRegistry()
        return MagicMock()

    with patch("requests.post", return_value=mock_200_response):
        with patch("builtins.open", side_effect=mock_open):
            with patch("os.makedirs"):
                with patch("os.path.exists", return_value=True):
                    mod.generate_sfx("sound_effect", "punch hit", "u" * 32)

    assert captured_json, "Registry was not written"
    registry = json.loads(captured_json)
    tracks = registry["audioTracks"]
    assert len(tracks) == 2
    new_entry = tracks[-1]
    assert new_entry["id"] == "u" * 12
    assert new_entry["type"] == "sfx"
    assert new_entry["description"] == "punch hit"


def test_registry_appends_bgm_entry(mod, mock_env_keys, mock_200_response):
    """AC4: After BGM success, asset_registry.json gets new bgm entry."""
    existing = {"audioTracks": []}
    captured_json = ""

    class ReadRegistry:
        def __enter__(self):
            self.content = json.dumps(existing)
            return self
        def __exit__(self, *a): pass
        def read(self): return self.content

    class WriteRegistry:
        def __init__(self, path, mode, **kwargs): pass
        def __enter__(self): return self
        def __exit__(self, *a): pass
        def write(self, data):
            nonlocal captured_json
            captured_json += data

    def mock_open(path, mode="r", *a, **kw):
        if "asset_registry.json" in str(path):
            if "w" in mode:
                return WriteRegistry(str(path), mode, **kw)
            return ReadRegistry()
        return MagicMock()

    with patch("requests.post", return_value=mock_200_response):
        with patch("builtins.open", side_effect=mock_open):
            with patch("os.makedirs"):
                with patch("os.path.exists", return_value=True):
                    mod.generate_bgm("bgm", "orchestral sadness", "v" * 32)

    assert captured_json, "Registry was not written"
    registry = json.loads(captured_json)
    new_entry = registry["audioTracks"][-1]
    assert new_entry["id"] == "v" * 12
    assert new_entry["type"] == "bgm"
    assert new_entry["description"] == "orchestral sadness"


def test_registry_skips_duplicate_id(mod, mock_env_keys, mock_200_response):
    """AC4: Skips adding entry if asset_id already exists in registry."""
    asset_id = "w" * 12
    existing = {"audioTracks": [
        {"id": asset_id, "type": "sfx", "description": "exists"}
    ]}
    captured_json = ""

    class ReadRegistry:
        def __enter__(self):
            self.content = json.dumps(existing)
            return self
        def __exit__(self, *a): pass
        def read(self): return self.content

    class WriteRegistry:
        def __init__(self, path, mode, **kwargs): pass
        def __enter__(self): return self
        def __exit__(self, *a): pass
        def write(self, data):
            nonlocal captured_json
            captured_json += data

    def mock_open(path, mode="r", *a, **kw):
        if "asset_registry.json" in str(path):
            if "w" in mode:
                return WriteRegistry(str(path), mode, **kw)
            return ReadRegistry()
        return MagicMock()

    with patch("requests.post", return_value=mock_200_response):
        with patch("builtins.open", side_effect=mock_open):
            with patch("os.makedirs"):
                with patch("os.path.exists", return_value=True):
                    # hash_key[:12] will be "w"*12, same as existing
                    mod.generate_sfx("sound_effect", "test", asset_id * 3)

    if captured_json:
        registry = json.loads(captured_json)
        assert len(registry["audioTracks"]) == 1


# ===========================================================================
# AC6: Error handling -> returns None
# ===========================================================================

def test_no_keys_returns_none(mod, monkeypatch):
    """AC6: Returns None when ELEVENLABS_KEYS is not set."""
    monkeypatch.delenv("ELEVENLABS_KEYS", raising=False)
    result = mod.generate_sfx("sound_effect", "test", "aa" * 16)
    assert result is None


def test_connection_error_returns_none(mod, mock_env_keys):
    """AC6: Returns None on network exception."""
    with patch("requests.post", side_effect=Exception("Connection refused")):
        with patch("os.makedirs"):
            result = mod.generate_sfx("sound_effect", "test", "bb" * 16)
    assert result is None


def test_api_500_rotates_and_returns_none(mod, mock_env_keys):
    """AC6: Non-429 errors also trigger rotation, eventually return None."""
    resp_500 = MagicMock()
    resp_500.status_code = 500

    with patch("requests.post", return_value=resp_500) as mock_post:
        with patch("os.makedirs"):
            result = mod.generate_sfx("sound_effect", "test", "cc" * 16)

    assert result is None
    assert mock_post.call_count == mod.MAX_KEY_ROTATION


# ===========================================================================
# AC7: Unified generator() entry point
# ===========================================================================

def test_generator_exists_and_callable(mod):
    """AC7: generator() function exists with correct signature."""
    assert callable(mod.generator)


def test_generator_signature(mod):
    """AC7: generator accepts (asset_type, prompt, hash_key)."""
    import inspect
    sig = inspect.signature(mod.generator)
    params = list(sig.parameters.keys())
    assert params == ["asset_type", "prompt", "hash_key"]


def test_generator_dispatches_sound_effect(mod, mock_env_keys, mock_200_response):
    """AC7: generator('sound_effect', ...) -> calls generate_sfx, returns asset_id."""
    with patch("requests.post", return_value=mock_200_response):
        with patch("builtins.open", MagicMock()):
            with patch("os.makedirs"):
                with patch("json.load", return_value={"audioTracks": []}):
                    with patch("json.dump"):
                        result = mod.generator("sound_effect", "whoosh", "dd" * 16)

    assert result == "d" * 12


def test_generator_dispatches_sfx_alias(mod, mock_env_keys, mock_200_response):
    """AC7: generator('sfx', ...) also works (alias)."""
    with patch("requests.post", return_value=mock_200_response):
        with patch("builtins.open", MagicMock()):
            with patch("os.makedirs"):
                with patch("json.load", return_value={"audioTracks": []}):
                    with patch("json.dump"):
                        result = mod.generator("sfx", "bang", "ee" * 16)

    assert result == "e" * 12


def test_generator_dispatches_bgm(mod, mock_env_keys, mock_200_response):
    """AC7: generator('bgm', ...) -> calls generate_bgm, returns asset_id."""
    with patch("requests.post", return_value=mock_200_response):
        with patch("builtins.open", MagicMock()):
            with patch("os.makedirs"):
                with patch("json.load", return_value={"audioTracks": []}):
                    with patch("json.dump"):
                        result = mod.generator("bgm", "sad strings", "ff" * 16)

    assert result == "f" * 12


def test_generator_unknown_type_returns_none(mod):
    """AC7: Unknown asset_type returns None (worker will handle FAILED)."""
    result = mod.generator("unknown_type", "prompt", "gg" * 16)
    assert result is None


