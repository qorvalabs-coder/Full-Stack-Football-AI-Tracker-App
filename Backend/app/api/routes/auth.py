from __future__ import annotations

from fastapi import APIRouter, Header
from typing import Optional

from app.core.exceptions import AuthenticationError
from app.models.auth import LoginRequest, RegisterRequest, TokenResponse
from app.models.responses import ApiResponse
from app.services import auth_service

router = APIRouter()


@router.post("/register", response_model=ApiResponse[TokenResponse], status_code=201)
async def register(body: RegisterRequest) -> ApiResponse:
    """
    Create a new account and return a JWT access token.
    """
    user, token = auth_service.register(
        name=body.name,
        email=body.email,
        password=body.password,
    )
    return ApiResponse.ok(
        TokenResponse(
            access_token=token,
            token_type="bearer",
            user=auth_service.to_public(user),
        ),
        message="Account created successfully.",
    )


@router.post("/login", response_model=ApiResponse[TokenResponse])
async def login(body: LoginRequest) -> ApiResponse:
    """
    Authenticate with email and password, return JWT access token.
    """
    user, token = auth_service.login(email=body.email, password=body.password)
    return ApiResponse.ok(
        TokenResponse(
            access_token=token,
            token_type="bearer",
            user=auth_service.to_public(user),
        ),
        message="Login successful.",
    )


@router.get("/me", response_model=ApiResponse[dict])
async def get_me(authorization: Optional[str] = Header(None)) -> ApiResponse:
    """
    Return the currently authenticated user profile.
    Expects header:  Authorization: Bearer <token>
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AuthenticationError("Authorization header missing or malformed.")
    token = authorization.split(" ", 1)[1]
    user = auth_service.get_current_user(token)
    return ApiResponse.ok(auth_service.to_public(user).model_dump(by_alias=True))
