from io import BytesIO

from docx import Document
from pypdf import PdfReader
from pypdf.errors import PyPdfError

MAX_PAGES = 5


class DocumentError(Exception):
    pass


class UnsupportedDocumentError(DocumentError):
    pass


class TooManyPagesError(DocumentError):
    pass


class NoTextFoundError(DocumentError):
    pass


def read_document(filename: str, data: bytes) -> str:
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    readers = {"pdf": _read_pdf, "docx": _read_docx}
    if extension not in readers:
        raise UnsupportedDocumentError(extension)
    text = readers[extension](data).strip()
    if not text:
        raise NoTextFoundError(filename)
    return text


def _read_pdf(data: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(data))
        if len(reader.pages) > MAX_PAGES:
            raise TooManyPagesError(str(len(reader.pages)))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except PyPdfError as error:
        raise NoTextFoundError("unreadable pdf") from error


def _read_docx(data: bytes) -> str:
    try:
        document = Document(BytesIO(data))
    except Exception as error:
        raise NoTextFoundError("unreadable docx") from error
    return "\n".join(paragraph.text for paragraph in document.paragraphs)
