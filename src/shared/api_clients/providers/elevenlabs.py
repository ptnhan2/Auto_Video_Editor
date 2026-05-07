import requests
import base64

def run_elevenlabs(text, voice_id, model, settings, latency, filepath, keys):
    if not keys:
        return False, "Không có Key ElevenLabs"

    # URL construction based on model
    if model == "eleven_v3":
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps"
    else:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps?optimize_streaming_latency={latency}"
    
    # Payload
    payload = {
        "text": text,
        "model_id": model,
        "voice_settings": settings
    }
    
    # Add language_code for quality (supported models)
    if "v2_5" in model or "v3" in model:
        payload["language_code"] = "vi"

    last_error = ""
    for key in keys:
        try:
            headers = {
                "xi-api-key": key,
                "Accept": "audio/mpeg"
            }
            res = requests.post(url, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                # Decode audio
                audio_content = base64.b64decode(data["audio_base64"])
                with open(filepath, "wb") as f:
                    f.write(audio_content)
                
                # Trích xuất word timings từ alignment data
                alignment = data.get("alignment", {})
                chars = alignment.get("characters", [])
                start_times = alignment.get("character_start_times_seconds", [])
                end_times = alignment.get("character_end_times_seconds", [])
                
                word_timings = []
                current_word = ""
                word_start = 0
                
                for i in range(len(chars)):
                    char = chars[i]
                    if char == " ":
                        if current_word:
                            word_timings.append({
                                "text": current_word,
                                "start": word_start,
                                "end": end_times[i-1]
                            })
                            current_word = ""
                    else:
                        if not current_word:
                            word_start = start_times[i]
                        current_word += char
                
                # Add last word
                if current_word:
                    word_timings.append({
                        "text": current_word,
                        "start": word_start,
                        "end": end_times[-1]
                    })

                return True, {"message": "Thành công!", "word_timings": word_timings}
            else:
                last_error = f"{res.status_code}: {res.text[:100]}"
                print(f"Error using key {key[:5]}...: {last_error}")
        except Exception as e:
            last_error = str(e)
            print(f"Connection error using key {key[:5]}...: {last_error}")

    return False, f"ElevenLabs failed after trying all keys: {last_error}"

def fetch_voices(key):
    try:
        headers = {"xi-api-key": key}
        res = requests.get("https://api.elevenlabs.io/v1/voices", headers=headers)
        if res.status_code == 200:
            return res.json().get("voices", [])
        return []
    except Exception:
        return []

def fetch_shared_voices(key):
    try:
        headers = {"xi-api-key": key}
        # Correct parameter language=vietnamese according to ElevenLabs
        url = "https://api.elevenlabs.io/v1/shared-voices?language=vietnamese&page_size=100"
        res = requests.get(url, headers=headers)
        if res.status_code == 200:
            return res.json().get("voices", [])
        return []
    except Exception:
        return []
