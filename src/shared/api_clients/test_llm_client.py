"""Tests for litellm-backed LLM client and generic tool-calling loop.

Follows Gate 4.3 methodology:
  - Skill: test-driven-development (TDD: Red-Green-Refactor)
  - Skill: python-testing-patterns (AAA pattern, fixtures, parametrize)

Each test = one behavior. Fixtures handle env isolation + singleton reset.
Mock only external deps (litellm API) — real tool functions tested directly.
"""

from __future__ import annotations

import os
from unittest.mock import MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# Fixtures — env isolation + singleton reset
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _isolate_env_and_singleton(monkeypatch):
    """Before each test: save GEMINI_API_KEY, then reset litellm singleton."""
    saved = os.environ.get("GEMINI_API_KEY")
    yield
    # Teardown: restore env + reset singleton flag.
    if saved is not None:
        monkeypatch.setenv("GEMINI_API_KEY", saved)
    else:
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    import src.shared.api_clients.llm_client as mod

    mod._configured = False


@pytest.fixture
def gemini_key_set(monkeypatch):
    """Set a fake API key so _configure_litellm doesn't complain."""
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")


# ---------------------------------------------------------------------------
# Mock factories — reusable litellm response builders
# ---------------------------------------------------------------------------


def _make_text_response(content: str) -> MagicMock:
    """Build a litellm response with text content and no tool_calls."""
    msg = MagicMock()
    msg.content = content
    msg.tool_calls = None
    msg.model_dump.return_value = {"role": "assistant", "content": content}
    resp = MagicMock()
    resp.choices = [MagicMock()]
    resp.choices[0].message = msg
    return resp


def _make_tool_call_response(tool_name: str, tool_args: str, tool_id: str = "c1") -> MagicMock:
    """Build a litellm response containing a single tool_call."""
    tc = MagicMock()
    tc.id = tool_id
    tc.type = "function"
    tc.function.name = tool_name
    tc.function.arguments = tool_args
    msg = MagicMock()
    msg.content = None
    msg.tool_calls = [tc]
    msg.model_dump.return_value = {
        "role": "assistant",
        "tool_calls": [
            {
                "id": tool_id,
                "type": "function",
                "function": {"name": tool_name, "arguments": tool_args},
            }
        ],
    }
    resp = MagicMock()
    resp.choices = [MagicMock()]
    resp.choices[0].message = msg
    return resp


# ===================================================================
# Test Group 1: tool_loop helpers (build_registry, schemas, execute)
# ===================================================================


class TestBuildToolRegistry:
    """build_tool_registry — ánh xạ name → function."""

    def test_builds_registry_from_valid_tools(self):
        """Arrange: tools có name + function."""
        def greet():
            return "hi"

        tools = [
            {"name": "greet", "function": greet},
            {"name": "farewell", "function": greet},
        ]

        # Act
        from src.shared.api_clients.tool_loop import build_tool_registry

        registry = build_tool_registry(tools)

        # Assert
        assert len(registry) == 2
        assert registry["greet"] is greet
        assert registry["farewell"] is greet

    def test_skips_entries_missing_name_or_function(self):
        """Arrange: tools thiếu name hoặc function."""
        tools = [{"description": "no name"}, {"name": "no func"}]

        # Act
        from src.shared.api_clients.tool_loop import build_tool_registry

        registry = build_tool_registry(tools)

        # Assert
        assert len(registry) == 0


class TestBuildToolSchemas:
    """build_tool_schemas — convert sang OpenAI JSON Schema format."""

    def test_converts_tool_to_openai_schema(self):
        """Arrange: tool definition đầy đủ."""
        tools = [
            {
                "name": "search",
                "description": "Search the registry",
                "parameters": {
                    "type": "object",
                    "properties": {"query": {"type": "string"}},
                    "required": ["query"],
                },
            },
        ]

        # Act
        from src.shared.api_clients.tool_loop import build_tool_schemas

        schemas = build_tool_schemas(tools)

        # Assert
        assert len(schemas) == 1
        assert schemas[0]["type"] == "function"
        assert schemas[0]["function"]["name"] == "search"
        assert schemas[0]["function"]["description"] == "Search the registry"

    def test_skips_tool_with_missing_name(self):
        """Arrange: tool thiếu name key."""
        tools = [
            {"description": "no name here"},
            {"name": "valid", "description": "valid tool", "parameters": {}},
        ]

        # Act
        from src.shared.api_clients.tool_loop import build_tool_schemas

        schemas = build_tool_schemas(tools)

        # Assert — only the valid tool is included.
        assert len(schemas) == 1
        assert schemas[0]["function"]["name"] == "valid"


