import os
import json
import time
import sys
import re
import gc
from difflib import SequenceMatcher
import whisperx
from faster_whisper.audio import decode_audio

# Thiết lập encoding UTF-8 cho console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

def clean_word(word):
    """Làm sạch từ để so khớp (bỏ dấu câu, viết thường)."""
    return re.sub(r'[^\w\s]', '', word).lower().strip()

def align_subtitles_precise(original_text, whisper_results):
    """
    Thuật toán so khớp chuỗi (Sequence Matching) để ánh xạ timing chuẩn xác nhất.
    Không dùng nội suy tuyến tính toàn bộ mà dựa trên từng từ khớp được.
    """
    original_words = original_text.split()
    # Danh sách từ đã làm sạch từ Whisper
    whisper_words_clean = [clean_word(w['word']) for w in whisper_results]
    # Danh sách từ đã làm sạch từ Kịch bản
    original_words_clean = [clean_word(w) for w in original_words]

    # Dùng SequenceMatcher để tìm các đoạn khớp nhau giữa 2 mảng từ
    matcher = SequenceMatcher(None, original_words_clean, whisper_words_clean)
    matching_blocks = matcher.get_matching_blocks()

    # Mảng kết quả cuối cùng (độ dài bằng đúng original_words)
    final_timings = [None] * len(original_words)

    # 1. Điền timing cho các từ khớp hoàn toàn
    for block in matching_blocks:
        orig_start, whisp_start, length = block
        for i in range(length):
            w_info = whisper_results[whisp_start + i]
            final_timings[orig_start + i] = {
                "text": original_words[orig_start + i],
                "start": w_info['start'],
                "end": w_info['end']
            }

    # 2. Xử lý các từ không khớp bằng cách phân bổ đều thời gian (Interpolation)
    missing_indices = [i for i, t in enumerate(final_timings) if t is None]
    
    if missing_indices:
        # Gom các index bị thiếu liên tiếp thành các nhóm
        groups = []
        current_group = []
        for idx in missing_indices:
            if not current_group or current_group[-1] == idx - 1:
                current_group.append(idx)
            else:
                groups.append(current_group)
                current_group = [idx]
        if current_group:
            groups.append(current_group)
            
        for group in groups:
            first_idx = group[0]
            last_idx = group[-1]
            
            # Tìm mốc thời gian bắt đầu của khoảng trống
            start_time = 0.0
            if first_idx > 0 and final_timings[first_idx - 1] is not None:
                start_time = final_timings[first_idx - 1]['end']
            
            # Tìm mốc thời gian kết thúc của khoảng trống
            end_time = None
            if last_idx < len(final_timings) - 1:
                for j in range(last_idx + 1, len(final_timings)):
                    if final_timings[j] is not None:
                        end_time = final_timings[j]['start']
                        break

            if end_time is None:
                if whisper_results:
                    end_time = whisper_results[-1]['end']
                else:
                    end_time = start_time + len(group) * 0.3
                
            # Tránh lỗi end_time < start_time (do Whisper có thể đè timing)
            if end_time < start_time:
                end_time = start_time + 0.1

            # Chia đều thời gian cho số lượng từ bị thiếu
            time_per_word = (end_time - start_time) / len(group)
            
            for i, idx in enumerate(group):
                final_timings[idx] = {
                    "text": original_words[idx],
                    "start": round(start_time + i * time_per_word, 3),
                    "end": round(start_time + (i + 1) * time_per_word, 3)
                }

    return final_timings

def process_script_with_whisper(json_path):
    """Duyệt script và cập nhật wordTimings bằng Forced Alignment (bỏ qua Transcription)."""
    print(f"🚀 Bắt đầu quy trình Karaoke TỐI ƯU (Bỏ qua Transcribe, chỉ dùng Wav2Vec2)...")
    
    device = "cuda" if os.environ.get("USE_GPU") == "1" else "cpu"
    
    print("⏳ Đang tải mô hình Forced Alignment (Wav2Vec2) tiếng Việt...")
    align_model, metadata = whisperx.load_align_model(language_code="vi", device=device)

    if not os.path.exists(json_path):
        print(f"❌ Không tìm thấy file: {json_path}")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for scene in data.get("scenes", []):
        for shot in scene.get("shots", []):
            audio_id = shot.get("audioId")
            dialogue = shot.get("dialogue", "")
            if not audio_id: continue
                
            audio_path = os.path.join("public", "assets", "audio", "tts", f"{audio_id}.mp3")
            
            if os.path.exists(audio_path):
                print(f"🎙️ Đang ép mốc thời gian (Align): {audio_id}.mp3...")
                
                # Load audio dưới dạng mảng NumPy (Sample rate 16000)
                # Dùng decode_audio của faster_whisper để tránh lỗi thiếu ffmpeg.exe trên Windows
                audio = decode_audio(audio_path, sampling_rate=16000)
                audio_duration = len(audio) / 16000.0
                
                # Lưu trữ duration thật vào file json để Remotion sử dụng làm Auto Pacing
                shot["audioDuration"] = round(audio_duration, 3)
                
                # Tạo segment thô từ kịch bản có sẵn
                mock_segments = [{
                    "text": dialogue,
                    "start": 0.0,
                    "end": audio_duration
                }]
                
                # Align (Ép khớp trực tiếp Text chuẩn vào Audio)
                try:
                    aligned_result = whisperx.align(mock_segments, align_model, metadata, audio, device, return_char_alignments=False)
                    
                    whisper_words = []
                    for segment in aligned_result["segments"]:
                        for word in segment.get("words", []):
                            if "start" in word and "end" in word:
                                whisper_words.append({
                                    "word": word["word"],
                                    "start": word["start"],
                                    "end": word["end"]
                                })
                    
                    if whisper_words:
                        original_words = dialogue.split()
                        if len(original_words) == len(whisper_words):
                            print(f"   ✅ Ép khớp hoàn hảo {len(original_words)} từ.")
                            shot["wordTimings"] = [
                                {"text": original_words[i], "start": whisper_words[i]['start'], "end": whisper_words[i]['end']}
                                for i in range(len(original_words))
                            ]
                        else:
                            print(f"   ⚠️ Lệch từ nhẹ trong quá trình ép ({len(original_words)} vs {len(whisper_words)}), nội suy phần còn lại...")
                            shot["wordTimings"] = align_subtitles_precise(dialogue, whisper_words)
                    else:
                        print(f"⚠️ Cảnh báo: Thuật toán không tìm thấy mốc thời gian nào cho {audio_id}")
                except Exception as e:
                    print(f"❌ Lỗi ép khớp {audio_id}: {str(e)}")

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n✅ HOÀN TẤT QUY TRÌNH KẾT NỐI TIMING SIÊU TỐC!")

if __name__ == "__main__":
    # Cho phép truyền tham số từ command line
    script_arg = sys.argv[1] if len(sys.argv) > 1 else "reviewed_script.json"
    JSON_PATH = os.path.join("public", "scripts", script_arg)
    process_script_with_whisper(JSON_PATH)
