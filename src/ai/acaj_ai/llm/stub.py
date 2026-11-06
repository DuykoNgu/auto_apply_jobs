import json
import re

SECTION_KINDS: dict[str, str] = {
    "kinh nghiệm": "EXPERIENCE",
    "experience": "EXPERIENCE",
    "work experience": "EXPERIENCE",
    "dự án": "PROJECT",
    "projects": "PROJECT",
    "học vấn": "EDUCATION",
    "education": "EDUCATION",
    "chứng chỉ": "CERTIFICATE",
    "certificates": "CERTIFICATE",
    "kỹ năng": "SKILL_LIST",
    "skills": "SKILL_LIST",
    "tóm tắt": "SUMMARY",
    "summary": "SUMMARY",
}
PLACEHOLDER = re.compile(r"⟦[A-Z]+_\d+⟧")
CV_TAG = re.compile(r"</?cv(\s[^>]*)?>")
PART_NUMBER = re.compile(r'<cv part="(\d+)"')


class StubLLMClient:
    model = "stub-rule-based"

    def complete_json(self, *, system: str, document: str) -> str:
        lines = [line.strip() for line in document.splitlines() if line.strip()]
        lines = [line for line in lines if not CV_TAG.fullmatch(line)]
        part = PART_NUMBER.search(document)
        is_first_part = part is None or part.group(1) == "1"
        facts: list[dict[str, object]] = []
        if lines and is_first_part:
            contact = [line for line in lines[1:3] if PLACEHOLDER.search(line)]
            headline = [line for line in lines[1:3] if line not in contact]
            facts.append(
                {
                    "kind": "PROFILE",
                    "title": lines[0],
                    "body": " · ".join(headline + contact),
                    "confidence": 0.95 if contact else 0.7,
                }
            )
        facts.extend(_section_facts(lines))
        return json.dumps({"facts": facts}, ensure_ascii=False)


def _section_facts(lines: list[str]) -> list[dict[str, object]]:
    sections: list[tuple[str, list[str]]] = []
    for line in lines:
        kind = SECTION_KINDS.get(line.rstrip(":").lower())
        if kind:
            sections.append((kind, []))
        elif sections:
            sections[-1][1].append(line)
    facts: list[dict[str, object]] = []
    for kind, body in sections:
        if not body:
            continue
        is_skills = kind == "SKILL_LIST"
        skills = [s.strip() for s in re.split(r"[,;•]", " ".join(body)) if s.strip()]
        facts.append(
            {
                "kind": kind,
                "title": None if is_skills else body[0],
                "body": ", ".join(skills) if is_skills else "\n".join(body),
                "skills": skills if is_skills else [],
                "confidence": 0.9,
            }
        )
    return facts
