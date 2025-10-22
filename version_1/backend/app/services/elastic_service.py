# backend/app/services/elastic_service.py

from elasticsearch import AsyncElasticsearch, NotFoundError, RequestError, ConflictError
from app.config import ELASTICSEARCH_HOST, ELASTICSEARCH_API_KEY
import logging
from typing import Optional, Dict, List
from fastapi import HTTPException
import uuid
from datetime import datetime

# Configure logger
logger = logging.getLogger("elastic_service")
logger.setLevel(logging.DEBUG)  # Set to DEBUG for detailed logs
handler = logging.StreamHandler()
formatter = logging.Formatter(
    "%(asctime)s - %(levelname)s - %(filename)s - %(funcName)s - line %(lineno)d - %(message)s"
)
handler.setFormatter(formatter)
logger.addHandler(handler)

import elastic_transport

# Use `elastic_transport.debug_logging()` before the request
elastic_transport.debug_logging()

# Initialize Elasticsearch client
es = AsyncElasticsearch(
    hosts=[ELASTICSEARCH_HOST],
    api_key=ELASTICSEARCH_API_KEY,
    verify_certs=True
)

async def connect_elasticsearch():
    try:
        info = await es.info()
        logger.info(f"Connected to Elasticsearch: {info}")
    except Exception as e:
        logger.error(f"Failed to connect to Elasticsearch: {e}")
        raise e

async def initialize_indices():
    """
    Initializes the necessary Elasticsearch indices with appropriate mappings.
    """
    indices = {
        "users": {
            "mappings": {
                "properties": {
                    "username": {"type": "keyword"},
                    "email": {"type": "keyword"},
                    "company": {"type": "keyword"},
                    "is_admin": {"type": "boolean"},
                    "active": {"type": "boolean"},  # Tracks user activity
                }
            }
        },
        "game_results": {
            "mappings": {
                "properties": {
                    "username": {"type": "keyword"},
                    "total_price": {"type": "double"},
                    "items": {
                        "type": "nested",
                        "properties": {
                            "podium": {"type": "integer"},
                            "item_name": {"type": "text"},
                            "item_price": {"type": "double"},
                            "quantity": {"type": "integer"}
                        }
                    },
                    "time_taken": {"type": "double"},
                    "price_difference": {"type": "double"},
                    "target_price": {"type": "double"},
                    "score": {"type": "double"},
                    "timestamp": {"type": "date"}
                }
            }
        },
        "game_settings": {
            "mappings": {
                "properties": {
                    "target_price": {"type": "double"},
                    "time_limit": {"type": "integer"},
                    "max_podiums": {"type": "integer"}  # Added to align with frontend
                }
            }
        },
        "grocery_items": {  # Existing grocery_items index
            "mappings": {
                "_meta": {
                    "created_by": "file-data-visualizer"
                },
                "properties": {
                    "Currency": {
                        "type": "keyword"
                    },
                    "Discount": {
                        "type": "keyword"
                    },
                    "Feature": {
                        "type": "text"
                    },
                    "Price": {
                        "type": "keyword"
                    },
                    "Product Description": {
                        "type": "text"
                    },
                    "Product Description_semantic": {
                        "type": "semantic_text",
                        "inference_id": "elser-endpoint",
                        "model_settings": {
                            "task_type": "sparse_embedding"
                        }
                    },
                    "Rating": {
                        "type": "text"
                    },
                    "Sub Category": {  # Ensure correct field name
                        "type": "keyword"
                    },
                    "Title": {
                        "type": "text",
                        "fields": {
                            "keyword": {
                                "type": "keyword"
                            }
                        }
                    },
                    "Title_semantic": {
                        "type": "semantic_text",
                        "inference_id": "elser-endpoint",
                        "model_settings": {
                            "task_type": "sparse_embedding"
                        }
                    }
                }
            }
        },
        "tokens": {  # Integrated tokens index
            "mappings": {
                "properties": {
                    "token": {"type": "keyword"},
                    "active": {"type": "boolean"},
                    "created_at": {"type": "date"},
                    "username": {"type": "keyword"}  # Optional: associate token with username upon registration
                }
            }
        }
    }

    for index, body in indices.items():
        try:
            exists = await es.indices.exists(index=index)
            if not exists:
                await es.indices.create(index=index, body=body)
                logger.info(f"Created index: {index}")
            else:
                logger.info(f"Index already exists: {index}")
        except RequestError as e:
            logger.error(f"Error creating index {index}: {e}")

