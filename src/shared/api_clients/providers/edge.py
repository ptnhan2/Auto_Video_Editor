import asyncio
import random
import edge_tts
from edge_tts.exceptions import NoAudioReceived

# ── Retry config ──────────────────────────────────────────────
MAX_RETRIES = 3
BASE_DELAY_SEC = 1.0
MAX_JITTER_SEC = 0.5
PRE_CALL_DELAY_MIN = 0.1
PRE_CALL_DELAY_MAX = 0.5
# ──────────────────────────────────────────────────────────────


async def _call_edge_tts(text, voice, filepath, **kwargs):
    """
    Gọi edge_tts một lần, trả về (success_bool, result).
    """
    pitch = kwargs.get("pitch", "+0Hz")
    rate = kwargs.get("rate", "+0%")
    volume = kwargs.get("volume", "+0%")
    proxy = kwargs.get("proxy")

    communicate = edge_tts.Communicate(
        text, voice,
        pitch=pitch, rate=rate, volume=volume, proxy=proxy,
    )

    word_timings = []
    audio_bytes_written = 0
    with open(filepath, "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
                audio_bytes_written += len(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start_sec = chunk.get("offset", 0) / 10000000.0
                duration_sec = chunk.get("duration", 0) / 10000000.0
                word_text = chunk.get("text", "")
                if word_text:
                    word_timings.append({
                        "text": word_text,
                        "start": round(start_sec, 3),
                        "end": round(start_sec + duration_sec, 3),
                    })

    if audio_bytes_written == 0:
        return False, "NoAudioReceived: stream completed with zero audio bytes"

    if not word_timings:
        print(f"   ⚠️  Không tìm thấy Word Timings cho: '{text[:20]}...'")

    return True, {"message": "Thành công!", "word_timings": word_timings}


async def run_edge(text, voice, filepath, **kwargs):
    """
    Render Edge TTS audio với retry logic.

    Retry strategy:
    - Exponential backoff: 1s -> 2s -> 4s
    - Random jitter (0-0.5s) để tránh thundering herd khi retry đồng thời
    - Pre-call delay 100-500ms ngẫu nhiên để trải đều request
    - Catch NoAudioReceived cụ thể để phân biệt với lỗi khác
    """
    last_error = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            # Delay ngẫu nhiên trước mỗi call để trải đều concurrent requests
            pre_delay = random.uniform(PRE_CALL_DELAY_MIN, PRE_CALL_DELAY_MAX)
            await asyncio.sleep(pre_delay)

            success, result = await _call_edge_tts(text, voice, filepath, **kwargs)

            if success:
                return True, result

            last_error = result

        except NoAudioReceived as e:
            last_error = f"NoAudioReceived (attempt {attempt}/{MAX_RETRIES}): {e}"
        except Exception as e:
            return False, f"Lỗi Edge TTS: {str(e)}"

        if attempt < MAX_RETRIES:
            delay = (BASE_DELAY_SEC * (2 ** (attempt - 1))) + random.uniform(0, MAX_JITTER_SEC)
            print(f"   🔄 Retry {attempt + 1}/{MAX_RETRIES} sau {delay:.1f}s... ({last_error})")
            await asyncio.sleep(delay)

    return False, f"Lỗi Edge TTS (sau {MAX_RETRIES} lần thử): {last_error}"


if __name__ == "__main__":
    asyncio.run(run_edge("Chào mừng bạn!", "vi-VN-HoaiMyNeural", "test_edge.mp3"))
