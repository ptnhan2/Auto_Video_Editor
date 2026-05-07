import os
from typing import List
from google import genai
from google.genai import types
from src.config.ai_models import get_model_for_station, EMBEDDING_MODEL

_client = None


def get_llm_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY")
        if not api_key:
            raise RuntimeError("GOOGLE_GENERATIVE_AI_API_KEY is missing from environment")
        _client = genai.Client(api_key=api_key)
    return _client


def start_chat(station_id: str, config: types.GenerateContentConfig):
    client = get_llm_client()
    model_name = get_model_for_station(station_id)
    return client.chats.create(model=model_name, config=config)


def embed_texts(texts: List[str]) -> List[List[float]]:
    client = get_llm_client()
    try:
        result = client.models.embed_content(model=EMBEDDING_MODEL, contents=texts)
        return [e.values for e in result.embeddings] if hasattr(result, "embeddings") else []
    except Exception:
        return []
