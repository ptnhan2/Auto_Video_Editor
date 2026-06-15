import os
import json
import sys
import re
from difflib import SequenceMatcher
import whisperx
from faster_whisper.audio import decode_audio

# Thiáº¿t láº­p encoding UTF-8 cho console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

def clean_word(word):
    """LÃ m sáº¡ch tá»« Ä‘á»ƒ so khá»›p (bá» dáº¥u cÃ¢u, viáº¿t thÆ°á»ng)."""
    return re.sub(r'[^\w\s]', '', word).lower().strip()

def align_subtitles_precise(original_text, whisper_results):
    """
    Thuáº­t toÃ¡n so khá»›p chuá»—i (Sequence Matching) Ä‘á»ƒ Ã¡nh xáº¡ timing chuáº©n xÃ¡c nháº¥t.
    KhÃ´ng dÃ¹ng ná»™i suy tuyáº¿n tÃ­nh toÃ n bá»™ mÃ  dá»±a trÃªn tá»«ng tá»« khá»›p Ä‘Æ°á»£c.
    """
    original_words = original_text.split()
    # Danh sÃ¡ch tá»« Ä‘Ã£ lÃ m sáº¡ch tá»« Whisper
    whisper_words_clean = [clean_word(w['word']) for w in whisper_results]
    # Danh sÃ¡ch tá»« Ä‘Ã£ lÃ m sáº¡ch tá»« Ká»‹ch báº£n
    original_words_clean = [clean_word(w) for w in original_words]

    # DÃ¹ng SequenceMatcher Ä‘á»ƒ tÃ¬m cÃ¡c Ä‘oáº¡n khá»›p nhau giá»¯a 2 máº£ng tá»«
    matcher = SequenceMatcher(None, original_words_clean, whisper_words_clean)
    matching_blocks = matcher.get_matching_blocks()

    # Máº£ng káº¿t quáº£ cuá»‘i cÃ¹ng (Ä‘á»™ dÃ i báº±ng Ä‘Ãºng original_words)
    final_timings = [None] * len(original_words)

    # 1. Äiá»n timing cho cÃ¡c tá»« khá»›p hoÃ n toÃ n
    for block in matching_blocks:
        orig_start, whisp_start, length = block
        for i in range(length):
            w_info = whisper_results[whisp_start + i]
            final_timings[orig_start + i] = {
                "text": original_words[orig_start + i],
                "start": w_info['start'],
                "end": w_info['end']
            }

    # 2. Xá»­ lÃ½ cÃ¡c tá»« khÃ´ng khá»›p báº±ng cÃ¡ch phÃ¢n bá»• Ä‘á»u thá»i gian (Interpolation)
    missing_indices = [i for i, t in enumerate(final_timings) if t is None]
    
    if missing_indices:
        # Gom cÃ¡c index bá»‹ thiáº¿u liÃªn tiáº¿p thÃ nh cÃ¡c nhÃ³m
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
            
            # TÃ¬m má»‘c thá»i gian báº¯t Ä‘áº§u cá»§a khoáº£ng trá»‘ng
            start_time = 0.0
            if first_idx > 0 and final_timings[first_idx - 1] is not None:
                start_time = final_timings[first_idx - 1]['end']
            
            # TÃ¬m má»‘c thá»i gian káº¿t thÃºc cá»§a khoáº£ng trá»‘ng
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
                
            # TrÃ¡nh lá»—i end_time < start_time (do Whisper cÃ³ thá»ƒ Ä‘Ã¨ timing)
            if end_time < start_time:
                end_time = start_time + 0.1

            # Chia Ä‘á»u thá»i gian cho sá»‘ lÆ°á»£ng tá»« bá»‹ thiáº¿u
            time_per_word = (end_time - start_time) / len(group)
            
            for i, idx in enumerate(group):
                final_timings[idx] = {
                    "text": original_words[idx],
                    "start": round(start_time + i * time_per_word, 3),
                    "end": round(start_time + (i + 1) * time_per_word, 3)
                }

    return final_timings

