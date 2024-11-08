# decode_jwt.py

import jwt
from datetime import datetime
import os

# Configuration - Must match the backend's settings
SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")  # Replace with your actual SECRET_KEY
ALGORITHM = "HS256"

def decode_jwt(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print("Decoded JWT Payload:")
        print(payload)
        # Convert 'exp' from timestamp to readable format
        exp = payload.get("exp")
        if exp:
            exp_readable = datetime.utcfromtimestamp(exp).strftime('%Y-%m-%d %H:%M:%S')
            print(f"Token expires at: {exp_readable} UTC")
    except jwt.ExpiredSignatureError:
        print("Error: Token has expired.")
    except jwt.InvalidTokenError as e:
        print(f"Error: Invalid token. Details: {str(e)}")

if __name__ == "__main__":
    ADMIN_JWT = os.getenv("ADMIN_JWT", "your_admin_jwt_here")  # Replace with your generated ADMIN_JWT
    decode_jwt(ADMIN_JWT)
