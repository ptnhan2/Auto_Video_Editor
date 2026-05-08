import os
import unittest
from unittest.mock import MagicMock, patch


class TestToolLoop(unittest.TestCase):
    """Tests for the generic tool-calling loop."""

    def test_build_tool_registry(self):
        from src.shared.api_clients.tool_loop import build_tool_registry

        def dummy_func():
            return "ok"

        tools = [
            {"name": "t1", "description": "d1", "parameters": {}, "function": dummy_func},
            {"name": "t2", "description": "d2", "parameters": {}, "function": dummy_func},
        ]
        registry = build_tool_registry(tools)
        self.assertEqual(len(registry), 2)
        self.assertIs(registry["t1"], dummy_func)

    def test_build_tool_registry_skips_missing_keys(self):
        from src.shared.api_clients.tool_loop import build_tool_registry

        tools = [{"description": "no name"}, {"name": "no func"}]
        registry = build_tool_registry(tools)
        self.assertEqual(len(registry), 0)

    def test_build_tool_schemas(self):
        from src.shared.api_clients.tool_loop import build_tool_schemas

        tools = [
            {
                "name": "search",
                "description": "Search registry",
                "parameters": {
                    "type": "object",
                    "properties": {"query": {"type": "string"}},
                    "required": ["query"],
                },
            },
        ]
        schemas = build_tool_schemas(tools)
        self.assertEqual(len(schemas), 1)
        self.assertEqual(schemas[0]["type"], "function")
        self.assertEqual(schemas[0]["function"]["name"], "search")

    def test_execute_tool_call_success(self):
        from src.shared.api_clients.tool_loop import execute_tool_call

        def greet(name):
            return {"greeting": f"Hello {name}"}

        registry = {"greet": greet}
        result = execute_tool_call("greet", {"name": "World"}, registry)
        self.assertIn("Hello World", result)

    def test_execute_tool_call_not_found(self):
        from src.shared.api_clients.tool_loop import execute_tool_call

        registry = {}
        result = execute_tool_call("missing", {}, registry)
        self.assertIn("not found", result)

    def test_execute_tool_call_exception(self):
        from src.shared.api_clients.tool_loop import execute_tool_call

        def fail():
            raise ValueError("boom")

        registry = {"fail": fail}
        result = execute_tool_call("fail", {}, registry)
        self.assertIn("boom", result)


