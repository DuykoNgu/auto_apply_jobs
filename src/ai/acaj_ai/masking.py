import re
from dataclasses import dataclass, field

PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("EMAIL", re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")),
    ("PHONE", re.compile(r"(?:\+84|0)(?:[ .]?\d){9,10}")),
)


@dataclass
class MaskedText:
    text: str
    table: dict[str, str] = field(default_factory=dict)

    def restore(self, value: str) -> str:
        for placeholder, original in self.table.items():
            value = value.replace(placeholder, original)
        return value


def mask_pii(text: str) -> MaskedText:
    masked = MaskedText(text)
    for label, pattern in PATTERNS:
        counter = 0

        def replace(match: re.Match[str], label: str = label) -> str:
            nonlocal counter
            counter += 1
            placeholder = f"⟦{label}_{counter}⟧"
            masked.table[placeholder] = match.group(0)
            return placeholder

        masked.text = pattern.sub(replace, masked.text)
    return masked
