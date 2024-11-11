# backend/app/scripts/set_admin_password.py

import asyncio
from app.services.elastic_service import es, create_admin_user, get_user_by_username
from app.utils.auth import get_password_hash
from elasticsearch import NotFoundError
import sys

# python backend/app/scripts/set_admin_password.py admin_user your_secure_password

async def set_admin_password(username: str, password: str):
    """
    Sets or updates the admin user's password in Elasticsearch.

    :param username: Admin username.
    :param password: New admin password.
    """
    hashed_password = get_password_hash(password)
    try:
        # Check if admin user exists
        user = await get_user_by_username(username)
        if user:
            # Update the password
            await es.update(
                index="users",
                id=username,
                body={"doc": {"password": hashed_password}},
                refresh="wait_for"
            )
            print(f"Password for admin user '{username}' updated successfully.")
        else:
            # Create the admin user if it doesn't exist
            await create_admin_user(username, "admin@example.com", password)
            print(f"Admin user '{username}' created successfully with the provided password.")
    except Exception as e:
        print(f"Failed to set admin password: {e}")
        sys.exit(1)
    finally:
        await es.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python set_admin_password.py <admin_username> <admin_password>")
        sys.exit(1)
    admin_username = sys.argv[1]
    admin_password = sys.argv[2]
    asyncio.run(set_admin_password(admin_username, admin_password))
