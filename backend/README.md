# The Price is Bot - Backend Service

FastAPI backend service providing game logic, user management, chat functionality, and Socket.IO real-time communication.

## Features

- **Game Management**: Session handling, scoring, and game state management
- **User Authentication**: JWT-based authentication with admin token support
- **Real-time Chat**: Socket.IO integration for live agent interactions
- **Elasticsearch Integration**: Async client for game data and sessions
- **CORS Configuration**: Configurable cross-origin resource sharing

## Running the Service

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables (see below)
export ELASTICSEARCH_HOST="your-elasticsearch-url"
export ELASTICSEARCH_API_KEY="your-api-key"
export SECRET_KEY="your-jwt-secret"

# Run with hot reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Docker

```bash
# Build image
docker build -t price-is-bot-backend .

# Run container
docker run -p 8080:8080 \
  -e ELASTICSEARCH_HOST="your-elasticsearch-url" \
  -e ELASTICSEARCH_API_KEY="your-api-key" \
  -e SECRET_KEY="your-jwt-secret" \
  price-is-bot-backend
```

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `ELASTICSEARCH_HOST` | Elasticsearch cluster URL | `https://cluster.es.cloud.es.io` |
| `ELASTICSEARCH_API_KEY` | Elasticsearch API key | `your_base64_api_key` |
| `SECRET_KEY` | JWT signing secret | `your_random_secret_key_here` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_TOKEN` | Admin authentication token | `""` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed origins | `"*"` |
| `PORT` | Service port | `8080` |
| `TARGET_PRICE` | Default game target price | `100.0` |
| `MAX_PODIUMS` | Maximum leaderboard positions | `5` |

### Azure OpenAI (if using)

| Variable | Description |
|----------|-------------|
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint URL |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Deployment name |
| `AZURE_OPENAI_API_VERSION` | API version |

## API Endpoints

### Health Check
- `GET /health` - Service health status

### User Management
- `POST /users/register` - Register new user
- `POST /users/login` - User authentication
- `GET /users/me` - Get current user info

### Game
- `POST /game/start` - Start new game session
- `POST /game/submit` - Submit game results
- `GET /game/session/{id}` - Get session details

### Chat
- `POST /chat/message` - Send chat message
- `GET /chat/history/{session_id}` - Get chat history

### Admin
- `POST /admin/settings` - Update game settings (requires ADMIN_TOKEN)
- `GET /admin/stats` - Get game statistics

### WebSocket
- `/socket.io` - Socket.IO endpoint for real-time communication

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app and startup
│   ├── config.py            # Configuration management
│   ├── models.py            # Pydantic models
│   ├── schemas.py           # API schemas
│   ├── routers/             # API route handlers
│   │   ├── admin.py
│   │   ├── chat.py
│   │   ├── game.py
│   │   └── users.py
│   ├── services/            # Business logic
│   │   ├── elastic_service.py
│   │   ├── llm_service.py
│   │   └── token_service.py
│   ├── utils/               # Utilities
│   │   ├── auth.py
│   │   ├── scoring.py
│   │   └── token_utils.py
│   ├── sockets.py           # Socket.IO handlers
│   └── telemetry.py         # Observability
├── Dockerfile
├── requirements.txt
└── README.md
```

## Security Notes

- Always use strong, random values for `SECRET_KEY` and `ADMIN_TOKEN`
- In production, set `CORS_ALLOWED_ORIGINS` to your specific frontend URL(s)
- Store sensitive credentials in GCP Secret Manager or similar when deploying to cloud
- The service uses JWT for authentication - tokens expire after configured period

## Deployment

See [DEPLOYMENT_GCP.md](../DEPLOYMENT_GCP.md) for GCP Cloud Run deployment instructions.

Quick deploy:
```bash
cd ..
./scripts/deploy-to-gcp.sh
```
