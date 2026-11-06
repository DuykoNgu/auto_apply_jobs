import logging
import time
from typing import Protocol

from openai import OpenAI

logger = logging.getLogger(__name__)


class LLMClient(Protocol):
    model: str

    def complete_json(self, *, system: str, document: str) -> str: ...


class OpenAILLMClient:
    def __init__(self, client: OpenAI, model: str, reasoning_effort: str | None = None) -> None:
        self.model = model
        self._client = client
        self._extra_body = {"reasoning_effort": reasoning_effort} if reasoning_effort else None

    def complete_json(self, *, system: str, document: str) -> str:
        started = time.perf_counter()
        try:
            response = self._client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": document},
                ],
                response_format={"type": "json_object"},
                extra_body=self._extra_body,
            )
        except Exception:
            logger.exception(
                "openai call failed model=%s elapsed_ms=%d input_chars=%d",
                self.model,
                _elapsed_ms(started),
                len(document),
            )
            raise
        content = response.choices[0].message.content or ""
        logger.info(
            "openai call ok model=%s elapsed_ms=%d input_chars=%d output_chars=%d",
            self.model,
            _elapsed_ms(started),
            len(document),
            len(content),
        )
        return content


def _elapsed_ms(started: float) -> int:
    return round((time.perf_counter() - started) * 1000)
