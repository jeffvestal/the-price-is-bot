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
    Registers a new user using a valid token.

    :param user: The user registration data along with the token.
    :return: Confirmation message and user details.
    """
    # Validate and deactivate the token
    is_valid = await validate_and_deactivate_token(user.token)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired token.")

    # Check if the username already exists
    existing_user = await get_user_by_username(user.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    # Generate a new token for the user (optional)
    new_token = secrets.token_urlsafe(32)
    token_doc = {
        "token": new_token,
        "active": True,
        "created_at": datetime.utcnow(),
        "username": user.username  # Associate token with username
    }

    # Store the new token in the 'tokens' index
    try:
        await es.index(index="tokens", document=token_doc, refresh='wait_for')
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate user token.")

    # Prepare user data for storage
    user_in_db = {
        "username": user.username,
        "email": user.email,
        "company": user.company,
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
        "email": user_in_db["email"],
        "is_admin": user_in_db.get("is_admin", False)
    }
    access_token_expires = timedelta(minutes=60)  # 1 hour expiration
    access_token = create_jwt(data=jwt_payload, expires_delta=access_token_expires)

    return {
        "message": "User registered successfully",
        "username": user_in_db['username'],
        "email": user_in_db['email'],
        "company": user_in_db['company'],
        "access_token": access_token,  # Return the JWT token
        "token": new_token  # Provide the new token if necessary
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
