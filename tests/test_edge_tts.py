"""Tests for edge.py — retry logic, error handling, and jitter.

TDD: These tests MUST FAIL before production code is written.
"""
import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from edge_tts.exceptions import NoAudioReceived

from src.shared.api_clients.providers import edge as edge_module


# ── Helper: build a mock edge_tts.Communicate ──────────────

def _mock_stream(*chunks):
    """Create an async generator mock that yields given chunks."""

    async def _gen():
        for chunk in chunks:
            yield chunk

    return _gen


def _mock_communicate(stream_fn):
    """Build a MagicMock that wraps edge_tts.Communicate with given stream."""
    mock_cls = MagicMock()
    mock_inst = MagicMock()
    mock_inst.stream = stream_fn
    mock_cls.return_value = mock_inst
    return mock_cls


# ── Tests: Import + config ───────────────────────────────

class TestConfig:
    """Verify retry configuration constants exist and have reasonable values."""

    def test_max_retries_defined(self):
        """MAX_RETRIES is defined and between 1 and 5."""
        assert hasattr(edge_module, "MAX_RETRIES")
        assert 1 <= edge_module.MAX_RETRIES <= 5

    def test_pre_call_delay_range_valid(self):
        """PRE_CALL_DELAY_MIN < PRE_CALL_DELAY_MAX."""
        assert hasattr(edge_module, "PRE_CALL_DELAY_MIN")
        assert hasattr(edge_module, "PRE_CALL_DELAY_MAX")
        assert edge_module.PRE_CALL_DELAY_MIN < edge_module.PRE_CALL_DELAY_MAX


# ── Tests: NoAudioReceived import ────────────────────────

class TestNoAudioReceivedImport:
    """Verify NoAudioReceived is importable from edge_tts.exceptions."""

    def test_noaudioreceived_is_exception(self):
        """NoAudioReceived is a subclass of Exception."""
        assert issubclass(NoAudioReceived, Exception)


# ── Tests: Basic success path ─────────────────────────────

class TestEdgeTTSSuccess:
    """Happy-path: run_edge succeeds when TTS returns audio + metadata."""

    @pytest.mark.asyncio
    async def test_success_returns_tuple(self, tmp_path):
        """run_edge returns (True, dict) with word_timings on success."""
        filepath = tmp_path / "test.mp3"
        chunks = [
            {"type": "WordBoundary", "offset": 0, "duration": 10000000, "text": "Hello"},
            {"type": "audio", "data": b"\xff\xfb\x90\x00" * 100},
        ]
        mock_cls = _mock_communicate(_mock_stream(*chunks))

        with patch.object(edge_module.edge_tts, "Communicate", mock_cls):
            success, result = await edge_module.run_edge(
                "Hello world", "en-US-JennyNeural", str(filepath)
            )

        assert success is True
        assert isinstance(result, dict)
        assert "word_timings" in result
        assert len(result["word_timings"]) == 1
        assert result["word_timings"][0]["text"] == "Hello"

    @pytest.mark.asyncio
    async def test_audio_file_has_content(self, tmp_path):
        """Output file exists and has non-zero size after success."""
        filepath = tmp_path / "test.mp3"
        chunks = [
            {"type": "audio", "data": b"\xff\xfb\x90\x00" * 100},
        ]
        mock_cls = _mock_communicate(_mock_stream(*chunks))

        with patch.object(edge_module.edge_tts, "Communicate", mock_cls):
            success, _ = await edge_module.run_edge(
                "Hello world", "en-US-JennyNeural", str(filepath)
            )

        assert success is True
        assert os.path.exists(filepath)
        assert os.path.getsize(filepath) > 0


# ── Tests: Retry on NoAudioReceived ────────────────────────

