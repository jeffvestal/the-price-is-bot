# app/utils/auth.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.elastic_service import get_user_by_token, get_user_by_username
from app.config import ADMIN_TOKEN, SECRET_KEY
import jwt
from jwt import PyJWTError
from datetime import datetime, timedelta
import os
import logging

# Configure logger
logger = logging.getLogger("elastic_service")
logger.setLevel(logging.DEBUG)  # Set to DEBUG for detailed logs
handler = logging.StreamHandler()
formatter = logging.Formatter(
    "%(asctime)s - %(levelname)s - %(filename)s - %(funcName)s - line %(lineno)d - %(message)s"
)
handler.setFormatter(formatter)
logger.addHandler(handler)

security = HTTPBearer()

# JWT Configuration
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour

ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "your_admin_token_here")
logger.info(f"Admin Token is set to: {ADMIN_TOKEN}")


def create_jwt(*, data: dict, expires_delta: timedelta = None):
    """
    Creates a JWT token.

    :param data: A dictionary containing user data.
    :param expires_delta: Token expiration time.
    :return: Encoded JWT as a string.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Retrieves the current user based on the provided JWT.

    :param credentials: HTTP authorization credentials containing the JWT.
    :return: User data as a dictionary.
    :raises HTTPException: If authentication fails.
    """
    token = credentials.credentials
    payload = decode_jwt(token)
    username: str = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid authentication credentials",
        )
    user = await get_user_by_username(username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not found",
        )
    return user


def decode_jwt(token: str):
    """
    Decodes and verifies a JWT token.

    :param token: The JWT token to decode.
    :return: The decoded payload.
    :raises HTTPException: If token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )


async def authenticate_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> bool:
    """
    Validates the JWT and ensures the user has admin privileges.

    :param credentials: HTTP authorization credentials containing the JWT.
    :return: True if authentication is successful and user is admin.
    :raises HTTPException: If authentication fails or user lacks admin privileges.
    """
    token = credentials.credentials
    try:
        payload = decode_jwt(token)
        is_admin = payload.get("is_admin", False)
        if not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have admin privileges",
            )
        # Retrieve username from 'sub' claim
        username = payload.get("sub")
        if not username:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid token payload",
            )
        # Fetch user from Elasticsearch
        user = await get_user_by_username(username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User not found",
            )
        if not user.get("active", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User token is inactive",
            )
        return True  # Return True to indicate successful authentication
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )


