"""Tests for visual_generator.py — TDD for Issue #151 Phase 4.

Verifies:
- Image generation via Google Imagen/Gemini API
- Background images saved to public/assets/background/
- Expression images saved to public/assets/expressions/female_01/
- Asset registry updated atomically (backgrounds + expressions arrays)
- Unified generator() dispatches correctly
- Error handling: missing API key, API failures, IO errors
"""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402
from unittest.mock import patch, MagicMock  # noqa: E402
import importlib.util  # noqa: E402


# ---------------------------------------------------------------------------
# Helper: import the module under test
# ---------------------------------------------------------------------------

MODULE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "src", "services", "asset-manager", "visual_generator.py",
)


def _import_module():
    spec = importlib.util.spec_from_file_location("visual_generator", MODULE_PATH)
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
def mock_api_key(monkeypatch):
    """Set GOOGLE_GENERATIVE_AI_API_KEY env var."""
    monkeypatch.setenv("GOOGLE_GENERATIVE_AI_API_KEY", "test-api-key-12345")


@pytest.fixture
def fake_jpeg_bytes():
    """Minimal JPEG header bytes."""
    return b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb"


@pytest.fixture
def mock_genai_client(fake_jpeg_bytes):
    """Mock google.genai.Client to return a fake generated image.

    Patches the actual google.genai module-level imports so the mock
    is visible regardless of how visual_generator.py is loaded
    (importlib or standard import).
    """
    mock_image = MagicMock()
    mock_image.image_bytes = fake_jpeg_bytes
    mock_image.mime_type = "image/jpeg"

    mock_generated = MagicMock()
    mock_generated.image = mock_image

    mock_response = MagicMock()
    mock_response.generated_images = [mock_generated]

    mock_client = MagicMock()
    mock_client.models.generate_images.return_value = mock_response

    with patch("google.genai.Client", return_value=mock_client, create=True), \
         patch("google.genai.types.GenerateImagesConfig", create=True), \
         patch("google.genai.types.GenerateContentConfig", create=True):
        yield mock_client

# ===========================================================================
# AC1: _save_image — save JPEG bytes to disk
# ===========================================================================

class TestSaveImage:
    def test_saves_image_and_returns_filepath(self, mod, tmp_path, fake_jpeg_bytes):
        """_save_image writes bytes to disk and returns absolute path."""
        filepath = mod._save_image(fake_jpeg_bytes, str(tmp_path), "test_img.jpg")
        expected = os.path.join(str(tmp_path), "test_img.jpg")
        assert filepath == expected
        assert os.path.isfile(filepath)
        with open(filepath, "rb") as f:
            assert f.read() == fake_jpeg_bytes

    def test_creates_directory_if_missing(self, mod, tmp_path, fake_jpeg_bytes):
        """_save_image creates output directory if it does not exist."""
        new_dir = os.path.join(str(tmp_path), "nested", "deep")
        assert not os.path.exists(new_dir)
        mod._save_image(fake_jpeg_bytes, new_dir, "out.jpg")
        assert os.path.isdir(new_dir)
        assert os.path.isfile(os.path.join(new_dir, "out.jpg"))

    def test_returns_none_on_os_error(self, mod, monkeypatch):
        """_save_image returns None on IO error."""
        def _mock_open(*args, **kwargs):
            raise OSError("Permission denied")
        monkeypatch.setattr("builtins.open", _mock_open)
        result = mod._save_image(b"data", "/some/dir", "out.jpg")
        assert result is None


# ===========================================================================
# AC2: Registry updates (atomic write)
# ===========================================================================