class TestEdgeTTSRetry:
    """Retry behavior: run_edge retries on NoAudioReceived, gives up after max."""

    @pytest.mark.asyncio
    async def test_retry_then_succeed(self, tmp_path):
        """run_edge retries after NoAudioReceived and eventually succeeds."""
        filepath = tmp_path / "test.mp3"
        call_count = [0]

        async def _flaky():
            call_count[0] += 1
            if call_count[0] <= 2:
                raise NoAudioReceived(f"No audio (call #{call_count[0]})")
            yield {"type": "WordBoundary", "offset": 0, "duration": 10000000, "text": "Hello"}
            yield {"type": "audio", "data": b"\xff\xfb\x90\x00" * 100}

        mock_cls = _mock_communicate(_flaky)

        with patch.object(edge_module.edge_tts, "Communicate", mock_cls):
            success, result = await edge_module.run_edge(
                "Hello world", "en-US-JennyNeural", str(filepath)
            )

        assert success is True
        assert isinstance(result, dict)
        assert call_count[0] == 3  # 2 fails + 1 success = 3 calls

    @pytest.mark.asyncio
    async def test_all_retries_exhausted(self, tmp_path):
        """run_edge returns False after all MAX_RETRIES fail with NoAudioReceived."""
        filepath = tmp_path / "test.mp3"

        async def _always_fail():
            raise NoAudioReceived("No audio was received.")
            yield  # make it an async generator so stream() iteration works

        mock_cls = _mock_communicate(_always_fail)

        with patch.object(edge_module.edge_tts, "Communicate", mock_cls):
            success, result = await edge_module.run_edge(
                "Hello world", "en-US-JennyNeural", str(filepath)
            )

        assert success is False
        # Error message should mention retries exhausted
        assert isinstance(result, str)
        assert "NoAudioReceived" in result


# ── Tests: Zero audio detection ───────────────────────────

class TestEdgeTTSZeroAudio:
    """Zero audio: stream completes but writes zero audio bytes → treated as failure."""

    @pytest.mark.asyncio
    async def test_zero_audio_bytes_fails(self, tmp_path):
        """Stream yields only metadata, no audio → returns False after retries."""
        filepath = tmp_path / "test.mp3"
        chunks = [
            {"type": "WordBoundary", "offset": 0, "duration": 10000000, "text": "Hello"},
            # No audio chunk at all
        ]
        mock_cls = _mock_communicate(_mock_stream(*chunks))

        with patch.object(edge_module.edge_tts, "Communicate", mock_cls):
            success, result = await edge_module.run_edge(
                "Hello world", "en-US-JennyNeural", str(filepath)
            )

        assert success is False
        assert isinstance(result, str)
        assert "NoAudioReceived" in result or "zero audio" in result.lower()


# ── Tests: Non-NoAudioReceived exception ───────────────────

class TestEdgeTTSNonRetryable:
    """Non-NoAudioReceived exceptions are NOT retried — fail immediately."""

    @pytest.mark.asyncio
    async def test_value_error_not_retried(self, tmp_path):
        """ValueError is not retried, fails on first attempt."""
        filepath = tmp_path / "test.mp3"

        async def _raise_value_error():
            raise ValueError("Some other error")
            yield  # make it an async generator

        mock_cls = _mock_communicate(_raise_value_error)

        with patch.object(edge_module.edge_tts, "Communicate", mock_cls):
            success, result = await edge_module.run_edge(
                "Hello world", "en-US-JennyNeural", str(filepath)
            )

        assert success is False
        assert "Lỗi Edge TTS" in result
        # Must NOT have retry suffix
        assert "sau" not in result


# ── Tests: Pre-call delay / jitter ────────────────────────

class TestEdgeTTSPreCallDelay:
    """Pre-call random delay is applied to spread concurrent requests."""

    @pytest.mark.asyncio
    async def test_delay_between_calls(self, tmp_path):
        """Verify that asyncio.sleep is called at least once (pre-call delay)."""
        filepath = tmp_path / "test.mp3"
        chunks = [
            {"type": "audio", "data": b"\xff\xfb\x90\x00" * 100},
        ]
        mock_cls = _mock_communicate(_mock_stream(*chunks))

        with patch.object(edge_module.edge_tts, "Communicate", mock_cls):
            with patch.object(edge_module.asyncio, "sleep", new_callable=AsyncMock) as mock_sleep:
                success, _ = await edge_module.run_edge(
                    "Hello world", "en-US-JennyNeural", str(filepath)
                )

        assert success is True
        # Pre-call delay must have been called at least once
        assert mock_sleep.call_count >= 1
