import os
from dotenv import load_dotenv
from mutagen.mp3 import MP3
from .providers.tiktok import run_tiktok
from .providers.elevenlabs import run_elevenlabs
from .providers.edge import run_edge  # noqa: F401 — fallback in render()
import json
import sys

# Ensure UTF-8 output for console
sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

class TTSManager:
    def __init__(self):
        # Load keys from .env
        keys_str = os.getenv("ELEVENLABS_KEYS", "")
        self.elevenlabs_keys = [k.strip() for k in keys_str.split(",") if k.strip()]
        
        # Load proxies from environment
        self.proxies = []
        proxy_str = os.getenv("PROXY_LIST", "")
        if proxy_str:
            for item in proxy_str.split(","):
                parts = item.strip().split(":")
                if len(parts) == 4:
                    host, port, user, pw = parts
                    self.proxies.append(f"http://{user}:{pw}@{host}:{port}")
        
        self.proxy_index = 0
        
        # Audio assets dir
        self.asset_dir = os.path.join("public", "assets", "audio", "tts")
        if not os.path.exists(self.asset_dir):
            os.makedirs(self.asset_dir)

    def get_next_proxy(self):
        if not self.proxies:
            return None
        proxy = self.proxies[self.proxy_index]
        self.proxy_index = (self.proxy_index + 1) % len(self.proxies)
        return proxy

    async def render(self, text, provider, voice, filename, **kwargs):
        filepath = os.path.join(self.asset_dir, filename if filename.endswith(".mp3") else f"{filename}.mp3")
        
        # Thêm proxy nếu có
        if "proxy" not in kwargs:
            kwargs["proxy"] = self.get_next_proxy()
        
        # Bỏ qua nếu file đã tồn tại
        if os.path.exists(filepath):
            return True, f"Bỏ qua: File '{filename}' đã tồn tại."

        if provider == "edge":
            return await run_edge(text, voice, filepath, **kwargs)
            
        elif provider == "tiktok":
            session = kwargs.get("session", os.getenv("TIKTOK_SESSION_ID", ""))
            return run_tiktok(text, voice, session, filepath)
            
        elif provider == "elevenlabs":
            model = kwargs.get("model", "eleven_multilingual_v2")
            settings = kwargs.get("settings", {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.0,
                "use_speaker_boost": True
            })
            latency = kwargs.get("latency", 0)
            return run_elevenlabs(text, voice, model, settings, latency, filepath, self.elevenlabs_keys)
        
        else:
            return False, f"Provider '{provider}' không được hỗ trợ."

    async def batch_render(self, review_json_path):
        """
        Đọc file JSON đã được duyệt (Reviewed Script), duyệt qua từng dòng thoại,
        tra cứu Voice Profile và tiến hành gọi API render âm thanh hàng loạt.
        Cơ chế: Bỏ qua các dòng đã có file audio (Idempotent).
        """
        if not os.path.exists(review_json_path):
            print(f"❌ File '{review_json_path}' không tồn tại. Vui lòng phê duyệt kịch bản trước khi render.")
            return

        with open(review_json_path, 'r', encoding='utf-8') as f:
            script_data = json.load(f)

        # Đọc cấu hình ánh xạ giọng đọc (Mô phỏng đọc từ TypeScript/JSON)
        voice_profiles = self._load_voice_profiles()
        
        print("🚀 Bắt đầu Batch Render Audio...")
        success_count = 0
        fail_count = 0

        for scene in script_data.get('scenes', []):
            scene_duration = 0.0

            for shot in scene.get('shots', []):
                dialogue = shot.get('dialogue')
                speaker_id = shot.get('characterId', 'narrator')
                audio_id = shot.get('audioId')

                if dialogue and audio_id:
                    profile = voice_profiles.get(speaker_id)
                    if not profile:
                        print(f"⚠️ Cảnh báo: Không tìm thấy Voice Profile cho nhân vật '{speaker_id}'. Bỏ qua dòng: '{dialogue[:20]}...'")
                        fail_count += 1
                        continue

                    provider = profile.get('provider')
                    voice = profile.get('voice')
                    settings = profile.get('settings', {})
                    
                    print(f"⏳ Đang render '{audio_id}.mp3' [{provider}] (Nhân vật: {speaker_id})...")
                    
                    try:
                        success, result = await self.render(dialogue, provider, voice, audio_id, **settings)
                        if success:
                            success_count += 1
                            filepath = os.path.join(self.asset_dir, audio_id if audio_id.endswith(".mp3") else f"{audio_id}.mp3")
                            if os.path.exists(filepath):
                                audio = MP3(filepath)
                                duration = round(audio.info.length, 2)
                                shot['audioDuration'] = duration
                                scene_duration += duration
                                
                                # Lưu word-level timings nếu có
                                if isinstance(result, dict) and "word_timings" in result:
                                    shot['wordTimings'] = result["word_timings"]
                                    print(f"   ⏱ Thời lượng: {duration}s (Đã lấy Word Timings)")
                                else:
                                    print(f"   ⏱ Thời lượng: {duration}s")
                        else:
                            print(f"❌ Lỗi khi render '{audio_id}': {result}")
                            fail_count += 1
                    except Exception as e:
                        print(f"❌ Ngoại lệ khi render '{audio_id}': {e}")
                        fail_count += 1

            # Update scene duration (add a small buffer or keep it exact)
            scene['durationSeconds'] = round(scene_duration + 0.5, 2) if scene_duration > 0 else 5.0

        # Save back the JSON with updated audioDuration and durationSeconds
        with open(review_json_path, 'w', encoding='utf-8') as f:
            json.dump(script_data, f, ensure_ascii=False, indent=2)
        print(f"📝 Đã cập nhật thời lượng vào file kịch bản: {review_json_path}")

        print(f"\n✅ Hoàn tất Batch Render: {success_count} thành công, {fail_count} thất bại.")
        
        if success_count > 0:
            print("🔄 Đang đồng bộ Audio Asset Registry...")
            os.system("npm run sync-assets")
            print("🎉 Xong!")


    def _load_voice_profiles(self):
        """
        Đồng bộ với src/config/voice-profiles.ts
        """
        return {
            "narrator": {
                "provider": "edge",
                "voice": "vi-VN-HoaiMyNeural",
                "settings": { "rate": "+0%", "pitch": "+0Hz" }
            },
            "char_tu_mong": {
                "provider": "edge",
                "voice": "vi-VN-HoaiMyNeural",
                "settings": { "rate": "+10%", "pitch": "+5Hz" }
            },
            "char_phung_yen_van": {
                "provider": "edge",
                "voice": "vi-VN-HoaiMyNeural",
                "settings": { "rate": "-10%", "pitch": "-2Hz" }
            },
            "char_tiet_lao_thai": {
                "provider": "edge",
                "voice": "vi-VN-HoaiMyNeural",
                "settings": { "rate": "+20%", "pitch": "+10Hz" }
            },
            "char_di_dai_phao": {
                "provider": "edge",
                "voice": "vi-VN-HoaiMyNeural",
                "settings": { "rate": "+5%", "pitch": "+0Hz" }
            }
        }