class TestLLMClient(unittest.TestCase):
    """Tests for the LiteLLM-backed client."""

    def setUp(self):
        self._saved_gemini = os.environ.get("GEMINI_API_KEY")

    def tearDown(self):
        if self._saved_gemini is not None:
            os.environ["GEMINI_API_KEY"] = self._saved_gemini
        else:
            os.environ.pop("GEMINI_API_KEY", None)
        # Reset singleton state
        import src.shared.api_clients.llm_client as mod

        mod._configured = False

    def test_configure_litellm_idempotent(self):
        from src.shared.api_clients.llm_client import _configure_litellm

        _configure_litellm()
        # Second call is a no-op (already configured).
        _configure_litellm()
        import src.shared.api_clients.llm_client as mod

        self.assertTrue(mod._configured)

    @patch("src.shared.api_clients.llm_client.litellm.completion")
    def test_completion_no_tools(self, mock_completion):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Hello"
        mock_response.choices[0].message.tool_calls = None
        mock_completion.return_value = mock_response

        from src.shared.api_clients.llm_client import completion

        response = completion("gemini/gemini-2.5-flash", [{"role": "user", "content": "hi"}])
        mock_completion.assert_called_once()
        self.assertEqual(response.choices[0].message.content, "Hello")

    @patch("src.shared.api_clients.llm_client.litellm.completion")
    def test_completion_with_tool_loop_single(self, mock_completion):
        """Simulate: first call returns a tool_call, second returns final text."""

        # Tool function to execute.
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

        # First response: has tool_calls.
        call1 = MagicMock()
        call1.id = "call_abc"
        call1.type = "function"
        call1.function.name = "get_weather"
        call1.function.arguments = '{"city": "Hanoi"}'

        msg1 = MagicMock()
        msg1.content = None
        msg1.tool_calls = [call1]
        msg1.model_dump.return_value = {"role": "assistant", "tool_calls": [{
            "id": "call_abc",
            "type": "function",
            "function": {"name": "get_weather", "arguments": '{"city": "Hanoi"}'},
        }]}

        resp1 = MagicMock()
        resp1.choices = [MagicMock()]
        resp1.choices[0].message = msg1

        # Second response: final text (no tool_calls).
        msg2 = MagicMock()
        msg2.content = "The weather in Hanoi is 30°C."
        msg2.tool_calls = None

        resp2 = MagicMock()
        resp2.choices = [MagicMock()]
        resp2.choices[0].message = msg2

        mock_completion.side_effect = [resp1, resp2]

        from src.shared.api_clients.llm_client import completion

        messages = [{"role": "user", "content": "What's the weather?"}]
        response = completion(
            "gemini/gemini-2.5-flash",
            messages,
            tools=tools,
        )

        # Two calls: first with tool_call, second with tool result.
        self.assertEqual(mock_completion.call_count, 2)
        self.assertEqual(response.choices[0].message.content, "The weather in Hanoi is 30°C.")

    @patch("src.shared.api_clients.llm_client.litellm.completion")
    def test_chat_session_send_message(self, mock_completion):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Hello back"
        mock_response.choices[0].message.tool_calls = None
        mock_response.choices[0].message.model_dump.return_value = {"role": "assistant", "content": "Hello back"}
        mock_completion.return_value = mock_response

        from src.shared.api_clients.llm_client import ChatSession

        chat = ChatSession("gemini/gemini-2.5-flash", system_prompt="Be helpful")
        response = chat.send_message("Hi")
        self.assertEqual(response.choices[0].message.content, "Hello back")
        self.assertEqual(len(chat.messages), 3)  # system + user + assistant
        mock_completion.assert_called_once()

    @patch("src.shared.api_clients.llm_client.litellm.completion")
    def test_chat_session_multi_turn(self, mock_completion):
        """Verify message history grows across turns."""
        def make_response(content):
            resp = MagicMock()
            resp.choices = [MagicMock()]
            resp.choices[0].message.content = content
            resp.choices[0].message.tool_calls = None
            resp.choices[0].message.model_dump.return_value = {"role": "assistant", "content": content}
            return resp

        mock_completion.side_effect = [make_response("Turn 1"), make_response("Turn 2")]

        from src.shared.api_clients.llm_client import ChatSession

        chat = ChatSession("gemini/gemini-2.5-flash", system_prompt="Be helpful")
        chat.send_message("Q1")
        chat.send_message("Q2")

        # system(1) + user1 + assistant1 + user2 + assistant2 = 5 messages
        self.assertEqual(len(chat.messages), 5)
        self.assertEqual(chat.messages[3]["content"], "Q2")
        self.assertEqual(chat.messages[4]["content"], "Turn 2")

    @patch("src.shared.api_clients.llm_client.litellm.embedding")
    def test_embed_texts_success(self, mock_embedding):
        mock_result = MagicMock()
        mock_result.data = [
            {"embedding": [0.1, 0.2, 0.3]},
            {"embedding": [0.4, 0.5, 0.6]},
        ]
        mock_embedding.return_value = mock_result

        os.environ["GEMINI_API_KEY"] = "test-key"
        from src.shared.api_clients.llm_client import embed_texts

        result = embed_texts(["text1", "text2"])
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0], [0.1, 0.2, 0.3])
        mock_embedding.assert_called_once()

    @patch("src.shared.api_clients.llm_client.litellm.embedding")
    def test_embed_texts_returns_empty_on_error(self, mock_embedding):
        mock_embedding.side_effect = RuntimeError("api error")

        os.environ["GEMINI_API_KEY"] = "test-key"
        from src.shared.api_clients.llm_client import embed_texts

        result = embed_texts(["text1"])
        self.assertEqual(result, [])

    def test_get_llm_client_returns_litellm_module(self):
        """Backward compatibility: get_llm_client() returns the litellm module."""
        os.environ["GEMINI_API_KEY"] = "test-key"
        from src.shared.api_clients.llm_client import get_llm_client

        import litellm

        client = get_llm_client()
        self.assertIs(client, litellm)

    @patch("src.shared.api_clients.llm_client.litellm.completion")
    def test_generate_content_wrapper(self, mock_completion):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Response"
        mock_response.choices[0].message.tool_calls = None
        mock_completion.return_value = mock_response

        from src.shared.api_clients.llm_client import generate_content

        response = generate_content(
            "gemini/gemini-2.5-flash",
            system_prompt="You are helpful",
            contents="Hello",
            temperature=0.7,
        )
        self.assertEqual(response.choices[0].message.content, "Response")

        call_args = mock_completion.call_args
        self.assertIsNotNone(call_args)
        messages = call_args[1]["messages"]
        self.assertEqual(len(messages), 2)
        self.assertEqual(messages[0]["role"], "system")
        self.assertEqual(messages[0]["content"], "You are helpful")
        self.assertEqual(messages[1]["role"], "user")
        self.assertEqual(messages[1]["content"], "Hello")