class TestExecuteToolCall:
    """execute_tool_call — gọi function từ registry."""

    def test_executes_and_returns_json(self):
        """Arrange: function nhận args, trả về dict."""
        def greet(name):
            return {"greeting": f"Hello {name}"}

        registry = {"greet": greet}

        # Act
        from src.shared.api_clients.tool_loop import execute_tool_call

        result = execute_tool_call("greet", {"name": "World"}, registry)

        # Assert
        assert "Hello World" in result

    def test_returns_error_when_tool_not_found(self):
        """Arrange: registry rỗng."""
        registry = {}

        # Act
        from src.shared.api_clients.tool_loop import execute_tool_call

        result = execute_tool_call("missing", {}, registry)

        # Assert
        assert "not found" in result

    def test_catches_tool_exception_and_returns_error(self):
        """Arrange: function throws exception."""
        def fail():
            raise ValueError("boom")

        registry = {"fail": fail}

        # Act
        from src.shared.api_clients.tool_loop import execute_tool_call

        result = execute_tool_call("fail", {}, registry)

        # Assert
        assert "boom" in result


# ===================================================================
# Test Group 2: llm_client — singleton, completion, chat
# ===================================================================


class TestConfigureLitellm:
    """_configure_litellm — one-time setup."""

    def test_idempotent_after_first_call(self, gemini_key_set):
        """Arrange: gọi lần 1."""
        from src.shared.api_clients.llm_client import _configure_litellm

        # Act — call twice.
        _configure_litellm()
        _configure_litellm()

        # Assert
        import src.shared.api_clients.llm_client as mod

        assert mod._configured is True


class TestCompletion:
    """completion() — single-turn LLM call with optional tool loop."""

    @patch("src.shared.api_clients.llm_client.litellm.completion")
    def test_returns_text_when_no_tools_configured(self, mock_completion, gemini_key_set):
        """Arrange: mock litellm trả về text."""
        mock_completion.return_value = _make_text_response("Hello")

        # Act
        from src.shared.api_clients.llm_client import completion

        response = completion("gemini/gemini-2.5-flash", [{"role": "user", "content": "hi"}])

        # Assert
        assert mock_completion.call_count == 1
        assert response.choices[0].message.content == "Hello"

    @patch("src.shared.api_clients.llm_client.litellm.completion")
    def test_runs_tool_loop_and_returns_final_text(self, mock_completion):
        """Arrange: response 1 có tool_call → response 2 có text."""
        def get_weather(city):
            return {"temp": 30, "city": city}

        tools = [
            {
                "name": "get_weather",
                "description": "Get weather",
                "parameters": {
                    "type": "object",
                    "properties": {"city": {"type": "string"}},
                    "required": ["city"],
                },
                "function": get_weather,
            },
        ]

        mock_completion.side_effect = [
            _make_tool_call_response("get_weather", '{"city": "Hanoi"}'),
            _make_text_response("The weather in Hanoi is 30 C."),
        ]

        # Act
        from src.shared.api_clients.llm_client import completion

        messages = [{"role": "user", "content": "What is the weather?"}]
        response = completion("gemini/gemini-2.5-flash", messages, tools=tools)

        # Assert — litellm called twice: tool_call round + final round.
        assert mock_completion.call_count == 2
        assert response.choices[0].message.content == "The weather in Hanoi is 30 C."


