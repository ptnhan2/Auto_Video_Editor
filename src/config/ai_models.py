# src/config/ai_models.py

# Cấu hình Model AI cho từng trạm trong Pipeline.
# Việc gom nhóm giúp dễ dàng nâng cấp model cho toàn bộ hệ thống.
#
# Model names use the litellm provider prefix convention:
#   gemini/<model>   — Google Gemini via AI Studio
#   deepseek/<model> — DeepSeek (placeholder for GW-2/GW-3)
#
# NOTE: gemini-3-flash-preview and gemini-embedding-2 are not available
# through litellm's Gemini provider (as of May 2026). Nearest equivalents:
#   gemini-3-flash-preview → gemini-2.0-flash (equivalent capability tier)
#   gemini-embedding-2      → text-embedding-004  (recommended upgrade)
# Model IDs will be updated for GW-2/GW-3 when DeepSeek fallback is added.

AI_MODEL_CONFIG = {
    "station_1_rewriter": "gemini/gemini-2.0-flash",
    "station_2_extractor": "gemini/gemini-2.0-flash",
    "station_3_breaker": "gemini/gemini-2.0-flash",
    "station_4_audio": "gemini/gemini-2.5-flash",
    "station_5_visual": "gemini/gemini-2.5-flash",
    "station_6_vfx": "gemini/gemini-2.5-flash",
}

EMBEDDING_MODEL = "gemini/text-embedding-004"


def get_model_for_station(station_key: str) -> str:
    """
    Trả về model_id với provider prefix tương ứng cho từng trạm.
    Nếu không tìm thấy, mặc định trả về gemini/gemini-2.5-flash.
    """
    return AI_MODEL_CONFIG.get(station_key, "gemini/gemini-2.5-flash")


def get_embedding_model() -> str:
    return EMBEDDING_MODEL
