# src/config/ai_models.py

# Cấu hình Model AI cho từng trạm trong Pipeline.
# Việc gom nhóm giúp dễ dàng nâng cấp model cho toàn bộ hệ thống.
#
# Model names use the litellm provider prefix convention:
#   gemini/<model>   — Google Gemini via AI Studio
#   deepseek/<model> — DeepSeek (active primary model for S1-S3)
#
# NOTE: Model names use the litellm provider prefix convention.
# gemini-3-flash-preview is available via litellm's Gemini provider (AI Studio).
# gemini-embedding-2 is mapped to text-embedding-004 (litellm's nearest match).
# DeepSeek has been validated as primary model for stations S1-S3 as of Issue #92 audit.

AI_MODEL_CONFIG = {
    "station_1_rewriter": "deepseek/deepseek-chat",
    "station_2_extractor": "deepseek/deepseek-chat",
    "station_3_breaker": "deepseek/deepseek-chat",
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