class TestChatSession:
    """ChatSession — multi-turn conversation với message history."""

    @patch("src.shared.api_clients.llm_client.litellm.completion")
    def test_send_message_stores_system_user_assistant(self, mock_completion, gemini_key_set):
        """Arrange: mock trả về text không tools."""
        mock_completion.return_value = _make_text_response("Hello back")

        # Act
        from src.shared.api_clients.llm_client import ChatSession

        chat = ChatSession("gemini/gemini-2.5-flash", system_prompt="Be helpful")
        response = chat.send_message("Hi")

        # Assert
        assert response.choices[0].message.content == "Hello back"
        assert len(chat.messages) == 3  # system + user + assistant
        assert mock_completion.call_count == 1

    @patch("src.shared.api_clients.llm_client.litellm.completion")
    def test_message_history_grows_across_turns(self, mock_completion, gemini_key_set):
        """Arrange: 2 turns, mỗi turn trả về text khác nhau."""
        mock_completion.side_effect = [
            _make_text_response("Turn 1"),
            _make_text_response("Turn 2"),
        ]

        # Act
        from src.shared.api_clients.llm_client import ChatSession

        chat = ChatSession("gemini/gemini-2.5-flash", system_prompt="Be helpful")
        chat.send_message("Q1")
        chat.send_message("Q2")

        # Assert — 5 messages: system, user1, assistant1, user2, assistant2.
        assert len(chat.messages) == 5
        assert chat.messages[3]["content"] == "Q2"
        assert chat.messages[4]["content"] == "Turn 2"


class TestGenerateContent:
    """generate_content() — convenience wrapper build messages đúng format."""

    @patch("src.shared.api_clients.llm_client.litellm.completion")
    def test_formats_system_and_user_messages(self, mock_completion, gemini_key_set):
        """Arrange: mock return."""
        mock_completion.return_value = _make_text_response("Response")

        # Act
        from src.shared.api_clients.llm_client import generate_content

        response = generate_content(
            "gemini/gemini-2.5-flash",
            system_prompt="You are helpful",
            contents="Hello",
            temperature=0.7,
        )

        # Assert
        assert response.choices[0].message.content == "Response"
        call_args = mock_completion.call_args
        messages = call_args[1]["messages"]
        assert len(messages) == 2
        assert messages[0] == {"role": "system", "content": "You are helpful"}
        assert messages[1] == {"role": "user", "content": "Hello"}


class TestGetLLMClient:
    """get_llm_client() — backward-compatible singleton access."""

    def test_returns_litellm_module(self, gemini_key_set):
        """Arrange: có API key."""
        # Act
        from src.shared.api_clients.llm_client import get_llm_client

        import litellm

        client = get_llm_client()

        # Assert
        assert client is litellm


# ===================================================================
# Test Group 3: embedding
# ===================================================================


class TestEmbedTexts:
    """embed_texts() — embedding qua litellm."""

    @patch("src.shared.api_clients.llm_client.litellm.embedding")
    def test_returns_vectors_on_success(self, mock_embedding, gemini_key_set):
        """Arrange: mock litellm.embedding trả về data."""
        mock_result = MagicMock()
        mock_result.data = [
            {"embedding": [0.1, 0.2, 0.3]},
            {"embedding": [0.4, 0.5, 0.6]},
        ]
        mock_embedding.return_value = mock_result

        # Act
        from src.shared.api_clients.llm_client import embed_texts

        result = embed_texts(["text1", "text2"])

        # Assert
        assert len(result) == 2
        assert result[0] == [0.1, 0.2, 0.3]
        mock_embedding.assert_called_once()

    @patch("src.shared.api_clients.llm_client.litellm.embedding")
    def test_returns_empty_list_on_api_error(self, mock_embedding, gemini_key_set):
        """Arrange: litellm.embedding throws."""
        mock_embedding.side_effect = RuntimeError("api error")

        # Act
        from src.shared.api_clients.llm_client import embed_texts

        result = embed_texts(["text1"])

        # Assert — không crash, trả về [].
        assert result == []


# ===================================================================
# Test Group 4: run_tool_loop integration
# ===================================================================