class TestToolLoopIntegration(unittest.TestCase):
    """Tests for run_tool_loop directly (not through completion wrapper)."""

    def test_build_tool_schemas_skips_missing_name(self):
        from src.shared.api_clients.tool_loop import build_tool_schemas

        tools = [
            {"description": "no name here"},
            {"name": "valid", "description": "valid", "parameters": {}},
        ]
        schemas = build_tool_schemas(tools)
        self.assertEqual(len(schemas), 1)
        self.assertEqual(schemas[0]["function"]["name"], "valid")

    def test_run_tool_loop_multi_round(self):
        """Three tool calls across two rounds — verify all executed."""
        from src.shared.api_clients.tool_loop import run_tool_loop

        calls_log = []

        def tool_a(x):
            calls_log.append(f"a({x})")
            return {"result": x}

        def tool_b(y):
            calls_log.append(f"b({y})")
            return {"result": y}

        registry = {"tool_a": tool_a, "tool_b": tool_b}
        messages = [{"role": "user", "content": "do work"}]

        # Round 1: two tool_calls → tool_a + tool_b
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
        msg1.model_dump.return_value = {"role": "assistant", "tool_calls": [
            {"id": "c1", "type": "function", "function": {"name": "tool_a", "arguments": '{"x": "hello"}'}},
            {"id": "c2", "type": "function", "function": {"name": "tool_b", "arguments": '{"y": "world"}'}},
        ]}
        resp1 = MagicMock()
        resp1.choices = [MagicMock()]
        resp1.choices[0].message = msg1

        # Round 2: no more tool_calls, final text.
        msg2 = MagicMock()
        msg2.content = "Done"
        msg2.tool_calls = None
        resp2 = MagicMock()
        resp2.choices = [MagicMock()]
        resp2.choices[0].message = msg2

        call_index = [0]
        responses = [resp1, resp2]

        def completion_fn(msgs):
            idx = call_index[0]
            call_index[0] += 1
            return responses[idx]

        result = run_tool_loop(messages, registry, completion_fn)
        self.assertEqual(result.choices[0].message.content, "Done")
        self.assertEqual(calls_log, ["a(hello)", "b(world)"])

    def test_run_tool_loop_max_rounds_exhausted(self):
        """When tools keep getting called, stop at MAX_TOOL_ROUNDS."""
        from src.shared.api_clients.tool_loop import run_tool_loop, MAX_TOOL_ROUNDS

        def endless_tool():
            return {"ok": True}

        registry = {"endless_tool": endless_tool}
        messages = [{"role": "user", "content": "loop"}]

        def make_response():
            tc = MagicMock()
            tc.id = "cx"
            tc.type = "function"
            tc.function.name = "endless_tool"
            tc.function.arguments = "{}"
            msg = MagicMock()
            msg.tool_calls = [tc]
            msg.model_dump.return_value = {"role": "assistant", "tool_calls": [
                {"id": "cx", "type": "function", "function": {"name": "endless_tool", "arguments": "{}"}},
            ]}
            resp = MagicMock()
            resp.choices = [MagicMock()]
            resp.choices[0].message = msg
            return resp

        call_count = [0]

        def completion_fn(msgs):
            call_count[0] += 1
            return make_response()

        run_tool_loop(messages, registry, completion_fn)
        self.assertEqual(call_count[0], MAX_TOOL_ROUNDS)


if __name__ == "__main__":
    unittest.main()
