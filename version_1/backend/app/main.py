# backend/app/main.py

from fastapi import FastAPI, Request
from app.routers import users, game, admin, chat  # Ensure 'chat' is included correctly
from app.telemetry import setup_telemetry
from app.services.elastic_service import (
    get_settings,
    update_settings,
    initialize_indices,
    get_all_categories,
    connect_elasticsearch,
    create_admin_user
)
from app.services.llm_service import set_categories
import logging
from starlette.middleware.cors import CORSMiddleware
from app.sockets import sio
import socketio
import uvicorn
import os

# Configure root logger
logging.basicConfig(
    level=logging.DEBUG,  # Set to DEBUG for detailed logs
    format="%(asctime)s - %(levelname)s - %(filename)s - %(funcName)s - line %(lineno)d - %(message)s",
)

# Initialize the FastAPI app
app = FastAPI(
    title="The Price is BOT",
    description="API for the Price is BOT Game",
    version="0.1.0",
    docs_url="/docs",      # Swagger UI
    redoc_url="/redoc",    # ReDoc
    openapi_url="/openapi.json"
)

# Include FastAPI routers
app.include_router(users.router)
app.include_router(game.router)
app.include_router(admin.router)
# Note: 'chat' is handled via Socket.IO and mounted separately

# Initialize indices and settings on startup
@app.on_event("startup")
async def startup_event():
    logger = logging.getLogger("startup")
    logger.info("Connecting to Elasticsearch...")
    await connect_elasticsearch()  # Establish connection to Elasticsearch
    logger.info("Elasticsearch connected.")

    logger.info("Initializing Elasticsearch indices...")
    await initialize_indices()
    logger.info("Elasticsearch indices initialized.")

    # Create admin user if not exists
    admin_username = "admin_user"
    admin_email = "admin@example.com"
    admin_password = "admin_secure_password"  # Replace with a secure password
    await create_admin_user(admin_username, admin_email, admin_password)

    # Get or create default settings
    settings = await get_settings()
    if not settings:
        default_settings = {
            "target_price": 100.0,
            "time_limit": 300,  # 5 minutes
            "max_podiums": 5
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

# Mount the Socket.IO app at the specified path
app.mount("/socket.io", socketio_app)

@app.on_event("shutdown")
async def shutdown_event():
    from app.services.elastic_service import es  # Import the Elasticsearch client
    logger = logging.getLogger("shutdown")
    logger.info("Closing Elasticsearch connection...")
    await es.close()
    logger.info("Elasticsearch connection closed.")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))  # Default to 8000 if PORT is not set
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
