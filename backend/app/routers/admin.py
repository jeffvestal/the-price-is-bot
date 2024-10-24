# app/routers/admin.py

from fastapi import APIRouter, Depends, HTTPException
from app.utils.auth import authenticate_admin
from app.services.elastic_service import get_settings, update_settings
from pydantic import BaseModel

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
