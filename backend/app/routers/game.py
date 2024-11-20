# app/routers/game.py

from fastapi import APIRouter, HTTPException, Depends, status
from app.services.elastic_service import store_game_result, get_top_scores, get_settings
from app.models import GameResult, LeaderboardEntry
from app.utils.auth import get_current_user
import datetime
import logging
from app.config import MAX_PODIUMS, TARGET_PRICE  # Import configurable variables

router = APIRouter(prefix="/game", tags=["game"])

# Configure logger
logger = logging.getLogger("game_router")
logger.setLevel(logging.DEBUG)  # Set to DEBUG for detailed logs
handler = logging.StreamHandler()
formatter = logging.Formatter(
    "%(asctime)s - %(levelname)s - %(filename)s - %(funcName)s - line %(lineno)d - %(message)s"
)

handler.setFormatter(formatter)
logger.addHandler(handler)


@router.get("/settings")
async def get_game_settings():
    settings = await get_settings()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    return settings


@router.post("/submit")
async def submit_game_result(game_result: GameResult, user: dict = Depends(get_current_user)):
    """
    Submits a game result for the authenticated user.

    :param game_result: The game result data.
    :param user: The authenticated user.
    :return: The calculated score.
    """
    logger.debug(f"Received game result from user: {user['username']}")
    try:
        # Convert Pydantic model to dict
        game_result_dict = game_result.dict()
        # Add username from user context
        game_result_dict['username'] = user['username']
        # Add timestamp
        game_result_dict['timestamp'] = datetime.datetime.utcnow()
        # Retrieve settings
        settings = await get_settings()
        if not settings:
            logger.warning("Game settings not found. Using default values.")
            target_price = TARGET_PRICE  # Default value from config
            max_podiums = MAX_PODIUMS
        else:
            target_price = settings.get('target_price', TARGET_PRICE)
            max_podiums = settings.get('max_podiums', MAX_PODIUMS)

        # **Validation: Ensure time_taken is positive and realistic**
        if game_result_dict['time_taken'] <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid time_taken value.")

        # **Validation: Ensure total_price is non-negative**
        if game_result_dict['total_price'] < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid total_price value.")

        # **Validation: Ensure number of items is exactly max_podiums**
        if len(game_result_dict['items']) != max_podiums:
            game_result_dict['score'] = 0.0  # Assign score 0 for incorrect number of podiums
            logger.info(f"User '{user['username']}' exceeded podium limits. Marked as failed.")
            # raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exceeded maximum number of shopping bags.")
        # **Additional Validation: Check if total_price exceeds target_price**
        elif game_result_dict['total_price'] > target_price:
            game_result_dict['score'] = 0.0  # Assign score 0 for failed submissions
            logger.info(f"User '{user['username']}' exceeded price limits. Marked as failed.")
        else:
            # Calculate score using the scoring utility
            game_result_dict['price_difference'] = abs(target_price - game_result_dict['total_price'])
            game_result_dict['target_price'] = target_price
            game_result_dict['score'] = calculate_score(
                target_price=target_price,
                player_total_price=game_result_dict['total_price'],
                time_limit=settings.get('time_limit', 300),
                time_taken=game_result_dict['time_taken']
            )
            logger.debug(f"Calculated score: {game_result_dict['score']}")

        # Store the game result in Elasticsearch
        await store_game_result(game_result_dict)
        logger.info(f"Game result stored for user: {user['username']} with score: {game_result_dict['score']}")
        return {"score": game_result_dict['score']}
    except HTTPException as he:
        logger.error(f"Validation error for user {user['username']}: {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"Failed to submit game result for user {user['username']}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to submit game result")



def calculate_score(target_price: float, player_total_price: float, time_limit: int, time_taken: float) -> float:
    """
    Calculates the score based on the game result and target price.

    :param target_price: The target price from settings.
    :param player_total_price: The total price achieved by the player.
    :param time_limit: The time limit for the game.
    :param time_taken: The time taken by the player.
    :return: Calculated score.
    """
    # Closeness Score
    if player_total_price <= target_price:
        closeness_score = (1 - (target_price - player_total_price) / target_price) * 70
    else:
        closeness_score = 0

    # Time Score
    if time_taken <= time_limit:
        time_score = (1 - (time_taken / time_limit)) * 30
    else:
        time_score = 0

    total_score = closeness_score + time_score
    return round(total_score, 2)


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def get_leaderboard():
    """
    Retrieves the top 10 game scores from the 'game_results' Elasticsearch index.

    :return: A list of top game results.
    """
    logger.debug("Retrieving top scores for leaderboard.")
    top_scores = await get_top_scores()
    return top_scores
