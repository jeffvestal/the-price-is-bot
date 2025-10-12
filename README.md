# The Price is Bot 🤖

An AI-powered grocery shopping challenge that showcases Elastic's Agent Builder capabilities at conferences and demos.

Challenge yourself to build the perfect $100 grocery cart using AI shopping agents!

---

## 📦 Architecture

The Price is Bot is built on **[elastic-grocery-core](https://github.com/elastic/elastic-grocery-core)**, a reusable library that provides shared grocery data and agent tools.

### What's in elastic-grocery-core (Shared)
- 🛒 **Data Generation**: Realistic grocery items, stores, inventory, nutrition facts, seasonal data
- 🤖 **Agent Builder Client**: Python API client for deploying agents and tools
- 🔧 **8 Base Tools**: Generic grocery shopping tools (search, budget, nutrition, seasonal, etc.)
- 📊 **Elasticsearch Indices**: Pre-configured schemas for grocery data

### What's in The Price is Bot (Game-Specific)
- 🎭 **5 Game Agents**: Unique personalities (Budget Master, Health Guru, Gourmet Chef, Speed Shopper, Vegas Local Expert)
- 🎮 **Game UI**: Next.js 14 interface with real-time agent chat
- 🏆 **Leaderboard API**: FastAPI service for scoring and rankings
- 🎫 **Access Codes**: Session management and player authentication
- 📊 **Game Backend**: Scoring, telemetry, and game state management

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.9+** with pip
- **Node.js 18+** with npm
- **Elasticsearch 8.15+** cluster with Agent Builder enabled
- **AWS credentials** (for Bedrock) or OpenAI API key

### 1. Install Dependencies

```bash
# Install Python dependencies (includes elastic-grocery-core)
pip install -r requirements.txt

# Install Node.js dependencies for game UI
cd game-ui
npm install
cd ..
```

### 2. Generate Grocery Data

Use elastic-grocery-core to generate synthetic data:

```bash
export ES_URL="https://your-elasticsearch-url"
export ES_API_KEY="your-api-key"

python -m elastic_grocery_core.scripts.generate_data \
  --grocery-items 5000 \
  --store-count 10
```

This creates realistic grocery data in your Elasticsearch cluster.

### 3. Deploy Tools and Agents

Deploy both base tools (from core) and game agents:

```bash
export KIBANA_URL="https://your-kibana-url"
export KIBANA_API_KEY="your-kibana-api-key"

# Deploy everything (8 tools + 5 agents)
./deploy-canonical.sh

# Verify deployment
./verify-deployment.sh
```

### 4. Start the Game

```bash
# Terminal 1: Start leaderboard API
./run-leaderboard-api.sh

# Terminal 2: Start game UI
./run-game-ui.sh
```

Game will be available at **http://localhost:3000**

---

## 🎮 Game Components

### Game Agents

Five unique AI shopping personalities compete in the game:

| Agent | Personality | Specialty |
|-------|-------------|-----------|
| **Budget Master** | Savvy saver | Finding deals and comparing prices |
| **Health Guru** | Wellness focused | Nutrition and dietary restrictions |
| **Gourmet Chef** | Culinary enthusiast | Premium ingredients and recipes |
| **Speed Shopper** | Efficient decider | Quick, popular choices |
| **Vegas Local Expert** | City insider | Local stores and Vegas specialties |

### Game Rules

- **Objective**: Build a $100 grocery cart with 5 unique items
- **Challenge**: Work with an AI agent to select items
- **Scoring**: Based on how close to $100 and quality of selections
- **Time Limit**: Configurable per game session

See [docs/GAME_RULES.md](docs/GAME_RULES.md) for detailed scoring mechanics.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        elastic-grocery-core                             │
│  • Data generation       • Agent Builder client    • 8 base tools       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ├─ Used by ─┐
                                    │            │
                                    ▼            ▼
┌──────────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   Deployment Layer   │    │   Agent Builder      │    │   Game Layer    │
│                      │    │                      │    │                 │
│  • deploy-canonical  │───▶│  • 8 Tools          │◀───│  • Next.js UI   │
│  • verify-deployment │    │  • 5 Agents         │    │  • Leaderboard  │
│                      │    │  • ES|QL queries    │    │  • Access codes │
└──────────────────────┘    └──────────────────────┘    └─────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Elasticsearch Cluster                            │
│                                                                          │
│  Grocery Data:              Game Data:                                  │
│  • grocery_items            • game_sessions                             │
│  • store_locations          • access_codes                              │
│  • store_inventory          • leaderboard_*                             │
│  • nutrition_facts                                                      │
│  • seasonal_availability                                                │
│  • promotional_offers                                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Repository Structure

```
the-price-is-bot/
├── README.md                       # This file
├── DEPLOYMENT.md                   # Detailed deployment guide
├── SCRIPTS.md                      # Script reference
│
├── definitions/
│   └── game_agents.json            # 5 game personality agents
│
├── scripts/
│   └── deploy_game.py              # Game agent deployment script
│
├── docs/
│   ├── GAME_RULES.md               # Game mechanics and scoring
│   └── archive/                    # Historical development docs
│
├── game-ui/                        # Next.js game interface
│   ├── src/
│   │   ├── app/                    # Next.js 14 app router
│   │   ├── components/             # React components
│   │   └── store/                  # Game state management
│   └── package.json
│
├── leaderboard-api/                # FastAPI leaderboard service
│   ├── main.py                     # API endpoints
│   └── requirements.txt
│
├── backend/                        # Game backend (optional)
│   ├── app/
│   │   ├── routers/                # API routes
│   │   ├── services/               # Business logic
│   │   └── utils/                  # Auth, scoring, etc.
│   └── requirements.txt
│
├── tools/                          # Utility scripts
│   ├── generate_admin_jwt.py      # Generate admin tokens
│   └── decode_jwt.py               # Decode JWT tokens
│
├── deploy-canonical.sh             # Master deployment script
├── verify-deployment.sh            # Deployment verification
├── run-game-ui.sh                  # Start game UI
├── run-leaderboard-api.sh          # Start leaderboard API
└── requirements.txt                # Python dependencies
```

---

## 🔧 Development

### Running Locally

```bash
# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set environment variables
export ES_URL="your-elasticsearch-url"
export ES_API_KEY="your-api-key"
export KIBANA_URL="your-kibana-url"
export KIBANA_API_KEY="your-kibana-api-key"

# 4. Generate data (if not already done)
python -m elastic_grocery_core.scripts.generate_data \
  --grocery-items 1000 \
  --store-count 5

# 5. Deploy agents
./deploy-canonical.sh

# 6. Start services
./run-leaderboard-api.sh &
./run-game-ui.sh
```

### Customizing Game Agents

Edit agent definitions in `definitions/game_agents.json`:

```json
{
  "id": "budget_master",
  "name": "Budget Master",
  "description": "Your personal savings expert",
  "configuration": {
    "instructions": "You are the Budget Master...",
    "tools": [{"tool_ids": ["find_budget_items", "find_deals"]}]
  }
}
```

Redeploy after changes:

```bash
python scripts/deploy_game.py --delete-existing
```

### Adding New Features

1. **New Agent Personality**: Add to `definitions/game_agents.json`
2. **New Tool**: Contribute to elastic-grocery-core
3. **UI Changes**: Edit `game-ui/src/components/`
4. **Scoring Logic**: Update `backend/app/utils/scoring.py`

---

## 📚 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide
- **[SCRIPTS.md](SCRIPTS.md)** - Script reference and workflows
- **[docs/GAME_RULES.md](docs/GAME_RULES.md)** - Game mechanics and scoring
- **[elastic-grocery-core README](https://github.com/elastic/elastic-grocery-core)** - Core library documentation

---

## 🧪 Testing

### Verify Deployment

```bash
./verify-deployment.sh
```

Expected output:
- ✅ 8/8 base tools deployed
- ✅ 5/5 game agents deployed
- ✅ All tools have correct configuration

### Test Game Flow

1. Navigate to http://localhost:3000
2. Enter access code (or generate via admin panel)
3. Select an agent personality
4. Chat with agent to select 5 items
5. Submit cart and view score on leaderboard

---

## 🚢 Deployment

### Deploy to Production Cluster

```bash
# 1. Set production credentials
export KIBANA_URL="https://prod-cluster.kb.cloud.es.io"
export KIBANA_API_KEY="prod-api-key"

# 2. Generate data (if needed)
export ES_URL="https://prod-es-url"
export ES_API_KEY="prod-es-key"

python -m elastic_grocery_core.scripts.generate_data \
  --grocery-items 50000 \
  --store-count 20

# 3. Deploy tools and agents
./deploy-canonical.sh --delete-existing

# 4. Verify
./verify-deployment.sh
```

### Deploy Game Services

Configure your hosting platform (AWS, GCP, Azure) to run:
- **game-ui/**: Next.js app (Port 3000)
- **leaderboard-api/**: FastAPI service (Port 8000)

Environment variables needed:
- `ES_URL`, `ES_API_KEY` - Elasticsearch connection
- `KIBANA_URL`, `KIBANA_API_KEY` - Agent Builder API

---

## 🤝 Contributing

Contributions welcome! Please:

1. Check existing issues or create a new one
2. Fork the repository
3. Create a feature branch
4. Make your changes
5. Add tests if applicable
6. Submit a pull request

For core functionality (data generation, base tools), contribute to [elastic-grocery-core](https://github.com/elastic/elastic-grocery-core).

---

## 📄 License

Apache License 2.0 - See [LICENSE](LICENSE) for details.

---

## 🆘 Support

- **Issues**: Open a GitHub issue
- **Documentation**: Check [SCRIPTS.md](SCRIPTS.md) and [DEPLOYMENT.md](DEPLOYMENT.md)
- **Core Library**: See [elastic-grocery-core](https://github.com/elastic/elastic-grocery-core)

---

## 🎯 Related Projects

- **[elastic-grocery-core](https://github.com/elastic/elastic-grocery-core)** - Shared grocery data and tools
- **[elasti-cart](https://github.com/elastic/elasti-cart)** - Instacart-style shopping demo (coming soon)
- Create your own grocery-themed demo using elastic-grocery-core!

---

**Built with ❤️ using Elastic Agent Builder**
