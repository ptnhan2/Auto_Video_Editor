import logging
import os
from typing import List
from google import genai
from google.genai import types
from google.genai.chats import Chat
from src.config.ai_models import get_model_for_station, EMBEDDING_MODEL

logger = logging.getLogger(__name__)

# Singleton client shared across all stations.
# Note: not thread-safe — two concurrent first calls may create duplicate clients.
# Safe for the current single-threaded pipeline usage.
_client = None


def get_llm_client() -> genai.Client:
    """Return a singleton LLM client initialized with the environment API key.

    Lazily creates the client on first call. Subsequent calls return the
    same instance, avoiding repeated initialization overhead.

    Returns:
        genai.Client: The shared Google GenAI client instance.

    Raises:
        RuntimeError: If GOOGLE_GENERATIVE_AI_API_KEY is not set in the environment.
    """
    global _client
    if _client is None:
        api_key = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY")
        if not api_key:
            raise RuntimeError("GOOGLE_GENERATIVE_AI_API_KEY is missing from environment")
        _client = genai.Client(api_key=api_key)
    return _client


def start_chat(station_id: str, config: types.GenerateContentConfig) -> Chat:
    """Create a new chat session for the given station using its configured model.

    Args:
        station_id: Station key (e.g. "station_6_vfx") looked up in ai_models config.
        config: Generation config including system instruction and tools.

    Returns:
        Chat: A chat session object ready for send_message() calls.
    """
    client = get_llm_client()
    model_name = get_model_for_station(station_id)
    return client.chats.create(model=model_name, config=config)


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for a list of texts via the configured embedding model.

    On failure (network error, API issue, etc.), logs the error and returns an
    empty list — callers should handle empty results gracefully (e.g. fallback
    to top-N registry items or skip similarity search).

    Args:
        texts: One or more strings to embed.

    Returns:
        List of embedding vectors (each a list of floats), or empty list on error.
    """
    client = get_llm_client()
    try:
        result = client.models.embed_content(model=EMBEDDING_MODEL, contents=texts)
        return [e.values for e in result.embeddings] if hasattr(result, "embeddings") else []
    except Exception as e:
        logger.error("Embedding error for model=%s, texts_count=%d: %s", EMBEDDING_MODEL, len(texts), e)
        return []
