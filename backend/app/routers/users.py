# backend/app/routers/users.py

from fastapi import APIRouter, HTTPException, status
from app.models import UserRegistrationRequest, TokenValidationRequest
from app.utils.auth import create_jwt
from typing import Optional
from datetime import timedelta
import secrets
from datetime import datetime

from app.services.elastic_service import store_user, get_user_by_username, validate_and_deactivate_token
from app.services.elastic_service import es  # Import the Elasticsearch client
from app.utils.auth import get_password_hash  # Deferred import to prevent circular import

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/register", response_model=dict)
async def register_user(user: UserRegistrationRequest):
    """
    Registers a new user with only a username.

    :param user: The user registration data.
    :return: Confirmation message and user details.
    """
    # Check if the username already exists
    existing_user = await get_user_by_username(user.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    # Prepare user data for storage
    user_in_db = {
        "username": user.username,
        "email": None,        # Set to None as it's no longer provided
        "company": None,      # Set to None as it's no longer provided
        "is_admin": False,    # Default to False
        "active": True        # User is active upon registration
        # Removed password field
    }

    # Store the new user in Elasticsearch
    try:
        await store_user(user_in_db)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to store user.")

    # Generate a JWT token for the user
    jwt_payload = {
        "sub": user_in_db["username"],
        "is_admin": user_in_db.get("is_admin", False)
    }
    access_token_expires = timedelta(minutes=60)  # 1 hour expiration
    access_token = create_jwt(data=jwt_payload, expires_delta=access_token_expires)

    return {
        "message": "User registered successfully",
        "username": user_in_db['username'],
        "access_token": access_token  # Return the JWT token
        # Removed 'email', 'company', and 'token' from the response
    }

@router.post("/validate-token", response_model=dict)
async def validate_token(token_request: TokenValidationRequest):
    """
    Validates a one-time token, deactivates it, and issues a JWT for authenticated sessions.
    Also handles admin token to issue admin JWT.

    :param token_request: The token to validate.
    :return: A JWT for authenticated requests.
    """
    token = token_request.token

    # Check if the token is an admin token
    admin_user = await get_user_by_username("admin_user")
    if admin_user and admin_user.get("token") == token and admin_user.get("is_admin", False):
        # Generate admin JWT
        jwt_payload = {
            "sub": admin_user["username"],
            "email": admin_user["email"],
            "is_admin": admin_user.get("is_admin", False)
        }
        access_token_expires = timedelta(minutes=60)  # 1 hour expiration
        access_token = create_jwt(data=jwt_payload, expires_delta=access_token_expires)
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }

    # Regular token validation
    is_valid = await validate_and_deactivate_token(token)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token."
        )

    # Create JWT payload
    jwt_payload = {
        "sub": "game_user",  # Placeholder, can be updated as needed
        "is_admin": False
    }

    # Generate JWT with expiration
    access_token_expires = timedelta(minutes=60)  # 1 hour expiration
    access_token = create_jwt(data=jwt_payload, expires_delta=access_token_expires)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
