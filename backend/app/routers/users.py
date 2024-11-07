# backend/app/routers/users.py

from fastapi import APIRouter, HTTPException, status, Depends
from app.services.elastic_service import (
    store_user,
    get_user_by_username,
    get_active_user_by_token,
    deactivate_token,
    TokenAlreadyDeactivatedException
)
from app.models import UserCreate
import uuid
from app.utils.auth import create_jwt
from pydantic import BaseModel
from datetime import timedelta

router = APIRouter(prefix="/users", tags=["users"])


class TokenValidationRequest(BaseModel):
    token: str


@router.post("/register", response_model=dict)
async def register_user(user: UserCreate):
    """
    Registers a new user.

    :param user: The user registration data.
    :return: Confirmation message and user token.
    """
    existing_user = await get_user_by_username(user.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    user_in_db = user.model_dump()
    user_in_db['token'] = str(uuid.uuid4())
    user_in_db['is_admin'] = False  # Default to False; set to True manually or via another endpoint
    user_in_db['active'] = True  # Ensure the token is active upon registration

    await store_user(user_in_db)

    return {
        "message": "User registered successfully",
        "token": user_in_db['token'],
        "username": user_in_db['username'],
        "email": user_in_db['email'],
        "company": user_in_db['company'],
    }


@router.post("/validate-token", response_model=dict)
async def validate_token(token_request: TokenValidationRequest):
    """
    Validates a one-time token, deactivates it, and issues a JWT for authenticated sessions.

    :param token_request: The token to validate.
    :return: A JWT for authenticated requests.
    """
    token = token_request.token
    user = await get_active_user_by_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Deactivate the token to prevent reuse
        await deactivate_token(token)
    except TokenAlreadyDeactivatedException as e:
        # Token was already deactivated; inform the client
        raise e
    except HTTPException as e:
        # Propagate existing HTTPExceptions
        raise e
    except Exception as e:
        # For any other unexpected errors, return a generic 500 error
        raise HTTPException(status_code=500, detail="Internal Server Error")

    # Create JWT payload
    jwt_payload = {
        "sub": user["username"],
        "email": user["email"],
        "is_admin": user.get("is_admin", False)
    }

    # Generate JWT with expiration
    access_token_expires = timedelta(minutes=60)  # 1 hour expiration
    access_token = create_jwt(data=jwt_payload, expires_delta=access_token_expires)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
