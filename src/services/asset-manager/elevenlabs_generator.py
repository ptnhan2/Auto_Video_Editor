"""ElevenLabs Audio Generator — SFX and BGM generation for Asset Factory.

Issue #150 Phase 3. Provides generator functions compliant with
GENERATOR_REGISTRY signature: def generator(asset_type, prompt, hash_key) -> str | None

Endpoints (verified against official ElevenLabs docs 2026-05-25):
  - SFX: POST /v1/sound-generation -> binary audio response (application/octet-stream)
  - BGM: POST /v1/music -> binary audio stream response (model music_v1)

Key management: reads ELEVENLABS_KEYS from env (comma-separated), rotates on 429.
"""

# ✏️ EDIT ZONE START (line 1)
# ✏️ EDIT ZONE END (entire file — new file)

import json
import logging
import os

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("elevenlabs_generator")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Compute project root from this file's location
_PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

# API endpoints
ELEVENLABS_SFX_URL = "https://api.elevenlabs.io/v1/sound-generation"
ELEVENLABS_MUSIC_URL = "https://api.elevenlabs.io/v1/music"

# Output directories (absolute, computed from project root)
REGISTRY_PATH = os.path.join(_PROJECT_ROOT, "public", "asset_registry.json")
SFX_DIR = os.path.join(_PROJECT_ROOT, "public", "assets", "audio", "sfx")
BGM_DIR = os.path.join(_PROJECT_ROOT, "public", "assets", "audio", "bgm")

# Duration configs
SFX_DURATION = 8.0        # seconds — typical sound effect length
BGM_DURATION = 22.0       # seconds — converted to milliseconds for music API

# Max different keys to try before giving up
MAX_KEY_ROTATION = 3

# ---------------------------------------------------------------------------
# Key Management
# ---------------------------------------------------------------------------

def _load_keys():
    """Load ElevenLabs API keys from ELEVENLABS_KEYS env var.

    Returns:
        list[str]: List of API keys, or empty list if env var not set.
    """
    raw = os.getenv("ELEVENLABS_KEYS", "")
    if not raw:
        return []
    return [k.strip() for k in raw.split(",") if k.strip()]


# ---------------------------------------------------------------------------
# API Calls (low-level)
# ---------------------------------------------------------------------------

def _call_sfx_api(keys, prompt, duration_seconds=None):
    """Call ElevenLabs /v1/sound-generation with key rotation.

    Response is binary audio (application/octet-stream), NOT JSON.

    Args:
        keys: List of API key strings.
        prompt: Text description of the sound effect.
        duration_seconds: Audio duration in seconds. Defaults to SFX_DURATION.

    Returns:
        bytes | None: Raw MP3 audio bytes, or None if all keys exhausted.
    """
    if duration_seconds is None:
        duration_seconds = SFX_DURATION

    if not keys:
        return None

    tried = 0
    for key in keys:
        if tried >= MAX_KEY_ROTATION:
            break

        headers = {
            "xi-api-key": key,
            "Content-Type": "application/json",
        }
        payload = {
            "text": prompt,
            "duration_seconds": duration_seconds,
            "prompt_influence": 0.3,
        }

        try:
            res = requests.post(
                ELEVENLABS_SFX_URL, json=payload, headers=headers, timeout=30
            )
            tried += 1

            if res.status_code == 200:
                # Response is binary audio directly — res.content gives raw bytes
                if res.content:
                    return res.content
                else:
                    logger.warning(
                        "SFX key %s... returned 200 but empty body", key[:5]
                    )
                    continue

            elif res.status_code == 429:
                logger.warning(
                    "SFX key %s... rate limited (429), rotating...", key[:5]
                )
                continue

            else:
                logger.error(
                    "SFX key %s... HTTP %s: %s",
                    key[:5], res.status_code, res.text[:200],
                )
                continue

        except Exception as e:
            logger.error("SFX key %s... connection error: %s", key[:5], e)
            continue

    return None


def _call_music_api(keys, prompt):
    """Call ElevenLabs /v1/music with key rotation.

    Uses force_instrumental=True to ensure no vocals (suitable for BGM).
    Response is binary audio stream (application/octet-stream).

    Args:
        keys: List of API key strings.
        prompt: Text description of the music mood/style.

    Returns:
        bytes | None: Raw MP3 audio bytes, or None if all keys exhausted.
    """
    if not keys:
        return None

    tried = 0
    for key in keys:
        if tried >= MAX_KEY_ROTATION:
            break

        headers = {
            "xi-api-key": key,
            "Content-Type": "application/json",
        }
        payload = {
            "prompt": prompt,
            "music_length_ms": int(BGM_DURATION * 1000),  # convert seconds -> ms
            "force_instrumental": True,
        }

        try:
            res = requests.post(
                ELEVENLABS_MUSIC_URL, json=payload, headers=headers, timeout=30
            )
            tried += 1

            if res.status_code == 200:
                if res.content:
                    return res.content
                else:
                    logger.warning(
                        "Music key %s... returned 200 but empty body", key[:5]
                    )
                    continue

            elif res.status_code == 429:
                logger.warning(
                    "Music key %s... rate limited (429), rotating...", key[:5]
                )
                continue

            else:
                logger.error(
                    "Music key %s... HTTP %s: %s",
                    key[:5], res.status_code, res.text[:200],
                )
                continue

        except Exception as e:
            logger.error("Music key %s... connection error: %s", key[:5], e)
            continue

    return None


# ---------------------------------------------------------------------------
# File I/O
# ---------------------------------------------------------------------------

