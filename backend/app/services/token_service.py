# backend/app/services/token_service.py

import uuid
from typing import List
from datetime import datetime
from app.services.elastic_service import es
from elasticsearch import NotFoundError
from typing import List, Dict, Optional
import logging

logger = logging.getLogger("token_service")

async def generate_and_store_tokens(count: int) -> List[str]:
    tokens = []
    for _ in range(count):
        token = str(uuid.uuid4())
        token_doc = {
            "token": token,
            "active": True,
            "created_at": datetime.utcnow(),
            # No username associated initially
        }
        # Store the token in the 'tokens' index
        await es.index(index="tokens", id=token, document=token_doc)
        tokens.append(token)
        logger.info(f"Generated and stored token: {token}")
    return tokens

async def deactivate_token(token: str) -> bool:
    try:
        response = await es.update(
            index="tokens",
            id=token,
            body={
                "doc": {
                    "active": False
                }
            },
            refresh=True
        )
        logger.info(f"Token '{token}' has been deactivated.")
        return True
    except NotFoundError:
        logger.warning(f"Token '{token}' not found.")
        return False
    except Exception as e:
        logger.error(f"Error deactivating token '{token}': {e}")
        return False

async def list_tokens(status: Optional[str] = None) -> List[dict]:
    try:
        query_body = {
            "query": {
                "match_all": {}
            },
            "size": 1000  # Adjust as needed
        }

        if status == "active":
            query_body["query"] = {
                "term": {
                    "active": True
                }
            }
        elif status == "inactive":
            query_body["query"] = {
                "term": {
                    "active": False
                }
            }

        response = await es.search(
            index="tokens",
            body=query_body
        )

        tokens = []
        for hit in response['hits']['hits']:
            token_doc = hit['_source']
            token_doc['token'] = hit['_id']
            tokens.append(token_doc)
        return tokens
    except Exception as e:
        logger.error(f"Error listing tokens: {e}")
        return []