def process_script_with_whisper(json_path):
    """Duyá»‡t script vÃ  cáº­p nháº­t wordTimings báº±ng Forced Alignment (bá» qua Transcription)."""
    print("ðŸš€ Báº¯t Ä‘áº§u quy trÃ¬nh Karaoke Tá»I Æ¯U (Bá» qua Transcribe, chá»‰ dÃ¹ng Wav2Vec2)...")
    
    device = "cuda" if os.environ.get("USE_GPU") == "1" else "cpu"
    
    print("â³ Äang táº£i mÃ´ hÃ¬nh Forced Alignment (Wav2Vec2) tiáº¿ng Viá»‡t...")
    align_model, metadata = whisperx.load_align_model(language_code="vi", device=device)

    if not os.path.exists(json_path):
        print(f"âŒ KhÃ´ng tÃ¬m tháº¥y file: {json_path}")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for scene in data.get("scenes", []):
        for shot in scene.get("shots", []):
            audio_id = shot.get("audioId")
            dialogue = shot.get("dialogue", "")
            if not audio_id:
                continue
                
            audio_path = os.path.join("public", "assets", "audio", "tts", f"{audio_id}.mp3")
            
            if os.path.exists(audio_path):
                print(f"ðŸŽ™ï¸ Äang Ã©p má»‘c thá»i gian (Align): {audio_id}.mp3...")
                
                # Load audio dÆ°á»›i dáº¡ng máº£ng NumPy (Sample rate 16000)
                # DÃ¹ng decode_audio cá»§a faster_whisper Ä‘á»ƒ trÃ¡nh lá»—i thiáº¿u ffmpeg.exe trÃªn Windows
                audio = decode_audio(audio_path, sampling_rate=16000)
                audio_duration = len(audio) / 16000.0
                
                # LÆ°u trá»¯ duration tháº­t vÃ o file json Ä‘á»ƒ Remotion sá»­ dá»¥ng lÃ m Auto Pacing
                shot["audioDuration"] = round(audio_duration, 3)
                
                # Táº¡o segment thÃ´ tá»« ká»‹ch báº£n cÃ³ sáºµn
                mock_segments = [{
                    "text": dialogue,
                    "start": 0.0,
                    "end": audio_duration
                }]
                
                # Align (Ã‰p khá»›p trá»±c tiáº¿p Text chuáº©n vÃ o Audio)
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
                            print(f"   âœ… Ã‰p khá»›p hoÃ n háº£o {len(original_words)} tá»«.")
                            shot["wordTimings"] = [
                                {"text": original_words[i], "start": whisper_words[i]['start'], "end": whisper_words[i]['end']}
                                for i in range(len(original_words))
                            ]
                        else:
                            print(f"   âš ï¸ Lá»‡ch tá»« nháº¹ trong quÃ¡ trÃ¬nh Ã©p ({len(original_words)} vs {len(whisper_words)}), ná»™i suy pháº§n cÃ²n láº¡i...")
                            shot["wordTimings"] = align_subtitles_precise(dialogue, whisper_words)
                    else:
                        print(f"âš ï¸ Cáº£nh bÃ¡o: Thuáº­t toÃ¡n khÃ´ng tÃ¬m tháº¥y má»‘c thá»i gian nÃ o cho {audio_id}")
                except Exception as e:
                    print(f"âŒ Lá»—i Ã©p khá»›p {audio_id}: {str(e)}")

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("\nâœ… HOÃ€N Táº¤T QUY TRÃŒNH Káº¾T Ná»I TIMING SIÃŠU Tá»C!")

if __name__ == "__main__":
    # Cho phÃ©p truyá»n tham sá»‘ tá»« command line
    script_arg = sys.argv[1] if len(sys.argv) > 1 else "reviewed_script.json"
    JSON_PATH = os.path.join("public", "scripts", script_arg)
    process_script_with_whisper(JSON_PATH)
