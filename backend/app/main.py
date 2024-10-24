# app/main.py

from fastapi import FastAPI, Request
from app.routers import users, game, admin, chat  # Ensure 'chat' is included correctly
from app.telemetry import setup_telemetry
from app.services.elastic_service import (
    get_settings,
    update_settings,
    initialize_indices,
    get_all_categories
)
from app.services.llm_service import set_categories
import logging
from starlette.middleware.cors import CORSMiddleware
from app.sockets import sio
import socketio

# Configure root logger
logging.basicConfig(
    level=logging.DEBUG,  # Set to DEBUG for detailed logs
    format="%(asctime)s - %(levelname)s - %(filename)s - %(funcName)s - line %(lineno)d - %(message)s",
)

# Initialize the FastAPI app
app = FastAPI()

# Include FastAPI routers
app.include_router(users.router)
app.include_router(game.router)
app.include_router(admin.router)
# Note: 'chat' is handled via Socket.IO and mounted separately

# Initialize indices and settings on startup
@app.on_event("startup")
async def startup_event():
    logger = logging.getLogger("startup")
    logger.info("Initializing Elasticsearch indices...")
    await initialize_indices()
    logger.info("Elasticsearch indices initialized.")

    # Get or create default settings
    settings = await get_settings()
    if not settings:
        default_settings = {
            "target_price": 100.0,
            "time_limit": 300,  # 5 minutes
        }
        await update_settings(default_settings)
        logger.info("Default game settings created.")
    else:
        logger.info("Game settings loaded.")

    # Fetch all categories from Elasticsearch
    categories = await get_all_categories()
    if categories:
        set_categories(categories)
        logger.info(f"Categories set for LLM: {categories}")
    else:
        logger.warning("No categories found in Elasticsearch. LLM will have limited guidance.")

# Set up CORS middleware for FastAPI app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    body = await request.body()
    logging.debug(f"Incoming request: {request.method} {request.url} Body: {body.decode('utf-8')}")
    response = await call_next(request)
    logging.debug(f"Response status: {response.status_code}")
    return response

# Create the Socket.IO ASGI app
socketio_app = socketio.ASGIApp(sio, socketio_path='/socket.io')

# Mount the Socket.IO app at the root
app.mount("/", socketio_app)
