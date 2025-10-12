import jwt
from datetime import datetime, timedelta
import os

# Configuration - Must match the backend's settings
SECRET_KEY = os.getenv("SECRET_KEY", "your_secure_secret_key")  # Replace with your actual SECRET_KEY
ALGORITHM = "HS256"

def create_admin_jwt(username: str) -> str:
    payload = {
        "sub": username,
        "email": f"{username}@example.com",  # Replace with admin's email if necessary
        "is_admin": True,
        "exp": datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

if __name__ == "__main__":
    admin_username = "admin_user"  # Replace with desired admin username
    admin_jwt = create_admin_jwt(admin_username)
    print(f"Generated Admin JWT:\n{admin_jwt}")


"""
 curl -X POST https://price-is-bot-backend-881345020217.us-central1.run.app/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_user",
    "password": "<pass>"
  }'

"""