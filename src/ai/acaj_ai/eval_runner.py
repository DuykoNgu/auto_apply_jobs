from dataclasses import dataclass
from pathlib import Path

from pydantic import BaseModel

from acaj_ai.extraction.cv import parse_cv
from acaj_ai.llm.client import LLMClient
from acaj_ai.llm.stub import StubLLMClient

DATASETS = Path(__file__).resolve().parents[1] / "evals" / "datasets"


class CvParseCase(BaseModel):
    name: str
    text: str
    expect_status: str
    expect_kinds: list[str]
    expect_profile_title: str
    expect_profile_contains: list[str]
    expect_skills: list[str]


@dataclass(frozen=True)
class CaseResult:
    name: str
    problems: list[str]

    @property
    def passed(self) -> bool:
        return not self.problems


def load_cv_parse_cases() -> list[CvParseCase]:
    lines = (DATASETS / "cv-parse.jsonl").read_text("utf-8").splitlines()
    return [CvParseCase.model_validate_json(line) for line in lines if line.strip()]


def check_cv_parse(case: CvParseCase, client: LLMClient) -> CaseResult:
    result = parse_cv(case.text, client=client)
    if result.value is None:
        return CaseResult(case.name, [f"failed with {result.error}"])
    facts = result.value.facts
    profile = facts[0]
    skills = [skill for fact in facts for skill in fact.skills]
    checks = [
        (f"status {result.status}", result.status != case.expect_status),
        (f"kinds {[fact.kind for fact in facts]}", [f.kind for f in facts] != case.expect_kinds),
        (f"title {profile.title}", profile.title != case.expect_profile_title),
        (
            f"profile body {profile.body}",
            any(part not in profile.body for part in case.expect_profile_contains),
        ),
        (f"skills {skills}", skills != case.expect_skills),
    ]
    return CaseResult(case.name, [message for message, failed in checks if failed])


def run_cv_parse() -> list[CaseResult]:
    client = StubLLMClient()
    return [check_cv_parse(case, client) for case in load_cv_parse_cases()]
