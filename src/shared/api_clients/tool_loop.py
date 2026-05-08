"""Generic tool-calling loop for LiteLLM responses.

Independent of any LLM provider — works with the OpenAI-compatible tool_calls
format returned by litellm.completion().

Usage in station code:
    from src.shared.api_clients.tool_loop import build_tool_registry, execute_tool_call

    tools = [
        {"name": "my_tool", "description": "...", "parameters": {...}, "function": my_func},
    ]
    registry = build_tool_registry(tools)
    result = execute_tool_call("my_tool", {"arg1": "val"}, registry)
"""

from __future__ import annotations

import json
import logging
from typing import Any, Callable

logger = logging.getLogger(__name__)

# Max tool-calling rounds to prevent infinite loops.
MAX_TOOL_ROUNDS = 10


def build_tool_registry(tools: list[dict]) -> dict[str, Callable[..., Any]]:
    """Build a name → function mapping from tool definitions.

    Each tool dict has the shape:
        {"name": str, "function": callable, ...}

    Returns:
        Dict mapping tool name to its executable Python function.
    """
    registry: dict[str, Callable[..., Any]] = {}
    for tool in tools:
        name = tool.get("name")
        func = tool.get("function")
        if name and func:
            registry[name] = func
        else:
            logger.debug("Skipping tool entry missing 'name' or 'function': %s", tool)
    return registry


def build_tool_schemas(tools: list[dict]) -> list[dict]:
    """Convert tool definitions to OpenAI JSON Schema format for litellm.

    Tool dict shape:
        {"name": str, "description": str, "parameters": dict}

    Returns:
        List of tool schemas in OpenAI function-calling format.
    """
    schemas = []
    for tool in tools:
        name = tool.get("name")
        if not name:
            logger.warning("Skipping tool definition with missing 'name' key")
            continue
        schemas.append({
            "type": "function",
            "function": {
                "name": name,
                "description": tool.get("description", ""),
                "parameters": tool.get("parameters", {"type": "object", "properties": {}, "required": []}),
            },
        })
    return schemas


def execute_tool_call(
    name: str,
    arguments: dict[str, Any],
    registry: dict[str, Callable[..., Any]],
) -> str:
    """Execute a single tool call and return the result as a JSON string.

    Args:
        name: Tool name matching a key in the registry.
        arguments: Keyword arguments to pass to the tool function.
        registry: Name → function mapping from build_tool_registry().

    Returns:
        JSON-encoded string of the tool's return value, or an error dict.
    """
    func = registry.get(name)
    if func is None:
        error = {"error": f"Tool '{name}' not found in registry"}
        return json.dumps(error, ensure_ascii=False)
    try:
        result = func(**arguments)
        return json.dumps(result, ensure_ascii=False, default=str)
    except Exception as exc:
        logger.warning("Tool '%s' execution failed: %s", name, exc)
        error = {"error": str(exc)}
        return json.dumps(error, ensure_ascii=False)


def run_tool_loop(
    messages: list[dict],
    registry: dict[str, Callable[..., Any]],
    completion_fn: Callable[..., Any],
    max_rounds: int = MAX_TOOL_ROUNDS,
) -> Any:
    """Run the tool-calling loop until there are no more tool_calls.

    Call pattern:
        response = litellm.completion(messages=..., tools=...)
        response = run_tool_loop(messages, registry, lambda msgs: litellm.completion(...))

    Args:
        messages: The message list (modified in-place with tool results).
        registry: Name → function mapping.
        completion_fn: A callable that takes updated messages and returns a litellm response.
        max_rounds: Safety limit on loop iterations.

    Returns:
        The final litellm completion response (no tool_calls left, or max rounds reached).
    """
    rounds = 0
    while rounds < max_rounds:
        response = completion_fn(messages)
        if not response.choices:
            logger.warning("Tool loop received response with no choices — stopping")
            return response
        choice = response.choices[0]
        tool_calls = getattr(choice.message, "tool_calls", None)

        if not tool_calls:
            return response

        rounds += 1
        # Append assistant message with tool_calls to history.
        messages.append(choice.message.model_dump(exclude_none=True))

        for tool_call in tool_calls:
            try:
                tool_args = json.loads(tool_call.function.arguments)
            except json.JSONDecodeError as exc:
                logger.warning(
                    "Failed to parse tool arguments for '%s': %s",
                    tool_call.function.name,
                    exc,
                )
                tool_args = {}
            result_str = execute_tool_call(
                tool_call.function.name,
                tool_args,
                registry,
            )
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": tool_call.function.name,
                "content": result_str,
            })

    logger.warning("Tool loop reached max rounds (%d) — stopping", max_rounds)
    # Pop the assistant message + tool results appended in the final round.
    # Order: assistant_msg → tool_result_1 → ... → tool_result_N.
    # Pop tool results first, then the assistant message.
    if tool_calls:
        for _ in tool_calls:
            messages.pop()
    messages.pop()
    return response
