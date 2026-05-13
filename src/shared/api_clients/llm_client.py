"""Centralized LLM client backed by LiteLLM.

Replaces the previous Google GenAI SDK singleton with a LiteLLM-based
implementation that supports provider-agnostic completion, tool calling,
and embeddings through a single interface.

All LLM calls flow through litellm.completion() and litellm.embedding().
Tool calling is handled by the generic loop in tool_loop.py.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Callable, List, Optional

import litellm
from dotenv import load_dotenv

from src.config.ai_models import get_embedding_model, get_model_for_station
from src.shared.api_clients.tool_loop import (
    build_tool_registry,
    build_tool_schemas,
    run_tool_loop,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Singleton guard — litellm is a global library, so we only need to ensure
# lazy configuration once.
# ---------------------------------------------------------------------------
_configured = False
_embedding_cache: dict[str, list[float]] = {}
MAX_EMBEDDING_CACHE_SIZE = 1000


def _configure_litellm() -> None:
    """One-time litellm setup. Reads API keys from environment variables.

    Loads .env.local and maps legacy env var names to litellm's expected vars:
        GOOGLE_GENERATIVE_AI_API_KEY → GEMINI_API_KEY
        DEEPSEEK_API_KEY           → (used as-is)
    """
    global _configured
    if _configured:
        return

    # Load .env.local so env vars are available even if the caller didn't dotenv.
    load_dotenv(".env.local")

    # Map legacy env var to litellm's expected Gemini key name.
    if os.getenv("GOOGLE_GENERATIVE_AI_API_KEY") and not os.getenv("GEMINI_API_KEY"):
        os.environ["GEMINI_API_KEY"] = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY") or ""

    litellm.set_verbose = False
    _configured = True
    logger.debug("litellm configured (verbose=off)")


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

def _format_messages(
    system_prompt: Optional[str],
    user_content: str,
) -> list[dict]:
    """Build a messages list from system prompt + user content."""
    messages: list[dict] = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_content})
    return messages


# ---------------------------------------------------------------------------
# Completion (single-turn)
# ---------------------------------------------------------------------------

def completion(
    model: str,
    messages: list[dict],
    tools: Optional[list[dict]] = None,
    tool_functions: Optional[dict[str, Callable[..., Any]]] = None,
    **kwargs: Any,
) -> Any:
    """Call litellm.completion() with optional tool-calling loop.

    Args:
        model: litellm model string (e.g. "gemini/gemini-2.5-flash").
        messages: List of message dicts in OpenAI format.
        tools: Tool definitions with {name, description, parameters}.
               If provided, converted to OpenAI JSON Schema and tool loop runs.
        tool_functions: Optional name → function mapping (built from tools if
               not provided).

    Returns:
        litellm completion response. The response may still contain tool_calls
        if max_rounds was exhausted; caller should check.
    """
    _configure_litellm()

    tool_schemas = build_tool_schemas(tools) if tools else None
    registry = tool_functions or (build_tool_registry(tools) if tools else {})

    # Single completion fn — reused if tool loop runs.
    def _completion_fn(msgs: list[dict]) -> Any:
        return litellm.completion(
            model=model,
            messages=msgs,
            tools=tool_schemas,
            **kwargs,
        )

    # No tools configured — simple single call, no loop needed.
    if not tools or not registry:
        tool_schemas = None  # prevent sending schemas without handlers
        return _completion_fn(messages)

    # Run the tool-calling loop (handles the first call internally).
    return run_tool_loop(messages, registry, _completion_fn)


def generate_content(
    model: str,
    system_prompt: Optional[str] = None,
    contents: Optional[str] = None,
    tools: Optional[list[dict]] = None,
    tool_functions: Optional[dict[str, Callable[..., Any]]] = None,
    **kwargs: Any,
) -> Any:
    """Single-turn completion with system prompt + user content.

    Convenience wrapper for stations that previously called
    client.models.generate_content() directly.

    Args:
        model: litellm model string.
        system_prompt: System instruction (optional).
        contents: User message text.
        tools: Tool definitions (optional).

    Returns:
        litellm completion response.
    """
    messages = _format_messages(system_prompt, contents or "")
    return completion(
        model=model,
        messages=messages,
        tools=tools,
        tool_functions=tool_functions,
        **kwargs,
    )


# ---------------------------------------------------------------------------
# Chat session (multi-turn)
# ---------------------------------------------------------------------------

class ChatSession:
    """Maintains message history across multiple turns.

    Used by stations S1-S3 and S6 that need multi-turn conversations.
    Tool calling is handled transparently inside send_message().
    """

    def __init__(
        self,
        model: str,
        system_prompt: Optional[str] = None,
        tools: Optional[list[dict]] = None,
        tool_functions: Optional[dict[str, Callable[..., Any]]] = None,
        **kwargs: Any,
    ) -> None:
        _configure_litellm()
        self.model = model
        self.messages: list[dict] = []
        if system_prompt:
            self.messages.append({"role": "system", "content": system_prompt})
        self.tools = tools
        self.tool_functions = tool_functions or (build_tool_registry(tools) if tools else {})
        self.tool_schemas = build_tool_schemas(tools) if tools else None
        self.kwargs = kwargs

    def send_message(self, content: str) -> Any:
        """Send a user message and return the final assistant response.

        If tools are configured and the model calls them, the tool loop
        runs to completion before returning.

        Args:
            content: User message text.

        Returns:
            The final litellm completion response.
        """
        self.messages.append({"role": "user", "content": content})

        def _completion_fn(msgs: list[dict]) -> Any:
            return litellm.completion(
                model=self.model,
                messages=msgs,
                tools=self.tool_schemas,
                **self.kwargs,
            )

        # If tools are configured, run the loop (handles first call internally).
        if self.tools and self.tool_functions:
            response = run_tool_loop(self.messages, self.tool_functions, _completion_fn)
        else:
            response = _completion_fn(self.messages)

        # Append final assistant message to history for next turn.
        if response.choices:
            self.messages.append(response.choices[0].message.model_dump(exclude_none=True))
        return response

    @property
    def text(self) -> str:
        """Return the text of the last response, for backward compatibility."""
        if self.messages:
            last = self.messages[-1]
            content = last.get("content") if isinstance(last, dict) else getattr(last, "content", None)
            if content:
                return content
        return ""


# ---------------------------------------------------------------------------
# Station-facing API (backward-compatible signatures)
# ---------------------------------------------------------------------------

def start_chat(
    station_id: str,
    system_prompt: Optional[str] = None,
    tools: Optional[list[dict]] = None,
    **kwargs: Any,
) -> ChatSession:
    """Create a ChatSession pre-configured for a specific station.

    Args:
        station_id: Key looked up in ai_models config.
        system_prompt: System instruction for the chat.
        tools: Tool definitions in [{name, description, parameters, function}] format.

    Returns:
        A ChatSession ready for send_message() calls.
    """
    model_name = get_model_for_station(station_id)
    return ChatSession(
        model=model_name,
        system_prompt=system_prompt,
        tools=tools,
        **kwargs,
    )


# ---------------------------------------------------------------------------
# Singleton compatibility (deprecated — use completion() / start_chat()
# directly, but kept for modules that still call get_llm_client()).
# ---------------------------------------------------------------------------

def get_llm_client() -> "litellm":
    """Return the litellm module as the shared LLM client.

    Deprecated: prefer using completion() or start_chat() directly.
    Kept for backward compatibility with station code that calls
    get_llm_client().models.generate_content() — those stations should
    migrate to generate_content().

    Returns:
        The litellm module itself.
    """
    _configure_litellm()
    return litellm


# ---------------------------------------------------------------------------
# Embedding
# ---------------------------------------------------------------------------

def embed_texts(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for a list of texts via litellm.

    On failure, logs the error and returns an empty list — callers should
    handle empty results gracefully.

    Args:
        texts: One or more strings to embed.

    Returns:
        List of embedding vectors (each a list of floats), or empty list on error.
    """
    _configure_litellm()
    embedding_model = get_embedding_model()

    cached = []
    uncached_texts = []
    uncached_indices = []
    for i, text in enumerate(texts):
        if text in _embedding_cache:
            cached.append((i, _embedding_cache[text]))
        else:
            uncached_texts.append(text)
            uncached_indices.append(i)

    if not uncached_texts:
        return [v for _, v in sorted(cached, key=lambda x: x[0])] if cached else []

    try:
        result = litellm.embedding(model=embedding_model, input=uncached_texts)
        if hasattr(result, "data"):
            vectors = []
            for item in result.data:
                if isinstance(item, dict) and "embedding" in item:
                    vectors.append(item["embedding"])
                elif hasattr(item, "embedding"):
                    vectors.append(item.embedding)

            for text, vec in zip(uncached_texts, vectors):
                if len(_embedding_cache) >= MAX_EMBEDDING_CACHE_SIZE:
                    _embedding_cache.pop(next(iter(_embedding_cache)))
                _embedding_cache[text] = vec

            all_vecs = [None] * len(texts)
            for idx, vec in cached:
                all_vecs[idx] = vec
            for idx, vec in zip(uncached_indices, vectors):
                all_vecs[idx] = vec
            return all_vecs
        return []
    except Exception as exc:
        logger.error(
            "Embedding error for model=%s, texts_count=%d: %s",
            embedding_model,
            len(texts),
            exc,
        )
        return []
