import logging
import threading

import pytest

from acaj_ai import ParsedFact, StubLLMClient, parse_cv
from acaj_ai.extraction.cv import merge_parts

CV_TEXT = "An Nguyen\nBackend\nan@example.com +84 912 345 678\nSkills\nPython, SQL"


class RecordingLLM(StubLLMClient):
    document = ""

    def complete_json(self, *, system: str, document: str) -> str:
        self.document = document
        return super().complete_json(system=system, document=document)


class BrokenLLM:
    model = "broken"
    calls = 0

    def complete_json(self, *, system: str, document: str) -> str:
        self.calls += 1
        return "not json"


def test_llm_only_sees_masked_text_and_result_is_restored() -> None:
    client = RecordingLLM()
    result = parse_cv(CV_TEXT, client=client)
    assert "an@example.com" not in client.document
    assert result.value is not None
    assert "an@example.com" in result.value.facts[0].body
    assert result.status == "READY"
    assert result.prompt_version == "cv-extract-v4"


def test_invalid_llm_output_is_retried_then_fails() -> None:
    client = BrokenLLM()
    result = parse_cv(CV_TEXT, client=client)
    assert result.status == "FAILED"
    assert result.error == "invalid_llm_output"
    assert client.calls == 3


LONG_CV = "\n".join(
    [
        "An Nguyen",
        "Backend",
        "an@example.com 0912 345 678",
        "Experience",
        *[f"Built backend service number {i} used by many customers daily" for i in range(8)],
        "Education",
        "HCMC University of Technology",
        "Skills",
        "Python, SQL",
    ]
)


class CountingLLM(StubLLMClient):
    def __init__(self) -> None:
        self.documents: list[str] = []
        self._lock = threading.Lock()

    def complete_json(self, *, system: str, document: str) -> str:
        with self._lock:
            self.documents.append(document)
        return super().complete_json(system=system, document=document)


def test_long_cv_is_read_in_several_small_calls_and_merged() -> None:
    client = CountingLLM()
    result = parse_cv(LONG_CV, client=client, max_chunk_chars=300)

    assert len(client.documents) > 1
    assert all(len(document) < 500 for document in client.documents)
    assert all("an@example.com" not in document for document in client.documents)
    assert result.value is not None
    kinds = [fact.kind for fact in result.value.facts]
    assert kinds == ["PROFILE", "EXPERIENCE", "EDUCATION", "SKILL_LIST"]
    assert "an@example.com" in result.value.facts[0].body


def test_failing_part_fails_the_whole_cv_instead_of_losing_data() -> None:
    class FailsOnSecondPart(StubLLMClient):
        def complete_json(self, *, system: str, document: str) -> str:
            if 'part="2"' in document:
                return "not json"
            return super().complete_json(system=system, document=document)

    result = parse_cv(LONG_CV, client=FailsOnSecondPart(), max_chunk_chars=300)
    assert result.status == "FAILED"
    assert result.error == "invalid_llm_output"


def fact(kind: str, title: str | None, body: str, skills: list[str] | None = None) -> ParsedFact:
    return ParsedFact.model_validate(
        {"kind": kind, "title": title, "body": body, "skills": skills or [], "confidence": 0.9}
    )


def test_merge_keeps_one_profile_joins_skills_and_drops_duplicates() -> None:
    merged = merge_parts(
        [
            [
                fact("PROFILE", "An", "dev"),
                fact("EXPERIENCE", "Intern", "a"),
                fact("SKILL_LIST", None, "Python", ["Python"]),
            ],
            [
                fact("PROFILE", "Wrong", "x"),
                fact("EXPERIENCE", "intern", "dup"),
                fact("EXPERIENCE", "Lead", "b"),
            ],
            [fact("SKILL_LIST", None, "Python, SQL", ["Python", "SQL"])],
        ]
    )
    assert [(f.kind, f.title) for f in merged] == [
        ("PROFILE", "An"),
        ("EXPERIENCE", "Intern"),
        ("EXPERIENCE", "Lead"),
        ("SKILL_LIST", None),
    ]
    assert merged[-1].skills == ["Python", "SQL"]
    assert merged[-1].body == "Python, SQL"


def test_invalid_output_is_logged_without_cv_text(caplog: pytest.LogCaptureFixture) -> None:
    with caplog.at_level(logging.INFO):
        parse_cv(CV_TEXT, client=BrokenLLM())
    assert caplog.text.count("cv parse invalid output") == 3
    assert "cv parse failed error=invalid_llm_output" in caplog.text
    assert "An Nguyen" not in caplog.text
    assert "an@example.com" not in caplog.text
