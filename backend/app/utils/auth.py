# app/utils/auth.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.elastic_service import get_user_by_token
from app.config import ADMIN_TOKEN

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Retrieves the current user based on the provided token.

    :param credentials: HTTP authorization credentials containing the token.
    :return: User data as a dictionary.
    :raises HTTPException: If authentication fails.
    """
    token = credentials.credentials
    user = await get_user_by_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid authentication credentials",
        )
    return user

async def authenticate_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Validates that the current request is authenticated with the admin token.

    :param credentials: HTTP authorization credentials containing the token.
    :return: Admin user data if authenticated.
    :raises HTTPException: If authentication fails.
    """
    token = credentials.credentials
    if token != ADMIN_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have admin privileges",
        )
    return {"username": "admin", "is_admin": True}
