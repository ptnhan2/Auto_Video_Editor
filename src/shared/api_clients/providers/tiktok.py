import requests
import base64

def run_tiktok(text, voice, session, filepath):
    try:
        url = "https://api16-normal-v6.tiktokv.com/media/api/text/speech/invoke/"
        params = {
            "text_speaker": voice,
            "req_text": text,
            "speaker_map_type": 0,
            "aid": 1233
        }
        headers = {
            "User-Agent": "com.zhiliaoapp.musically",
            "Cookie": f"sessionid={session}"
        }
        res = requests.post(url, params=params, headers=headers)
        
        if res.status_code == 200:
            data = res.json()
            if data.get("status_code") == 0:
                v_str = data["data"]["v_str"]
                with open(filepath, "wb") as f:
                    f.write(base64.b64decode(v_str))
                return True, "Thành công!"
            else:
                return False, f"TikTok API error: {data.get('status_msg')}"
        else:
            return False, f"TikTok connection error: {res.status_code}"
    except Exception as e:
        return False, f"Lỗi TikTok: {str(e)}"