async def get_user_by_username(username: str) -> Optional[dict]:
    """
    Retrieves a user from Elasticsearch based on the provided username.

    :param username: The username of the user.
    :return: User data as a dictionary or None if not found.
    """
    try:
        response = await es.get(index="users", id=username)
        logger.debug(f"User found for username {username}: {response['_source']}")
        return response["_source"]
    except NotFoundError:
        logger.warning(f"No user found for username: {username}")
        return None
    except Exception as e:
        logger.error(f"Error retrieving user by username: {e}")
        return None

async def validate_and_deactivate_token(token: str) -> bool:
    """
    Validates a token by checking its existence and active status in the 'tokens' index.
    Deactivates the token upon successful validation.

    :param token: The authentication token.
    :return: True if token is valid and deactivated, False otherwise.
    """
    try:
        # Debug log: log the token being queried
        logger.debug(f"Querying token: {token}")

        # Query Elasticsearch for the token in 'tokens' index
        response = await es.search(
            index="tokens",
            body={
                "query": {
                    "term": {
                        "token": token
                    }
                }
            }
        )

        # Debug log: log the response
        logger.debug(f"Elasticsearch response for token: {response}")

        # Check if the token exists
        hits = response['hits']['hits']
        if not hits:
            logger.warning(f"Token not found: {token}")
            return False

        # Validate and deactivate
        token_doc = hits[0]
        if not token_doc["_source"].get("active", False):
            logger.warning(f"Token already used or inactive: {token}")
            return False

        # Deactivate the token without associating with any username
        await es.update(
            index="tokens",
            id=token_doc["_id"],
            body={"doc": {"active": False}},
            refresh="wait_for"
        )
        logger.info(f"Token validated and deactivated: {token}")

        return True
    except Exception as e:
        logger.error(f"Error validating token {token}: {e}")
        return False

async def generate_and_store_tokens(count: int) -> List[str]:
    """
    Generates a specified number of unique tokens and stores them in the 'tokens' index.

    :param count: Number of tokens to generate.
    :return: List of generated tokens.
    """
    tokens = []
    for _ in range(count):
        token = str(uuid.uuid4())
        token_doc = {
            "token": token,
            "active": True,
            "created_at": datetime.utcnow()
            # No username associated initially
        }
        # Store the token in the 'tokens' index
        try:
            await es.index(index="tokens", id=token, document=token_doc, refresh='wait_for')
            tokens.append(token)
            logger.info(f"Generated and stored token: {token}")
        except Exception as e:
            logger.error(f"Failed to store token '{token}': {e}")
            raise HTTPException(status_code=500, detail="Failed to generate tokens.")
    return tokens

async def deactivate_token(token: str) -> bool:
    """
    Deactivates a specific token in the 'tokens' index.

    :param token: The token to deactivate.
    :return: True if deactivation was successful, False otherwise.
    """
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
    """
    Lists tokens based on their status (active/inactive).

    :param status: Filter tokens by 'active' or 'inactive'. If None, returns all tokens.
    :return: List of token documents.
    """
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

async def store_game_result(game_result: dict) -> None:
    """
    Stores a game result into the 'game_results' Elasticsearch index.

    :param game_result: A dictionary containing game result data.
    """
    try:
        await es.index(index="game_results", document=game_result)
        logger.info(f"Stored game result for user: {game_result.get('username')}")
    except Exception as e:
        logger.error(f"Failed to store game result: {e}")
        raise