def _save_audio(audio_bytes, directory, filename):
    """Save raw MP3 bytes to disk under the given directory.

    Args:
        audio_bytes: Raw MP3 audio data (from res.content).
        directory: Relative directory path (e.g. 'public/assets/audio/sfx').
        filename: Output filename (e.g. 'abc123456789.mp3').

    Returns:
        str: Full relative path where file was saved, or empty string on error.
    """
    try:
        os.makedirs(directory, exist_ok=True)
        filepath = os.path.join(directory, filename)
        with open(filepath, "wb") as f:
            f.write(audio_bytes)
        return filepath
    except OSError as e:
        logger.error("Failed to save audio %s: %s", filename, e)
        return ""


# ---------------------------------------------------------------------------
# Asset Registry
# ---------------------------------------------------------------------------

def _update_asset_registry(asset_id, asset_type, prompt):
    """Append a new audio track entry to public/asset_registry.json.

    Adds an entry to the 'audioTracks' array:
      {id: asset_id, type: 'sfx' | 'bgm', description: prompt}

    Args:
        asset_id: Short asset ID (hash_key[:12]).
        asset_type: 'sfx' for sound effects, 'bgm' for background music.
        prompt: User-facing description of the audio.
    """
    try:
        if not os.path.exists(REGISTRY_PATH):
            logger.warning("Registry not found at %s", REGISTRY_PATH)
            return

        with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
            registry = json.load(f)

        if "audioTracks" not in registry:
            registry["audioTracks"] = []

        # Avoid duplicate entries
        existing_ids = {entry["id"] for entry in registry["audioTracks"]}
        if asset_id in existing_ids:
            logger.info("Asset %s already in registry, skipping", asset_id)
            return

        entry = {
            "id": asset_id,
            "type": asset_type,
            "description": prompt,
        }
        registry["audioTracks"].append(entry)

        with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
            json.dump(registry, f, ensure_ascii=False, indent=2)

        logger.info(
            "Updated asset_registry.json with %s:%s", asset_type, asset_id
        )

    except (json.JSONDecodeError, OSError) as e:
        logger.error("Failed to update asset registry: %s", e)


# ---------------------------------------------------------------------------
# Generator Functions (GENERATOR_REGISTRY compatible)
# ---------------------------------------------------------------------------

def generate_sfx(asset_type, prompt, hash_key):
    """Generate a sound effect via ElevenLabs /v1/sound-generation.

    Args:
        asset_type: Asset type string (e.g. 'sound_effect').
        prompt: Text description of the sound effect.
        hash_key: Unique hash key for dedup (from AssetQueue).

    Returns:
        str | None: Asset ID (hash_key[:12]) on success, None on failure.
    """
    keys = _load_keys()
    if not keys:
        logger.error("No ELEVENLABS_KEYS configured")
        return None

    asset_id = hash_key[:12]
    audio_bytes = _call_sfx_api(keys, prompt)

    if audio_bytes is None:
        logger.error("SFX generation failed for prompt: %s", prompt[:80])
        return None

    filepath = _save_audio(audio_bytes, SFX_DIR, f"{asset_id}.mp3")
    if not filepath:
        return None

    _update_asset_registry(asset_id, "sfx", prompt)
    return asset_id


def generate_bgm(asset_type, prompt, hash_key):
    """Generate background music via ElevenLabs.

    Tries /v1/music first (best quality, paid plan required).
    Falls back to /v1/sound-generation with music prompt + longer duration
    if Music API is unavailable (free tier compatibility).

    Args:
        asset_type: Asset type string (e.g. 'bgm').
        prompt: Text description of the music mood/style.
        hash_key: Unique hash key for dedup (from AssetQueue).

    Returns:
        str | None: Asset ID (hash_key[:12]) on success, None on failure.
    """
    keys = _load_keys()
    if not keys:
        logger.error("No ELEVENLABS_KEYS configured")
        return None

    asset_id = hash_key[:12]

    # Augment prompt with music-specific context
    music_prompt = (
        f"Background instrumental music: {prompt}. "
        f"Cinematic quality, seamless loop, no vocals."
    )

    # Try Music API first
    audio_bytes = _call_music_api(keys, music_prompt)

    if audio_bytes is None:
        # Fallback: use sound-generation with music prompt + longer duration
        logger.info(
            "Music API unavailable, falling back to sound-generation for BGM"
        )
        audio_bytes = _call_sfx_api(
            keys, music_prompt, duration_seconds=22.0
        )

    if audio_bytes is None:
        logger.error("BGM generation failed for prompt: %s", prompt[:80])
        return None

    filepath = _save_audio(audio_bytes, BGM_DIR, f"{asset_id}.mp3")
    if not filepath:
        return None

    _update_asset_registry(asset_id, "bgm", prompt)
    return asset_id


def generator(asset_type, prompt, hash_key):
    """Unified generator entry point for GENERATOR_REGISTRY.

    Dispatches to the appropriate generator based on asset_type:
      - 'sound_effect', 'sfx' -> generate_sfx
      - 'bgm' -> generate_bgm

    Args:
        asset_type: Asset type string.
        prompt: Text description.
        hash_key: Unique hash key.

    Returns:
        str | None: Asset ID on success, None on failure.
    """
    if asset_type in ("sound_effect", "sfx"):
        return generate_sfx(asset_type, prompt, hash_key)
    elif asset_type == "bgm":
        return generate_bgm(asset_type, prompt, hash_key)
    else:
        logger.error("Unknown asset_type for audio generator: %s", asset_type)
        return None

# ✏️ EDIT ZONE END
