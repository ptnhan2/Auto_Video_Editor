# src/config/ai_models.py

# Cấu hình Model AI cho từng trạm trong Pipeline
# Việc gom nhóm giúp dễ dàng nâng cấp model cho toàn bộ hệ thống.

AI_MODEL_CONFIG = {
    "station_1_rewriter": "gemini-3-flash-preview",
    "station_2_extractor": "gemini-3-flash-preview",
    "station_3_breaker": "gemini-3-flash-preview",
    "station_4_audio": "gemini-2.5-flash",
    "station_5_visual": "gemini-2.5-flash",
    "station_6_vfx": "gemini-2.5-flash"
}

def get_model_for_station(station_key: str) -> str:
    """
    Trả về model_id tương ứng cho từng trạm.
    Nếu không tìm thấy, mặc định trả về gemini-2.5-flash.
    """
    return AI_MODEL_CONFIG.get(station_key, "gemini-2.5-flash")
