# app/routers/chat.py

import logging
from app.utils.auth import decode_jwt  # Import only decode_jwt

from app.sockets import sio  # Import sio from sockets.py
from urllib.parse import parse_qs
from app.services.llm_service import handle_llm_interaction  # Import the LLM interaction function

# Configure logger
logger = logging.getLogger("chat")
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
formatter = logging.Formatter(
    "%(asctime)s - %(levelname)s - %(filename)s - %(funcName)s - line %(lineno)d - %(message)s"
)
handler.setFormatter(formatter)
logger.addHandler(handler)

# Define an in-memory mapping of session IDs to user data
connected_users = {}

@sio.event
async def connect(sid, environ):
    query_string = environ.get('QUERY_STRING', '')
    params = parse_qs(query_string)
    token = params.get('token', [None])[0]
    logger.debug(f"Socket.IO connection attempt with token: {token}")
    if token:
        try:
            payload = decode_jwt(token)
            username = payload.get('sub')
            if not username:
                logger.warning("Invalid token: no username found.")
                await sio.disconnect(sid)
                return

            from app.services.elastic_service import get_user_by_username  # Deferred import to prevent circular import
            user = await get_user_by_username(username)
            if user:
                connected_users[sid] = user
                logger.info(f"Socket.IO connection accepted for user: {user['username']}")
                await sio.emit('message', {'content': 'Welcome to the chat!'}, room=sid)
            else:
                logger.warning(f"User not found: {username}")
                await sio.disconnect(sid)
        except Exception as e:
            logger.error(f"Error decoding token: {e}")
            await sio.disconnect(sid)
    else:
        logger.warning("No token provided. Rejecting connection.")
        await sio.disconnect(sid)

@sio.event
async def disconnect(sid):
    user = connected_users.pop(sid, None)
    username = user['username'] if user else 'Unknown'
    logger.info(f"Socket.IO connection disconnected for user: {username}")

@sio.on('message')
async def handle_message(sid, data):
    user = connected_users.get(sid)
    if user:
        username = user['username']
        logger.debug(f"Received message from {username}: {data}")
        user_message = data.get('content', '')
        if user_message:
            # Forward the message to the LLM service
            llm_response = await handle_llm_interaction(username, user_message)
            # Emit the LLM's response back to the client
            await sio.emit('message', {'content': llm_response}, room=sid)
            logger.debug(f"Sent LLM response to {username}: {llm_response}")
        else:
            logger.warning(f"Received empty message from user: {username}")
    else:
        logger.warning(f"No user found for sid: {sid}")
        await sio.disconnect(sid)
