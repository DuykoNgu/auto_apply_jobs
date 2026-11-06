import logging
from types import SimpleNamespace
from typing import cast

import pytest
from openai import OpenAI

from acaj_ai import OpenAILLMClient


class FakeCompletions:
    def __init__(self) -> None:
        self.kwargs: dict[str, object] = {}

    def create(self, **kwargs: object) -> object:
        self.kwargs = kwargs
        message = SimpleNamespace(content='{"facts": []}')
        return SimpleNamespace(choices=[SimpleNamespace(message=message)])


def make_client(effort: str | None) -> tuple[OpenAILLMClient, FakeCompletions]:
    completions = FakeCompletions()
    fake = SimpleNamespace(chat=SimpleNamespace(completions=completions))
    return OpenAILLMClient(cast(OpenAI, fake), "gpt-test", effort), completions


def test_sends_json_mode_request_and_returns_content() -> None:
    client, completions = make_client(None)

    assert client.complete_json(system="sys", document="<cv>x</cv>") == '{"facts": []}'
    assert completions.kwargs["model"] == "gpt-test"
    assert completions.kwargs["response_format"] == {"type": "json_object"}
    assert completions.kwargs["messages"] == [
        {"role": "system", "content": "sys"},
        {"role": "user", "content": "<cv>x</cv>"},
    ]


def test_reasoning_effort_is_sent_only_when_configured() -> None:
    client, completions = make_client("low")
    client.complete_json(system="s", document="d")
    assert completions.kwargs["extra_body"] == {"reasoning_effort": "low"}

    client, completions = make_client(None)
    client.complete_json(system="s", document="d")
    assert completions.kwargs["extra_body"] is None


def test_failed_call_is_logged_with_traceback_and_without_the_document(
    caplog: pytest.LogCaptureFixture,
) -> None:
    class Failing:
        def create(self, **kwargs: object) -> object:
            raise TimeoutError("request timed out")

    fake = SimpleNamespace(chat=SimpleNamespace(completions=Failing()))
    client = OpenAILLMClient(cast(OpenAI, fake), "gpt-test")

    with caplog.at_level(logging.INFO), pytest.raises(TimeoutError):
        client.complete_json(system="s", document="SECRET CV TEXT")

    record = next(r for r in caplog.records if "openai call failed" in r.getMessage())
    assert record.levelno == logging.ERROR
    assert record.exc_info is not None
    assert "model=gpt-test" in record.getMessage()
    assert "SECRET CV TEXT" not in caplog.text


def test_successful_call_logs_timing_and_sizes(caplog: pytest.LogCaptureFixture) -> None:
    client, _ = make_client(None)
    with caplog.at_level(logging.INFO):
        client.complete_json(system="s", document="d")
    assert "openai call ok model=gpt-test" in caplog.text
    assert "elapsed_ms=" in caplog.text
