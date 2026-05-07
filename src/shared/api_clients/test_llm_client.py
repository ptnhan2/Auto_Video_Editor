import os
import unittest
from unittest.mock import patch, MagicMock


class TestLLMClient(unittest.TestCase):

    def setUp(self):
        self._saved_env = os.environ.get("GOOGLE_GENERATIVE_AI_API_KEY")

    def tearDown(self):
        if self._saved_env is not None:
            os.environ["GOOGLE_GENERATIVE_AI_API_KEY"] = self._saved_env
        else:
            os.environ.pop("GOOGLE_GENERATIVE_AI_API_KEY", None)
        import src.shared.api_clients.llm_client as mod
        mod._client = None

    def test_get_llm_client_returns_singleton(self):
        os.environ["GOOGLE_GENERATIVE_AI_API_KEY"] = "test-key"
        from src.shared.api_clients.llm_client import get_llm_client

        client1 = get_llm_client()
        client2 = get_llm_client()
        self.assertIs(client1, client2)

    def test_get_llm_client_raises_without_api_key(self):
        os.environ.pop("GOOGLE_GENERATIVE_AI_API_KEY", None)
        import src.shared.api_clients.llm_client as mod
        mod._client = None

        from src.shared.api_clients.llm_client import get_llm_client
        with self.assertRaises(RuntimeError) as ctx:
            get_llm_client()
        self.assertIn("GOOGLE_GENERATIVE_AI_API_KEY", str(ctx.exception))

    def test_embed_texts_returns_empty_on_error(self):
        os.environ["GOOGLE_GENERATIVE_AI_API_KEY"] = "test-key"
        import src.shared.api_clients.llm_client as mod
        mod._client = None

        with patch.object(mod, "get_llm_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.models.embed_content.side_effect = RuntimeError("api error")
            mock_get_client.return_value = mock_client

            from src.shared.api_clients.llm_client import embed_texts
            result = embed_texts(["test text"])
            self.assertEqual(result, [])


if __name__ == "__main__":
    unittest.main()
