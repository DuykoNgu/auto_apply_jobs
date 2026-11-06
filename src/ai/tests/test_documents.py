import io

import pytest
from docx import Document
from pypdf import PdfWriter

from acaj_ai import (
    NoTextFoundError,
    TooManyPagesError,
    UnsupportedDocumentError,
    read_document,
)


def docx_bytes(text: str) -> bytes:
    buffer = io.BytesIO()
    document = Document()
    for line in text.splitlines():
        document.add_paragraph(line)
    document.save(buffer)
    return buffer.getvalue()


def blank_pdf(pages: int) -> bytes:
    writer = PdfWriter()
    for _ in range(pages):
        writer.add_blank_page(width=100, height=100)
    buffer = io.BytesIO()
    writer.write(buffer)
    return buffer.getvalue()


def test_read_docx_ignores_extension_case() -> None:
    assert read_document("cv.DOCX", docx_bytes("An Nguyen\nBackend")) == "An Nguyen\nBackend"


def test_unsupported_extension_is_rejected() -> None:
    with pytest.raises(UnsupportedDocumentError):
        read_document("cv.png", b"x")


def test_pdf_without_text_or_unreadable_has_no_text() -> None:
    with pytest.raises(NoTextFoundError):
        read_document("cv.pdf", blank_pdf(1))
    with pytest.raises(NoTextFoundError):
        read_document("cv.pdf", b"not a pdf")


def test_pdf_over_five_pages_is_rejected() -> None:
    with pytest.raises(TooManyPagesError):
        read_document("cv.pdf", blank_pdf(6))
