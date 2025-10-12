# add_admin_token.py

import asyncio
from app.services.elastic_service import es, connect_elasticsearch, initialize_indices
from datetime import datetime
import logging

# Configure logger
logger = logging.getLogger("add_admin_token")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter(
    "%(asctime)s - %(levelname)s - %(message)s"
)
handler.setFormatter(formatter)
logger.addHandler(handler)

async def add_admin_token(token: str, username: str):
    await connect_elasticsearch()
    await initialize_indices()  # Ensure the 'tokens' index exists

    token_doc = {
        "token": token,
        "active": True,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "username": username
    }

    try:
        response = await es.index(index="tokens", id=token, document=token_doc, refresh='wait_for')
        logger.info(f"Successfully added token to 'tokens' index: {response['result']}")
    except Exception as e:
        logger.error(f"Failed to add token: {e}")
    finally:
        await es.close()

if __name__ == "__main__":
    admin_token = "<admin_token_from_users_index>"  # Your admin token
    admin_username = "admin_user"  # Your admin username
    asyncio.run(add_admin_token(admin_token, admin_username))
