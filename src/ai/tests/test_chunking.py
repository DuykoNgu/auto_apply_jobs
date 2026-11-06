from acaj_ai.extraction.chunking import split_into_chunks


def test_short_text_stays_in_one_chunk() -> None:
    assert split_into_chunks("A\nB\nC", max_chars=100) == ["A\nB\nC"]


def test_empty_text_has_no_chunks() -> None:
    assert split_into_chunks("  \n ", max_chars=100) == []


def test_split_prefers_a_heading_so_entries_stay_whole() -> None:
    lines = [f"Built a long running backend service number {i} for customers" for i in range(6)]
    text = "\n".join(["Experience", *lines, "Education", "HCMC University", "Degree in IT here"])
    chunks = split_into_chunks(text, max_chars=380)
    assert len(chunks) == 2
    assert chunks[0].startswith("Experience")
    assert chunks[1].startswith("Education")


def test_no_line_is_lost_or_duplicated() -> None:
    text = "\n".join(f"line number {i} with some words in it" for i in range(80))
    chunks = split_into_chunks(text, max_chars=300)
    assert "\n".join(chunks).splitlines() == text.splitlines()
    assert all(len(chunk) <= 300 + 40 for chunk in chunks)


def test_a_single_long_line_is_kept_whole() -> None:
    long_line = "word " * 200
    assert split_into_chunks(long_line, max_chars=50) == [long_line]
