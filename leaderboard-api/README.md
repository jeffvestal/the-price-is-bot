# The Price is Bot - Leaderboard API

Standalone FastAPI service for managing access codes, game sessions, scoring, and leaderboards. This service handles admin operations and provides public endpoints for game results.

## Features

- **Access Code Management**: Generate and validate access codes for game access
- **Session Management**: Track player sessions and game state
- **Leaderboard**: Real-time scoring and ranking system
- **Admin Settings**: Configure game parameters (target price, duration, etc.)
- **Async Elasticsearch**: High-performance async client for data persistence

## Running the Service

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables (see below)
export ELASTICSEARCH_URL="your-elasticsearch-url"
export ELASTICSEARCH_API_KEY="your-api-key"
export ADMIN_TOKEN="your-admin-token"

# Run with hot reload
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

### Docker

```bash
# Build image
docker build -t price-is-bot-leaderboard-api .

# Run container
docker run -p 8080:8080 \
  -e ELASTICSEARCH_URL="your-elasticsearch-url" \
  -e ELASTICSEARCH_API_KEY="your-api-key" \
  -e ADMIN_TOKEN="your-admin-token" \
  price-is-bot-leaderboard-api
```

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `ELASTICSEARCH_URL` | Elasticsearch cluster URL | `https://cluster.es.cloud.es.io` |
| `ELASTICSEARCH_API_KEY` | Elasticsearch API key | `your_base64_api_key` |
| `ADMIN_TOKEN` | Admin bearer token for protected endpoints | `your_secure_admin_token` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | `8080` |

## API Endpoints

### Public Endpoints

#### Health Check
- `GET /health` - Service health status
- Response: `{"status": "healthy", "timestamp": "..."}`

#### Access Codes
- `POST /api/validate-code` - Validate an access code and create session
  ```json
  {
    "access_code": "DEMO01",
    "player_name": "John Doe",
    "player_email": "john@example.com",
    "company": "Acme Corp"
  }
  ```

#### Game Settings
- `GET /api/settings` - Get current game settings
  ```json
  {
    "target_price": 100.0,
    "game_duration": 300,
    "max_items": 20
  }
  ```

#### Leaderboard
- `GET /api/leaderboard?limit=10&date=2024-10-22` - Get leaderboard entries
  - Query params: `limit` (default: 10), `date` (optional, format: YYYY-MM-DD)
  
#### Submit Game
- `POST /api/submit-game` - Submit completed game for scoring
  ```json
  {
    "session_id": "session_123",
    "player_name": "John Doe",
    "player_email": "john@example.com",
    "company": "Acme Corp",
    "total_price": 98.50,
    "target_price": 100.0,
    "items": [...],
    "time_used": 245,
    "agent_used": "budget_master"
  }
  ```

### Admin Endpoints (Require Authorization)

All admin endpoints require `Authorization: Bearer YOUR_ADMIN_TOKEN` header.

#### Generate Access Codes
- `POST /admin/generate-codes` - Generate new access codes
  ```json
  {
    "count": 10,
    "batch_name": "conference-2024",
    "expires_at": "2024-12-31T23:59:59Z"
  }
  ```

#### Update Settings
- `POST /admin/settings` - Update game settings
  ```json
  {
    "target_price": 100.0,
    "game_duration": 300,
    "max_items": 20
  }
  ```

#### Roll Leaderboard
- `POST /admin/roll-leaderboard` - Create new leaderboard for the day
  - Archives current leaderboard and starts fresh

## Elasticsearch Indices

The service creates and manages the following indices:

- `tpb_access_codes` - Access code records
- `tpb_game_sessions` - Player game sessions
- `tpb_leaderboard_YYYYMMDD` - Daily leaderboard entries
- `tpb_admin_settings` - Game configuration

## Authentication

### Admin Endpoints

Admin endpoints use Bearer token authentication:

```bash
curl -X POST https://api.example.com/admin/generate-codes \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"count": 10, "batch_name": "test"}'
```

The `ADMIN_TOKEN` environment variable must match the Bearer token provided in requests.

## Scoring Logic

Games are scored based on:

1. **Bag Count**: Must have exactly 5 unique items (bags) - otherwise score = 0
2. **Budget Compliance**: Must not exceed $100 - otherwise score = 0
3. **Max Items per Bag**: Max 5 of same item - otherwise score = 0
4. **Base Score**: `100 - |target_price - total_price|`
5. **Budget Bonus**: +5 points for staying under budget
6. **Time Bonus**: Up to +10 points for games under 2 minutes

Final score = Base + Budget Bonus + Time Bonus

Invalid games (violating rules 1-3) receive a score of 0.

## Security Notes

- Always use a strong, random `ADMIN_TOKEN` in production
- Store credentials in GCP Secret Manager or similar when deploying
- Admin endpoints validate bearer tokens against the configured `ADMIN_TOKEN`
- Access codes can be set to expire at specific dates
- CORS is configured to allow requests from any origin (customize as needed)

## Deployment

See [DEPLOYMENT_GCP.md](../DEPLOYMENT_GCP.md) for GCP Cloud Run deployment instructions.

Quick deploy:
```bash
cd ..
./scripts/deploy-to-gcp.sh
```

## Development & Testing

```bash
# Run tests (if available)
pytest

# Check service health
curl http://localhost:8080/health

# Test access code validation
curl -X POST http://localhost:8080/api/validate-code \
  -H "Content-Type: application/json" \
  -d '{"access_code":"DEMO01","player_name":"Test","player_email":"test@example.com"}'

# Get leaderboard
curl http://localhost:8080/api/leaderboard?limit=5
```

