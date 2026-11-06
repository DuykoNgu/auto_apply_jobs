from shared.errors import AppError


class UnsupportedFileError(AppError):
    status_code = 400
    title = "Unsupported file. Upload a PDF or DOCX."


class FileTooLargeError(AppError):
    status_code = 413
    title = "File is too large."


class CvNotFoundError(AppError):
    status_code = 404
    title = "CV not found."


class CvFileNotFoundError(AppError):
    status_code = 404
    title = "Original file not found."
