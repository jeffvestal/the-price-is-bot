# backend/app/routers/admin.py

from fastapi import APIRouter, Depends, HTTPException, status
from app.utils.auth import authenticate_admin, authenticate_admin_with_password
from app.services.elastic_service import get_settings, update_settings, generate_and_store_tokens, deactivate_token, list_tokens
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.models import TokenResponse

import logging

# Configure logger
logger = logging.getLogger("admin")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter(
    "%(asctime)s - %(levelname)s - %(message)s"
)
handler.setFormatter(formatter)
logger.addHandler(handler)

router = APIRouter(prefix="/admin", tags=["admin"])

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str

class SettingsUpdate(BaseModel):
    target_price: float
    time_limit: int
    max_podiums: Optional[int] = None  # Optional field

@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(login_request: AdminLoginRequest):
    """
    Authenticates an admin user using username and password.

    :param login_request: Admin login data.
    :return: JWT access token.
    """
    access_token = await authenticate_admin_with_password(login_request.username, login_request.password)
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/settings")
async def update_game_settings(
    settings: SettingsUpdate,
    authorized: bool = Depends(authenticate_admin)
):
    await update_settings(settings.dict())
    return {"message": "Settings updated"}

@router.get("/settings")
async def get_game_settings(
    authorized: bool = Depends(authenticate_admin)
):
    settings = await get_settings()
    return settings

@router.get("/dashboard")
async def admin_dashboard(current_user: dict = Depends(authenticate_admin)):
    """
    Example admin dashboard endpoint.

    :param current_user: The currently authenticated admin user.
    :return: Admin dashboard data.
    """
    # Implement your admin-specific logic here
    return {"message": f"Welcome to the admin dashboard, {current_user['username']}!"}

# Define request and response models
class TokenGenerationRequest(BaseModel):
    count: int = 1  # Number of tokens to generate

class TokenGenerationResponse(BaseModel):
    tokens: List[str]

# Add the new endpoint to the admin router
@router.post("/generate-tokens", response_model=TokenGenerationResponse)
async def generate_tokens(
    request: TokenGenerationRequest,
    authorized: bool = Depends(authenticate_admin)
):
    tokens = await generate_and_store_tokens(request.count)
    return TokenGenerationResponse(tokens=tokens)

class TokenDeactivationRequest(BaseModel):
    token: str

@router.post("/deactivate-token")
async def deactivate_token_endpoint(
    request: TokenDeactivationRequest,
    authorized: bool = Depends(authenticate_admin)
):
    success = await deactivate_token(request.token)
    if success:
        return {"message": f"Token '{request.token}' has been deactivated."}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token not found or already deactivated."
        )

@router.get("/tokens", response_model=List[TokenResponse])
async def list_tokens_endpoint(
    status: Optional[str] = None,
    authorized: bool = Depends(authenticate_admin)
):
    logger.debug(f"Received status parameter: {status}")
    tokens = await list_tokens(status)
    return tokens
