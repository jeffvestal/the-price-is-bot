# backend/app/routers/users.py

from fastapi import APIRouter, HTTPException, status, Depends
from app.services.elastic_service import (
    store_user,
    get_user_by_username,
    validate_and_deactivate_token,
    get_user_by_token
)
from app.models import UserCreate, UserRegistrationRequest, TokenValidationRequest
from app.utils.auth import create_jwt
from pydantic import BaseModel
from typing import Optional
from datetime import timedelta

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/register", response_model=dict)
async def register_user(user: UserRegistrationRequest):
    """
    Registers a new user using a valid token.

    :param user: The user registration data along with the token.
    :return: Confirmation message and user details.
    """
    from app.services.token_service import validate_and_deactivate_token
    from app.services.elastic_service import es

    # Validate and deactivate the token
    valid_token = await validate_and_deactivate_token(user.token)
    if not valid_token:
        raise HTTPException(status_code=400, detail="Invalid or expired token.")

    # Check if the username already exists
    existing_user = await get_user_by_username(user.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    # Validate and deactivate the provided token atomically
    await validate_and_deactivate_token(user.token)

    # Prepare user data for storage
    user_in_db = {
        "username": user.username,
        "email": user.email,
        "company": user.company,
        "token": user.token,  # Store the token used for registration
        "is_admin": False,    # Default to False
        "active": True        # User is active upon registration
    }

    # Store the new user in Elasticsearch
    await store_user(user_in_db)

    # Generate a JWT token for the user
    jwt_payload = {
        "sub": user_in_db["username"],
        "email": user_in_db["email"],
        "is_admin": user_in_db.get("is_admin", False)
    }
    access_token = create_jwt(data=jwt_payload)

    return {
        "message": "User registered successfully",
        "username": user_in_db['username'],
        "email": user_in_db['email'],
        "company": user_in_db['company'],
        "access_token": access_token  # Return the JWT token
    }


@router.post("/validate-token", response_model=dict)
async def validate_token(token_request: TokenValidationRequest):
    """
    Validates a one-time token, deactivates it, and issues a JWT for authenticated sessions.

    :param token_request: The token to validate.
    :return: A JWT for authenticated requests.
    """
    token = token_request.token

    # Retrieve the user associated with the token before deactivation
    user = await get_user_by_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Validate and deactivate the token atomically
    await validate_and_deactivate_token(token)

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