class TestUpdateRegistryBackground:
    def test_adds_entry_atomically(self, mod, tmp_path):
        """_update_registry_background appends {id, path} via atomic write."""
        registry_path = os.path.join(str(tmp_path), "asset_registry.json")
        with open(registry_path, "w", encoding="utf-8") as f:
            json.dump({"backgrounds": []}, f)

        mod._update_registry_background(
            registry_path, "abc123456789", "background/abc123456789.jpg",
            description="sunset over mountains"
        )

        with open(registry_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        assert any(
            e["id"] == "abc123456789"
            and e["path"] == "background/abc123456789.jpg"
            and e["description"] == "sunset over mountains"
            for e in data["backgrounds"]
        )

    def test_creates_backgrounds_array_if_missing(self, mod, tmp_path):
        """_update_registry_background creates 'backgrounds' key if absent."""
        registry_path = os.path.join(str(tmp_path), "asset_registry.json")
        with open(registry_path, "w", encoding="utf-8") as f:
            json.dump({}, f)

        mod._update_registry_background(registry_path, "xyz000", "background/xyz000.jpg")

        with open(registry_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        assert "backgrounds" in data
        assert data["backgrounds"][0]["id"] == "xyz000"

    def test_no_duplicate_entry(self, mod, tmp_path):
        """_update_registry_background skips if asset_id already registered."""
        registry_path = os.path.join(str(tmp_path), "asset_registry.json")
        with open(registry_path, "w", encoding="utf-8") as f:
            json.dump({"backgrounds": []}, f)

        mod._update_registry_background(registry_path, "dup000", "bg/dup000.jpg")
        mod._update_registry_background(registry_path, "dup000", "bg/dup000.jpg")

        with open(registry_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        assert len(data["backgrounds"]) == 1


class TestUpdateRegistryExpression:
    def test_adds_expression_entry_atomically(self, mod, tmp_path):
        """_update_registry_expression appends {id, path} to expressions array."""
        registry_path = os.path.join(str(tmp_path), "asset_registry.json")
        with open(registry_path, "w", encoding="utf-8") as f:
            json.dump({"expressions": []}, f)

        mod._update_registry_expression(
            registry_path, "happy001", "expressions/female_01/happy001.jpg",
            description="happy face"
        )

        with open(registry_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        assert any(
            e["id"] == "happy001"
            and e["path"] == "expressions/female_01/happy001.jpg"
            and e["description"] == "happy face"
            for e in data["expressions"]
        )

    def test_creates_expressions_array_if_missing(self, mod, tmp_path):
        """_update_registry_expression creates 'expressions' key if absent."""
        registry_path = os.path.join(str(tmp_path), "asset_registry.json")
        with open(registry_path, "w", encoding="utf-8") as f:
            json.dump({}, f)

        mod._update_registry_expression(registry_path, "sad001", "expressions/female_01/sad001.jpg")

        with open(registry_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        assert "expressions" in data


# ===========================================================================
# AC3: Generator functions
# ===========================================================================

def test_generator_is_callable(mod):
    """generator() exists and is callable."""
    assert callable(mod.generator)


def test_generator_signature(mod):
    """generator() accepts exactly (asset_type, prompt, hash_key)."""
    import inspect
    sig = inspect.signature(mod.generator)
    params = list(sig.parameters.keys())
    assert params == ["asset_type", "prompt", "hash_key"]


def test_generate_background_is_callable(mod):
    """generate_background() exists and is callable."""
    assert callable(mod.generate_background)


def test_generate_expression_is_callable(mod):
    """generate_expression() exists and is callable."""
    assert callable(mod.generate_expression)


# ===========================================================================
# AC4: generate_background — full integration with mocked API
# ===========================================================================

class TestGenerateBackground:
    def test_returns_12char_asset_id(self, mod, mock_api_key, mock_genai_client, tmp_path):
        """generate_background returns hash_key[:12] (12-char asset ID) on success."""
        registry_path = os.path.join(str(tmp_path), "asset_registry.json")
        with open(registry_path, "w") as f:
            json.dump({"backgrounds": []}, f)

        bg_dir = os.path.join(str(tmp_path), "background")
        with patch.object(mod, "REGISTRY_PATH", registry_path), \
             patch.object(mod, "BACKGROUND_DIR", bg_dir):
            result = mod.generate_background(
                "background", "sunset over mountains",
                "a1b2c3d4e5f6a1b2c3d4e5f6"
            )

        assert result == "a1b2c3d4e5f6"
        assert len(result) == 12

    def test_saves_image_to_background_dir(self, mod, mock_api_key, mock_genai_client, tmp_path):
        """generate_background saves the image to BACKGROUND_DIR."""
        registry_path = os.path.join(str(tmp_path), "asset_registry.json")
        with open(registry_path, "w") as f:
            json.dump({"backgrounds": []}, f)

        bg_dir = os.path.join(str(tmp_path), "background")
        with patch.object(mod, "REGISTRY_PATH", registry_path), \
             patch.object(mod, "BACKGROUND_DIR", bg_dir):
            mod.generate_background("background", "sunset", "abcd1234567890")

        assert os.path.isdir(bg_dir)
        assert os.path.isfile(os.path.join(bg_dir, "abcd12345678.jpg"))

    def test_updates_registry_after_generation(self, mod, mock_api_key, mock_genai_client, tmp_path):
        """generate_background adds entry to asset_registry.json after save."""
        registry_path = os.path.join(str(tmp_path), "asset_registry.json")
        with open(registry_path, "w") as f:
            json.dump({"backgrounds": []}, f)

        bg_dir = os.path.join(str(tmp_path), "background")
        with patch.object(mod, "REGISTRY_PATH", registry_path), \
             patch.object(mod, "BACKGROUND_DIR", bg_dir):
            mod.generate_background("background", "sunset", "bg001234567890")

        with open(registry_path, "r") as f:
            data = json.load(f)
        assert any(e["id"] == "bg0012345678" for e in data.get("backgrounds", []))

    def test_returns_none_when_no_api_key(self, mod, monkeypatch):
        """generate_background returns None if no API key configured."""
        monkeypatch.delenv("GOOGLE_GENERATIVE_AI_API_KEY", raising=False)
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        result = mod.generate_background("background", "sunset", "hash1234567890")
        assert result is None

    def test_returns_none_on_empty_api_response(self, mod, mock_api_key, mock_genai_client, tmp_path):
        """generate_background returns None if API returns no images."""
        mock_genai_client.models.generate_images.return_value.generated_images = []
        registry_path = os.path.join(str(tmp_path), "asset_registry.json")
        with open(registry_path, "w") as f:
            json.dump({"backgrounds": []}, f)

        bg_dir = os.path.join(str(tmp_path), "background")
        with patch.object(mod, "REGISTRY_PATH", registry_path), \
             patch.object(mod, "BACKGROUND_DIR", bg_dir):
            result = mod.generate_background("background", "sunset", "hash1234567890")
        assert result is None

    def test_returns_none_on_api_exception(self, mod, mock_api_key, mock_genai_client, tmp_path):
        """generate_background returns None if API call throws exception."""
        mock_genai_client.models.generate_images.side_effect = Exception("API error")
        bg_dir = os.path.join(str(tmp_path), "background")
        with patch.object(mod, "BACKGROUND_DIR", bg_dir):
            result = mod.generate_background("background", "sunset", "hash1234567890")
        assert result is None

    def test_augments_background_prompt(self, mod, mock_api_key, mock_genai_client, tmp_path):
        """generate_background augments prompt with background-specific keywords."""
        registry_path = os.path.join(str(tmp_path), "asset_registry.json")
        with open(registry_path, "w") as f:
            json.dump({"backgrounds": []}, f)

        bg_dir = os.path.join(str(tmp_path), "background")
        with patch.object(mod, "REGISTRY_PATH", registry_path), \
             patch.object(mod, "BACKGROUND_DIR", bg_dir):
            mod.generate_background("background", "forest", "hash1234567890")

        call_args = mock_genai_client.models.generate_images.call_args
        prompt_used = call_args.kwargs["prompt"]
        assert "background" in prompt_used.lower()
        assert "forest" in prompt_used
        assert "cinematic" in prompt_used.lower()


# ===========================================================================
# AC4b: Gemini fallback when Imagen fails
# ===========================================================================

class TestGeminiFallback:
    def test_falls_back_to_gemini_when_imagen_fails(
        self, mod, mock_api_key, tmp_path, fake_jpeg_bytes
    ):
        """When Imagen generate_images raises, fallback calls generate_content."""
        registry_path = os.path.join(str(tmp_path), "asset_registry.json")
        with open(registry_path, "w") as f:
            json.dump({"backgrounds": []}, f)
        bg_dir = os.path.join(str(tmp_path), "background")

        # Mock Imagen to fail, Gemini fallback to succeed
        mock_inline_data = MagicMock()
        mock_inline_data.mime_type = "image/jpeg"
        mock_inline_data.data = fake_jpeg_bytes

        mock_part = MagicMock()
        mock_part.inline_data = mock_inline_data

        mock_content = MagicMock()
        mock_content.parts = [mock_part]

        mock_candidate = MagicMock()
        mock_candidate.content = mock_content

        mock_fallback_response = MagicMock()
        mock_fallback_response.candidates = [mock_candidate]

        mock_client = MagicMock()
        mock_client.models.generate_images.side_effect = Exception("Imagen down")
        mock_client.models.generate_content.return_value = mock_fallback_response

        with patch("google.genai.Client", return_value=mock_client, create=True), \
             patch("google.genai.types.GenerateImagesConfig", create=True), \
             patch("google.genai.types.GenerateContentConfig", create=True):
            with patch.object(mod, "REGISTRY_PATH", registry_path), \
                 patch.object(mod, "BACKGROUND_DIR", bg_dir):
                result = mod.generate_background(
                    "background", "forest", "hash1234567890"
                )

        assert result == "hash12345678"
        # Verify generate_content was called (fallback path)
        mock_client.models.generate_content.assert_called_once()

    def test_fallback_also_fails_returns_none(self, mod, mock_api_key, tmp_path):
        """When both Imagen and Gemini fail, returns None."""
        bg_dir = os.path.join(str(tmp_path), "background")

        mock_client = MagicMock()
        mock_client.models.generate_images.side_effect = Exception("Imagen down")
        mock_client.models.generate_content.side_effect = Exception("Gemini down")

        with patch("google.genai.Client", return_value=mock_client, create=True), \
             patch("google.genai.types.GenerateImagesConfig", create=True), \
             patch("google.genai.types.GenerateContentConfig", create=True):
            with patch.object(mod, "BACKGROUND_DIR", bg_dir):
                result = mod.generate_background(
                    "background", "forest", "hash1234567890"
                )

        assert result is None


# ===========================================================================
# AC5: generate_expression — full integration with mocked API
# ===========================================================================

class TestGenerateExpression:
    def test_returns_12char_asset_id(self, mod, mock_api_key, mock_genai_client, tmp_path):
        """generate_expression returns hash_key[:12] (12-char asset ID) on success."""
        registry_path = os.path.join(str(tmp_path), "asset_registry.json")
        with open(registry_path, "w") as f:
            json.dump({"expressions": []}, f)

        expr_dir = os.path.join(str(tmp_path), "expressions")
        with patch.object(mod, "REGISTRY_PATH", registry_path), \
             patch.object(mod, "EXPRESSION_DIR", expr_dir):
            result = mod.generate_expression(
                "expression", "happy face", "face1234567890"
            )

        assert result == "face12345678"
        assert len(result) == 12

    def test_saves_image_to_expression_dir(self, mod, mock_api_key, mock_genai_client, tmp_path):
        """generate_expression saves image to EXPRESSION_DIR."""
        registry_path = os.path.join(str(tmp_path), "asset_registry.json")
        with open(registry_path, "w") as f:
            json.dump({"expressions": []}, f)

        expr_dir = os.path.join(str(tmp_path), "expressions")
        with patch.object(mod, "REGISTRY_PATH", registry_path), \
             patch.object(mod, "EXPRESSION_DIR", expr_dir):
            mod.generate_expression("expression", "happy", "expr1234567890")

        assert os.path.isdir(expr_dir)
        assert os.path.isfile(os.path.join(expr_dir, "expr12345678.jpg"))

    def test_updates_registry_after_generation(self, mod, mock_api_key, mock_genai_client, tmp_path):
        """generate_expression adds entry to asset_registry.json after save."""
        registry_path = os.path.join(str(tmp_path), "asset_registry.json")
        with open(registry_path, "w") as f:
            json.dump({"expressions": []}, f)

        expr_dir = os.path.join(str(tmp_path), "expressions")
        with patch.object(mod, "REGISTRY_PATH", registry_path), \
             patch.object(mod, "EXPRESSION_DIR", expr_dir):
            mod.generate_expression("expression", "happy", "expr1234567890")

        with open(registry_path, "r") as f:
            data = json.load(f)
        assert any(e["id"] == "expr12345678" for e in data.get("expressions", []))

    def test_augments_expression_prompt(self, mod, mock_api_key, mock_genai_client, tmp_path):
        """generate_expression augments prompt with 'character expression sprite, green screen'."""
        registry_path = os.path.join(str(tmp_path), "asset_registry.json")
        with open(registry_path, "w") as f:
            json.dump({"expressions": []}, f)

        expr_dir = os.path.join(str(tmp_path), "expressions")
        with patch.object(mod, "REGISTRY_PATH", registry_path), \
             patch.object(mod, "EXPRESSION_DIR", expr_dir):
            mod.generate_expression("expression", "happy face", "hash1234567890")

        call_args = mock_genai_client.models.generate_images.call_args
        prompt_used = call_args.kwargs["prompt"]
        assert "character expression sprite" in prompt_used.lower()
        assert "green screen" in prompt_used.lower()

    def test_returns_none_when_no_api_key(self, mod, monkeypatch):
        """generate_expression returns None if no API key configured."""
        monkeypatch.delenv("GOOGLE_GENERATIVE_AI_API_KEY", raising=False)
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        result = mod.generate_expression("expression", "happy", "hash1234567890")
        assert result is None


# ===========================================================================
# AC6: Unified generator() dispatch
# ===========================================================================

class TestGeneratorDispatch:
    def test_dispatches_background_type(self, mod, mock_api_key, mock_genai_client, tmp_path):
        """generator routes 'background' -> generate_background."""
        registry_path = os.path.join(str(tmp_path), "asset_registry.json")
        with open(registry_path, "w") as f:
            json.dump({"backgrounds": []}, f)

        bg_dir = os.path.join(str(tmp_path), "background")
        with patch.object(mod, "REGISTRY_PATH", registry_path), \
             patch.object(mod, "BACKGROUND_DIR", bg_dir):
            result = mod.generator("background", "sunset", "bg123456789000")
        assert result == "bg1234567890"

    def test_dispatches_bg_alias(self, mod, mock_api_key, mock_genai_client, tmp_path):
        """generator routes 'bg' alias -> generate_background."""
        registry_path = os.path.join(str(tmp_path), "asset_registry.json")
        with open(registry_path, "w") as f:
            json.dump({"backgrounds": []}, f)

        bg_dir = os.path.join(str(tmp_path), "background")
        with patch.object(mod, "REGISTRY_PATH", registry_path), \
             patch.object(mod, "BACKGROUND_DIR", bg_dir):
            result = mod.generator("bg", "sunset", "bg123456789000")
        assert result == "bg1234567890"

    def test_dispatches_expression_type(self, mod, mock_api_key, mock_genai_client, tmp_path):
        """generator routes 'expression' -> generate_expression."""
        registry_path = os.path.join(str(tmp_path), "asset_registry.json")
        with open(registry_path, "w") as f:
            json.dump({"expressions": []}, f)

        expr_dir = os.path.join(str(tmp_path), "expressions")
        with patch.object(mod, "REGISTRY_PATH", registry_path), \
             patch.object(mod, "EXPRESSION_DIR", expr_dir):
            result = mod.generator("expression", "happy", "expr1234567890")
        assert result == "expr12345678"

    def test_dispatches_expr_alias(self, mod, mock_api_key, mock_genai_client, tmp_path):
        """generator routes 'expr' alias -> generate_expression."""
        registry_path = os.path.join(str(tmp_path), "asset_registry.json")
        with open(registry_path, "w") as f:
            json.dump({"expressions": []}, f)

        expr_dir = os.path.join(str(tmp_path), "expressions")
        with patch.object(mod, "REGISTRY_PATH", registry_path), \
             patch.object(mod, "EXPRESSION_DIR", expr_dir):
            result = mod.generator("expr", "happy", "expr1234567890")
        assert result == "expr12345678"

    def test_unknown_type_returns_none(self, mod):
        """generator returns None for unknown asset_type."""
        result = mod.generator("unknown_type", "prompt", "hash1234567890")
        assert result is None
