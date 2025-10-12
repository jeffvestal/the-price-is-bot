# backend/app/utils/auth.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import SECRET_KEY
import jwt
from jwt import PyJWTError
from datetime import datetime, timedelta
import logging
from passlib.context import CryptContext

# Configure logger
logger = logging.getLogger("auth")
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

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


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


def verify_password(plain_password, hashed_password):
    """
    Verifies a plain password against a hashed password.

    :param plain_password: The plain text password.
    :param hashed_password: The hashed password.
    :return: True if match, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    """
    Hashes a password.

    :param password: The plain text password.
    :return: The hashed password.
    """
    return pwd_context.hash(password)


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
        logger.error("Failed to decode JWT")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Retrieves the current user based on the provided JWT.

    :param credentials: HTTP authorization credentials containing the JWT.
    :return: User data as a dictionary.
    :raises HTTPException: If authentication fails.
    """
    token = credentials.credentials
    payload = decode_jwt(token)
    logger.debug(f"Decoded JWT payload: {payload}")

    username: str = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid authentication credentials",
        )

    from app.services.elastic_service import get_user_by_username  # Deferred import to prevent circular import
    user = await get_user_by_username(username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not found",
        )
    return user


async def authenticate_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> bool:
    """
    Validates the JWT and ensures the user has admin privileges.

    :param credentials: HTTP authorization credentials containing the JWT.
    :return: True if authentication is successful and user is admin.
    :raises HTTPException: If authentication fails or user lacks admin privileges.
    """
    token = credentials.credentials
    logger.debug(f"Received admin token: '{token}'")
    try:
        payload = decode_jwt(token)
        logger.debug(f"Decoded JWT payload for admin: {payload}")
        is_admin = payload.get("is_admin", False)
        if not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have admin privileges",
            )
        return True  # Return True to indicate successful authentication
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )


async def authenticate_admin_with_password(username: str, password: str) -> str:
    """
    Authenticates an admin user using username and password.

    :param username: Admin username.
    :param password: Admin password.
    :return: JWT access token.
    :raises HTTPException: If authentication fails.
    """
    from app.services.elastic_service import get_user_by_username  # Deferred import to prevent circular import
    user = await get_user_by_username(username)
    if not user:
        logger.warning(f"Admin user '{username}' not found.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid username or password",
        )
    if not user.get("is_admin", False):
        logger.warning(f"User '{username}' is not an admin.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have admin privileges",
        )
    if not verify_password(password, user.get("password", "")):
        logger.warning(f"Incorrect password for admin user '{username}'.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid username or password",
        )

    # Generate JWT
    jwt_payload = {
        "sub": user["username"],
        "email": user["email"],
        "is_admin": user.get("is_admin", False)
    }
    access_token_expires = timedelta(minutes=60)  # 1 hour expiration
    access_token = create_jwt(data=jwt_payload, expires_delta=access_token_expires)
    return access_token
