"""Visual Generator — Background and Expression image generation for Asset Factory.

Issue #151 Phase 4. Provides generator functions compliant with
GENERATOR_REGISTRY signature: def generator(asset_type, prompt, hash_key) -> str | None

Uses Google Imagen API (via google-genai SDK) for image generation.
Falls back to Gemini Flash image preview if Imagen is unavailable.

Key management: reads GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY from env.
"""

# ✏️ EDIT ZONE START (line 1)
# ✏️ EDIT ZONE END (entire file — new file)

import json
import logging
import os

from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("visual_generator")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Compute project root from this file's location (4 levels up)
_PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

# Output directories (absolute, computed from project root)
REGISTRY_PATH = os.path.join(_PROJECT_ROOT, "public", "asset_registry.json")
BACKGROUND_DIR = os.path.join(_PROJECT_ROOT, "public", "assets", "background")
EXPRESSION_DIR = os.path.join(
    _PROJECT_ROOT, "public", "assets", "expressions", "female_01"
)

# Image generation models (in priority order)
IMAGEN_MODEL = "imagen-3.0-generate-002"
GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image-preview"

# ---------------------------------------------------------------------------
# Key Management
# ---------------------------------------------------------------------------


def _load_api_key():
    """Load Gemini/Imagen API key from environment.

    Reads GOOGLE_GENERATIVE_AI_API_KEY first, falls back to GEMINI_API_KEY.

    Returns:
        str | None: API key string, or None if not configured.
    """
    api_key = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY") or os.getenv("GEMINI_API_KEY")
    return api_key


# ---------------------------------------------------------------------------
# API Call (low-level)
# ---------------------------------------------------------------------------


def _call_image_api(api_key, prompt, aspect_ratio="16:9"):
    """Call Google Imagen/Gemini API to generate an image from a text prompt.

    Uses the google-genai SDK. Tries Imagen first (best quality),
    falls back to Gemini Flash image generation.

    Args:
        api_key: Google AI Studio API key.
        prompt: Text description of the image to generate.
        aspect_ratio: Aspect ratio string (e.g. '16:9', '1:1', '4:3').
                      Used for Imagen; ignored for Gemini fallback.

    Returns:
        bytes | None: JPEG image bytes, or None if generation failed.
    """
    if not api_key:
        logger.error("No Google AI API key configured")
        return None

    try:
        client = genai.Client(api_key=api_key)

        # Primary: Imagen dedicated image generation
        response = client.models.generate_images(
            model=IMAGEN_MODEL,
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio=aspect_ratio,
                output_mime_type="image/jpeg",
            ),
        )

        if response.generated_images:
            gen_img = response.generated_images[0]
            if gen_img.image and gen_img.image.image_bytes:
                return gen_img.image.image_bytes
            else:
                logger.warning("Imagen returned image but no bytes")
        else:
            logger.warning("Imagen returned no generated images")

    except Exception as e:
        logger.warning("Imagen API failed (%s), falling back to Gemini", e)

        # Fallback: Gemini Flash image generation via generate_content
        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model=GEMINI_IMAGE_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["Text", "Image"],
                ),
            )

            # Extract image bytes from response parts
            if response.candidates:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, "inline_data") and part.inline_data:
                        if part.inline_data.mime_type.startswith("image/"):
                            return part.inline_data.data

            logger.error("Gemini fallback: no image data in response")
        except Exception as fallback_e:
            logger.error("Gemini fallback also failed: %s", fallback_e)

    return None


# ---------------------------------------------------------------------------
# File I/O
# ---------------------------------------------------------------------------


def _save_image(image_bytes, directory, filename):
    """Save raw JPEG bytes to disk under the given directory.

    Args:
        image_bytes: Raw JPEG image data.
        directory: Absolute directory path.
        filename: Output filename (e.g. 'abc123456789.jpg').

    Returns:
        str | None: Full absolute path where file was saved, or None on error.
    """
    try:
        os.makedirs(directory, exist_ok=True)
        filepath = os.path.join(directory, filename)
        with open(filepath, "wb") as f:
            f.write(image_bytes)
        return filepath
    except OSError as e:
        logger.error("Failed to save image %s: %s", filename, e)
        return None


# ---------------------------------------------------------------------------
# Asset Registry
# ---------------------------------------------------------------------------


def _update_registry_background(registry_path, asset_id, rel_path):
    """Append a background entry to asset_registry.json's 'backgrounds' array.

    Entry format: {id: asset_id, path: rel_path}

    Args:
        registry_path: Absolute path to asset_registry.json.
        asset_id: Short asset ID (hash_key[:12]).
        rel_path: Relative path (e.g. 'background/abc123456789.jpg').
    """
    try:
        if not os.path.exists(registry_path):
            logger.warning("Registry not found at %s", registry_path)
            return

        with open(registry_path, "r", encoding="utf-8") as f:
            registry = json.load(f)

        if "backgrounds" not in registry:
            registry["backgrounds"] = []

        existing_ids = {entry["id"] for entry in registry["backgrounds"]}
        if asset_id in existing_ids:
            logger.info("Background %s already in registry, skipping", asset_id)
            return

        entry = {"id": asset_id, "path": rel_path}
        registry["backgrounds"].append(entry)

        # Atomic write: tmp + os.replace to avoid corruption
        tmp_path = registry_path + ".tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(registry, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, registry_path)

        logger.info("Updated asset_registry.json with background:%s", asset_id)

    except (json.JSONDecodeError, OSError) as e:
        logger.error("Failed to update registry (background): %s", e)


def _update_registry_expression(registry_path, asset_id, rel_path):
    """Append an expression entry to asset_registry.json's 'expressions' array.

    Entry format: {id: asset_id, path: rel_path}

    Args:
        registry_path: Absolute path to asset_registry.json.
        asset_id: Short asset ID (hash_key[:12]).
        rel_path: Relative path (e.g. 'expressions/female_01/abc123456789.jpg').
    """
    try:
        if not os.path.exists(registry_path):
            logger.warning("Registry not found at %s", registry_path)
            return

        with open(registry_path, "r", encoding="utf-8") as f:
            registry = json.load(f)

        if "expressions" not in registry:
            registry["expressions"] = []

        existing_ids = {entry["id"] for entry in registry["expressions"]}
        if asset_id in existing_ids:
            logger.info("Expression %s already in registry, skipping", asset_id)
            return

        entry = {"id": asset_id, "path": rel_path}
        registry["expressions"].append(entry)

        # Atomic write
        tmp_path = registry_path + ".tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(registry, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, registry_path)

        logger.info("Updated asset_registry.json with expression:%s", asset_id)

    except (json.JSONDecodeError, OSError) as e:
        logger.error("Failed to update registry (expression): %s", e)


# ---------------------------------------------------------------------------
# Generator Functions (GENERATOR_REGISTRY compatible)
# ---------------------------------------------------------------------------


def generate_background(asset_type, prompt, hash_key):
    """Generate a background image via Google Imagen/Gemini API.

    Prompt is augmented with background-specific context for better quality.

    Args:
        asset_type: Asset type string (e.g. 'background').
        prompt: Text description of the background scene.
        hash_key: Unique hash key for dedup (from AssetQueue).

    Returns:
        str | None: Asset ID (hash_key[:12]) on success, None on failure.
    """
    api_key = _load_api_key()
    if not api_key:
        logger.error("No Google AI API key configured")
        return None

    asset_id = hash_key[:12]

    # Augment prompt for background-specific quality
    bg_prompt = (
        f"Background scene, cinematic quality, wide angle, detailed environment: "
        f"{prompt}. No characters, no text overlay, clean composition."
    )

    image_bytes = _call_image_api(api_key, bg_prompt, aspect_ratio="16:9")

    if image_bytes is None:
        logger.error("Background generation failed for prompt: %s", prompt[:80])
        return None

    filepath = _save_image(image_bytes, BACKGROUND_DIR, f"{asset_id}.jpg")
    if not filepath:
        return None

    rel_path = f"background/{asset_id}.jpg"
    _update_registry_background(REGISTRY_PATH, asset_id, rel_path)
    return asset_id


def generate_expression(asset_type, prompt, hash_key):
    """Generate a character expression sprite via Google Imagen/Gemini API.

    Prompt is augmented with 'character expression sprite, green screen background'
    for compositing compatibility.

    Args:
        asset_type: Asset type string (e.g. 'expression').
        prompt: Text description of the expression.
        hash_key: Unique hash key for dedup (from AssetQueue).

    Returns:
        str | None: Asset ID (hash_key[:12]) on success, None on failure.
    """
    api_key = _load_api_key()
    if not api_key:
        logger.error("No Google AI API key configured")
        return None

    asset_id = hash_key[:12]

    # Augment prompt for expression sprite format
    expr_prompt = (
        f"Character expression sprite, green screen background: {prompt}. "
        f"Close-up bust shot of a young female character showing this expression. "
        f"Clean edges, well-lit, suitable for compositing."
    )

    # Use 1:1 aspect ratio for expression sprites
    image_bytes = _call_image_api(api_key, expr_prompt, aspect_ratio="1:1")

    if image_bytes is None:
        logger.error("Expression generation failed for prompt: %s", prompt[:80])
        return None

    filepath = _save_image(image_bytes, EXPRESSION_DIR, f"{asset_id}.jpg")
    if not filepath:
        return None

    rel_path = f"expressions/female_01/{asset_id}.jpg"
    _update_registry_expression(REGISTRY_PATH, asset_id, rel_path)
    return asset_id


def generator(asset_type, prompt, hash_key):
    """Unified generator entry point for GENERATOR_REGISTRY.

    Dispatches to the appropriate generator based on asset_type:
      - 'background', 'bg' -> generate_background
      - 'expression', 'expr' -> generate_expression

    Args:
        asset_type: Asset type string.
        prompt: Text description.
        hash_key: Unique hash key.

    Returns:
        str | None: Asset ID on success, None on failure.
    """
    if asset_type in ("background", "bg"):
        return generate_background(asset_type, prompt, hash_key)
    elif asset_type in ("expression", "expr"):
        return generate_expression(asset_type, prompt, hash_key)
    else:
        logger.error("Unknown asset_type for visual generator: %s", asset_type)
        return None

# ✏️ EDIT ZONE END