class TestRunToolLoop:
    """run_tool_loop() — generic loop engine."""

    def test_executes_multiple_tools_across_rounds(self):
        """Arrange: 2 tools ở round 1, text ở round 2."""
        calls_log = []

        def tool_a(x):
            calls_log.append(f"a({x})")
            return {"result": x}

        def tool_b(y):
            calls_log.append(f"b({y})")
            return {"result": y}

        registry = {"tool_a": tool_a, "tool_b": tool_b}
        messages = [{"role": "user", "content": "do work"}]

        # Round 1 response: two tool_calls (tool_a + tool_b)
        tc1 = MagicMock()
        tc1.id = "c1"
        tc1.type = "function"
        tc1.function.name = "tool_a"
        tc1.function.arguments = '{"x": "hello"}'
        tc2 = MagicMock()
        tc2.id = "c2"
        tc2.type = "function"
        tc2.function.name = "tool_b"
        tc2.function.arguments = '{"y": "world"}'
        msg1 = MagicMock()
        msg1.tool_calls = [tc1, tc2]
        msg1.model_dump.return_value = {
            "role": "assistant",
            "tool_calls": [
                {"id": "c1", "type": "function", "function": {"name": "tool_a", "arguments": '{"x": "hello"}'}},
                {"id": "c2", "type": "function", "function": {"name": "tool_b", "arguments": '{"y": "world"}'}},
            ],
        }
        resp1 = MagicMock()
        resp1.choices = [MagicMock()]
        resp1.choices[0].message = msg1

        call_index = [0]
        responses = [resp1, _make_text_response("Done")]

        def completion_fn(msgs):
            idx = call_index[0]
            call_index[0] += 1
            return responses[idx]

        # Act
        from src.shared.api_clients.tool_loop import run_tool_loop

        result = run_tool_loop(messages, registry, completion_fn)

        # Assert — cả 2 tools được execute, loop dừng khi gặp text.
        assert result.choices[0].message.content == "Done"
        assert calls_log == ["a(hello)", "b(world)"]

    def test_stops_at_max_rounds_with_endless_tool_calls(self):
        """Arrange: tool luôn trả về tool_call — infinite loop bị chặn."""
        from src.shared.api_clients.tool_loop import run_tool_loop, MAX_TOOL_ROUNDS

        def endless_tool():
            return {"ok": True}

        registry = {"endless_tool": endless_tool}
        messages = [{"role": "user", "content": "loop"}]

        call_count = [0]

        def completion_fn(msgs):
            call_count[0] += 1
            return _make_tool_call_response("endless_tool", "{}", f"c{call_count[0]}")

        # Act
        run_tool_loop(messages, registry, completion_fn)

        # Assert — bị chặn ở MAX_TOOL_ROUNDS, không chạy vô hạn.
        assert call_count[0] == MAX_TOOL_ROUNDS


# ===================================================================
# Test Group 5: response_format compatibility (Issue #142)
# ===================================================================


