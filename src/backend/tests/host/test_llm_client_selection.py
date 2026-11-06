from collections.abc import Iterator

import pytest
from acaj_ai import OpenAILLMClient, StubLLMClient

from host.container import build_llm_client
from shared.config import get_settings


@pytest.fixture(autouse=True)
def fresh_settings() -> Iterator[None]:
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_empty_key_uses_the_stub_in_development(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("OPENAI_API_KEY", "")
    assert isinstance(build_llm_client(), StubLLMClient)


def test_empty_key_is_an_error_in_production(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("OPENAI_API_KEY", "")
    with pytest.raises(RuntimeError, match="OPENAI_API_KEY"):
        build_llm_client()


def test_key_selects_the_openai_client(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    client = build_llm_client()
    assert isinstance(client, OpenAILLMClient)
