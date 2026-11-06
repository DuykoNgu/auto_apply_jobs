HEADING_MAX_CHARS = 40
NOT_HEADING_START = ("•", "-", "*")
NOT_HEADING_END = (".", ",", ";")


def split_into_chunks(text: str, max_chars: int) -> list[str]:
    chunks: list[str] = []
    current: list[str] = []
    size = 0
    for line in text.splitlines():
        if current and size + len(line) + 1 > max_chars:
            cut = _last_heading_index(current)
            chunks.append("\n".join(current[:cut]))
            current = current[cut:]
            size = sum(len(kept) + 1 for kept in current)
        current.append(line)
        size += len(line) + 1
    chunks.append("\n".join(current))
    return [chunk for chunk in chunks if chunk.strip()]


def _last_heading_index(lines: list[str]) -> int:
    for index in range(len(lines) - 1, len(lines) // 2, -1):
        if _looks_like_heading(lines[index]):
            return index
    return len(lines)


def _looks_like_heading(line: str) -> bool:
    stripped = line.strip()
    return (
        0 < len(stripped) <= HEADING_MAX_CHARS
        and not stripped.startswith(NOT_HEADING_START)
        and not stripped.endswith(NOT_HEADING_END)
    )