class TestResponseFormatCompat:
    """_ensure_response_format_compat — downgrade json_schema for DeepSeek."""

    @patch("src.shared.api_clients.llm_client.litellm.completion")
    def test_deepseek_json_schema_downgraded_to_json_object(
        self, mock_completion, gemini_key_set
    ):
        """DeepSeek model + json_schema → kwargs get json_object instead."""
        mock_completion.return_value = _make_text_response("{}")

        from src.shared.api_clients.llm_client import completion

        _response = completion(
            "deepseek/deepseek-chat",
            [{"role": "user", "content": "return JSON"}],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "test",
                    "schema": {"type": "object", "properties": {"x": {"type": "string"}}},
                },
            },
        )

        # Verify litellm was called with downgraded response_format
        call_kwargs = mock_completion.call_args[1]
        assert "response_format" in call_kwargs
        assert call_kwargs["response_format"] == {"type": "json_object"}
        # enable_json_schema_validation must NOT be present
        assert "enable_json_schema_validation" not in call_kwargs

    @patch("src.shared.api_clients.llm_client.litellm.completion")
    def test_gemini_json_schema_passes_through_untouched(
        self, mock_completion, gemini_key_set
    ):
        """Gemini model + json_schema → kwargs unchanged (Gemini supports it)."""
        mock_completion.return_value = _make_text_response("{}")

        from src.shared.api_clients.llm_client import completion

        original_format = {
            "type": "json_schema",
            "json_schema": {
                "name": "test",
                "schema": {"type": "object", "properties": {"x": {"type": "string"}}},
            },
        }
        _response = completion(
            "gemini/gemini-2.5-flash",
            [{"role": "user", "content": "return JSON"}],
            response_format=original_format,
        )

        # Verify litellm received the original, untouched response_format
        call_kwargs = mock_completion.call_args[1]
        assert "response_format" in call_kwargs
        assert call_kwargs["response_format"] == original_format

    @patch("src.shared.api_clients.llm_client.litellm.completion")
    def test_deepseek_json_object_passes_through_untouched(
        self, mock_completion, gemini_key_set
    ):
        """DeepSeek + json_object → already compatible, no change needed."""
        mock_completion.return_value = _make_text_response("{}")

        from src.shared.api_clients.llm_client import completion

        _response = completion(
            "deepseek/deepseek-chat",
            [{"role": "user", "content": "return JSON"}],
            response_format={"type": "json_object"},
        )

        call_kwargs = mock_completion.call_args[1]
        assert call_kwargs["response_format"] == {"type": "json_object"}

    @patch("src.shared.api_clients.llm_client.litellm.completion")
    def test_no_response_format_passes_through_untouched(
        self, mock_completion, gemini_key_set
    ):
        """No response_format at all → nothing changes, no crash."""
        mock_completion.return_value = _make_text_response("Hello")

        from src.shared.api_clients.llm_client import completion

        _response = completion(
            "deepseek/deepseek-chat",
            [{"role": "user", "content": "hi"}],
        )

        call_kwargs = mock_completion.call_args[1]
        assert "response_format" not in call_kwargs


# ===================================================================
# Test Group 6: ChatSession response_format compatibility (Issue #146)
# ===================================================================


class TestChatSessionResponseFormatCompat:
    """ChatSession passes response_format through _ensure_response_format_compat."""

    @patch("src.shared.api_clients.llm_client.litellm.completion")
    def test_deepseek_json_schema_downgraded_in_chatsession(
        self, mock_completion, gemini_key_set
    ):
        """ChatSession + DeepSeek + json_schema → downgraded to json_object."""
        mock_completion.return_value = _make_text_response("{}")

        from src.shared.api_clients.llm_client import ChatSession

        session = ChatSession(
            "deepseek/deepseek-chat",
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "test",
                    "schema": {"type": "object", "properties": {"x": {"type": "string"}}},
                },
            },
        )
        session.send_message("return JSON")

        call_kwargs = mock_completion.call_args[1]
        assert "response_format" in call_kwargs
        assert call_kwargs["response_format"] == {"type": "json_object"}
        assert "enable_json_schema_validation" not in call_kwargs

    @patch("src.shared.api_clients.llm_client.litellm.completion")
    def test_gemini_json_schema_passes_through_in_chatsession(
        self, mock_completion, gemini_key_set
    ):
        """ChatSession + Gemini + json_schema → unchanged (Gemini supports it)."""
        mock_completion.return_value = _make_text_response("{}")

        from src.shared.api_clients.llm_client import ChatSession

        original_format = {
            "type": "json_schema",
            "json_schema": {
                "name": "test",
                "schema": {"type": "object", "properties": {"x": {"type": "string"}}},
            },
        }
        session = ChatSession(
            "gemini/gemini-2.5-flash",
            response_format=original_format,
        )
        session.send_message("return JSON")

        call_kwargs = mock_completion.call_args[1]
        assert "response_format" in call_kwargs
        assert call_kwargs["response_format"] == original_format

    @patch("src.shared.api_clients.llm_client.litellm.completion")
    def test_no_response_format_chatsession_noop(
        self, mock_completion, gemini_key_set
    ):
        """ChatSession without response_format → no crash, nothing injected."""
        mock_completion.return_value = _make_text_response("Hello")

        from src.shared.api_clients.llm_client import ChatSession

        session = ChatSession("deepseek/deepseek-chat")
        session.send_message("hi")

        call_kwargs = mock_completion.call_args[1]
        assert "response_format" not in call_kwargs