async def store_user(user: dict) -> None:
    """
    Stores a new user into the 'users' Elasticsearch index.

    :param user: A dictionary containing user data.
    """
    try:
        await es.index(index="users", id=user['username'], document=user, refresh='wait_for')  # Force refresh
        logger.info(f"Stored user: {user['username']}")
    except ConflictError:
        logger.warning(f"User {user['username']} already exists.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists.")
    except Exception as e:
        logger.error(f"Failed to store user {user['username']}: {e}")
        raise

async def get_top_scores() -> list:
    """
    Retrieves the top 10 game scores from the 'game_results' Elasticsearch index.
    :return: A list of top game results.
    """
    try:
        response = await es.search(
            index="game_results",
            body={
                "size": 10,
                "sort": [
                    {"score": {"order": "desc"}}
                ]
            }
        )
        hits = response['hits']['hits']
        top_scores = [hit['_source'] for hit in hits]
        logger.debug(f"Retrieved top scores: {top_scores}")
        return top_scores
    except NotFoundError:
        logger.warning("No game results found.")
        return []
    except Exception as e:
        logger.error(f"Error retrieving top scores: {e}")
        return []

async def get_settings() -> Optional[Dict]:
    """
    Retrieves game settings from the 'game_settings' Elasticsearch index.

    :return: Game settings as a dictionary or None if not found.
    """
    try:
        response = await es.get(index="game_settings", id="default")
        logger.debug(f"Game settings found: {response['_source']}")
        return response["_source"]
    except NotFoundError:
        logger.warning("No game settings found.")
        return None
    except Exception as e:
        logger.error(f"Error retrieving game settings: {e}")
        return None

async def update_settings(settings: dict) -> None:
    """
    Updates or creates game settings in the 'game_settings' Elasticsearch index.

    :param settings: A dictionary containing game settings.
    """
    try:
        await es.index(index="game_settings", id="default", document=settings)
        logger.info("Game settings updated successfully.")
    except Exception as e:
        logger.error(f"Failed to update game settings: {e}")
        raise

async def get_all_categories() -> list:
    """
    Fetches all unique grocery item sub-categories from Elasticsearch using a terms aggregation.

    :return: A list of sub-category names.
    """
    try:
        response = await es.search(
            index="grocery_items",
            body={
                "size": 0,  # No need to return documents
                "aggs": {
                    "categories": {
                        "terms": {
                            "field": "Sub Category",  # Correct field name
                            "size": 100  # Adjust the size based on expected number of categories
                        }
                    }
                }
            }
        )
        buckets = response['aggregations']['categories']['buckets']
        categories = [bucket['key'] for bucket in buckets]
        logger.debug(f"Retrieved sub-categories: {categories}")
        return categories
    except Exception as e:
        logger.error(f"Error fetching sub-categories: {e}")
        return []

async def create_admin_user(username: str, email: str, password: str) -> None:
    """
    Creates an admin user in the 'users' index if it doesn't exist.

    :param username: Admin username.
    :param email: Admin email.
    :param password: Admin password (will be hashed).
    """
    from app.utils.auth import get_password_hash  # Deferred import to prevent circular import
    try:
        existing_user = await get_user_by_username(username)
        if existing_user:
            logger.info(f"Admin user '{username}' already exists.")
            return
        user_doc = {
            "username": username,
            "email": email,
            "company": "The Price is Bot",
            "is_admin": True,
            "active": True,
            "password": get_password_hash(password)  # Store hashed password
        }
        await es.index(index="users", id=username, document=user_doc, refresh='wait_for')
        logger.info(f"Admin user '{username}' created successfully.")
    except Exception as e:
        logger.error(f"Failed to create admin user '{username}': {e}")
        raise
