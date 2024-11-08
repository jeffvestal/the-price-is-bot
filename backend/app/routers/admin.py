# app/routers/admin.py

from fastapi import APIRouter, Depends, HTTPException
from app.utils.auth import authenticate_admin
from app.services.elastic_service import get_settings, update_settings
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.models import TokenResponse



router = APIRouter(prefix="/admin", tags=["admin"])

class SettingsUpdate(BaseModel):
    target_price: float
    time_limit: int

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
    from app.services.token_service import generate_and_store_tokens

    tokens = await generate_and_store_tokens(request.count)
    return TokenGenerationResponse(tokens=tokens)


class TokenDeactivationRequest(BaseModel):
    token: str

@router.post("/deactivate-token")
async def deactivate_token(
    request: TokenDeactivationRequest,
    authorized: bool = Depends(authenticate_admin)
):
    from app.services.token_service import deactivate_token

    success = await deactivate_token(request.token)
    if success:
        return {"message": f"Token '{request.token}' has been deactivated."}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token not found or already deactivated."
        )


@router.get("/tokens", response_model=List[TokenResponse])
async def list_tokens(
    status: Optional[str] = None,
    authorized: bool = Depends(authenticate_admin)
):
    print(f"Received status parameter: {status}")
    from app.services.token_service import list_tokens
    tokens = await list_tokens(status)
    return tokens




