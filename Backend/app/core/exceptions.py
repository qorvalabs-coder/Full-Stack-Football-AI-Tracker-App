from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class AppException(Exception):
    """Base application exception."""

    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str | None = None,
        context: dict | None = None,
    ) -> None:
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code
        self.context = context or {}
        super().__init__(detail)


class NotFoundException(AppException):
    def __init__(self, resource: str, identifier: str) -> None:
        super().__init__(
            status_code=404,
            detail=f"{resource} '{identifier}' not found.",
            error_code="NOT_FOUND",
            context={"resource": resource, "id": identifier},
        )


class DataLoadError(AppException):
    def __init__(self, detail: str, path: str = "") -> None:
        super().__init__(
            status_code=500,
            detail=detail,
            error_code="DATA_LOAD_ERROR",
            context={"path": path},
        )


class InvalidUploadError(AppException):
    def __init__(self, detail: str) -> None:
        super().__init__(
            status_code=400,
            detail=detail,
            error_code="INVALID_UPLOAD",
        )


class AuthenticationError(AppException):
    def __init__(self, detail: str = "Authentication failed.") -> None:
        super().__init__(
            status_code=401,
            detail=detail,
            error_code="UNAUTHORIZED",
        )


class ConflictError(AppException):
    def __init__(self, detail: str) -> None:
        super().__init__(
            status_code=409,
            detail=detail,
            error_code="CONFLICT",
        )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        body: dict = {"detail": exc.detail}
        if exc.error_code:
            body["error_code"] = exc.error_code
        if exc.context:
            body["context"] = exc.context
        return JSONResponse(status_code=exc.status_code, content=body)

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={
                "detail": "An unexpected internal error occurred.",
                "error_code": "INTERNAL_ERROR",
            },
        )
