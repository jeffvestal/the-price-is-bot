# app/services/elastic_service.py

from elasticsearch import AsyncElasticsearch, NotFoundError, RequestError
from app.config import ELASTICSEARCH_HOST, ELASTICSEARCH_API_KEY
import logging
from typing import Optional, Dict

# Configure logger
logger = logging.getLogger("elastic_service")
logger.setLevel(logging.DEBUG)  # Set to DEBUG for detailed logs
handler = logging.StreamHandler()
formatter = logging.Formatter(
    "%(asctime)s - %(levelname)s - %(filename)s - %(funcName)s - line %(lineno)d - %(message)s"
)
handler.setFormatter(formatter)
logger.addHandler(handler)

# Initialize Elasticsearch client
es = AsyncElasticsearch(
    hosts=[ELASTICSEARCH_HOST],
    api_key=ELASTICSEARCH_API_KEY,
    verify_certs=True
)


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
                    "token": {"type": "keyword"}
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
                    "time_limit": {"type": "integer"}
                }
            }
        },
        "grocery_items": {  # Added grocery_items index
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


async def get_user_by_token(token: str) -> Optional[dict]:
    """
    Retrieves a user from Elasticsearch based on the provided token.

    :param token: The authentication token.
    :return: User data as a dictionary or None if not found.
    """
    try:
        response = await es.search(
            index="users",
            body={
                "query": {
                    "term": {
                        "token": token
                    }
                }
            }
        )
        hits = response['hits']['hits']
        if hits:
            user = hits[0]['_source']
            logger.debug(f"User found for token {token}: {user}")
            return user
        else:
            logger.warning(f"No user found for token: {token}")
            return None
    except Exception as e:
        logger.error(f"Error retrieving user by token: {e}")
        return None


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
        await es.index(index="users", id=user['username'], document=user)
        logger.info(f"Stored user: {user['username']}")
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
