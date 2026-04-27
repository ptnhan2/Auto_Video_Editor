import asyncio
import edge_tts

async def run_edge(text, voice, filepath, **kwargs):
    try:
        pitch = kwargs.get('pitch', '+0Hz')
        rate = kwargs.get('rate', '+0%')
        volume = kwargs.get('volume', '+0%')
        proxy = kwargs.get('proxy')
        
        communicate = edge_tts.Communicate(text, voice, pitch=pitch, rate=rate, volume=volume, proxy=proxy)
        
        # Trích xuất word timings trực tiếp từ stream
        word_timings = []
        with open(filepath, "wb") as f:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    # offset và duration của edge-tts tính bằng đơn vị 100-nanosecond (ticks)
                    # 1 giây = 10,000,000 ticks
                    start_sec = chunk.get("offset", 0) / 10000000.0
                    duration_sec = chunk.get("duration", 0) / 10000000.0
                    word_text = chunk.get("text", "")
                    if word_text:
                        word_timings.append({
                            "text": word_text,
                            "start": round(start_sec, 3),
                            "end": round(start_sec + duration_sec, 3)
                        })
            
        if not word_timings and len(text) > 10:
            print(f"   ⚠️ Không tìm thấy Word Timings cho: '{text[:20]}...'")
        elif not word_timings:
            # Đối với câu cực ngắn, việc không có word timings là bình thường, không cần cảnh báo
            pass
            
        return True, {"message": "Thành công!", "word_timings": word_timings}
    except Exception as e:
        return False, f"Lỗi Edge TTS: {str(e)}"

if __name__ == "__main__":
    # Test
    asyncio.run(run_edge("Chào mừng bạn!", "vi-VN-HoaiMyNeural", "test_edge.mp3"))
