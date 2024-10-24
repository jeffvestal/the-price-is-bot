# app/routers/users.py

from fastapi import APIRouter, HTTPException, status
from app.services.elastic_service import store_user, get_user_by_username
from app.models import UserCreate
import uuid

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/register", response_model=dict)
async def register_user(user: UserCreate):
    """
    Registers a new user.

    :param user: The user registration data.
    :return: Confirmation message and user token.
    """
    existing_user = await get_user_by_username(user.username)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")

    user_in_db = user.model_dump()
    user_in_db['token'] = str(uuid.uuid4())
    user_in_db['is_admin'] = False  # Default to False; set to True manually or via another endpoint

    await store_user(user_in_db)

    return {
        "message": "User registered successfully",
        "token": user_in_db['token'],
        "username": user_in_db['username'],
        "email": user_in_db['email'],
        "company": user_in_db['company'],
    }
