# The Price is Bot 🤖 Scripts Reference

Complete reference for all deployment and management scripts in The Price is Bot game.

## 📦 Architecture

The Price is Bot now uses **[elastic-grocery-core](https://github.com/elastic/elastic-grocery-core)** for shared functionality:
- ✅ Data generation (grocery items, stores, inventory)
- ✅ Agent Builder API client
- ✅ 9 base grocery shopping tools

This repository contains **game-specific components**:
- 🎮 5 game personality agents
- 🎯 Game UI (Next.js)
- 📊 Leaderboard API
- 🔐 Access code management

---

## 🚀 Deployment Scripts

### `deploy-canonical.sh` ✅ **PRIMARY DEPLOYMENT SCRIPT**

Deploy both base tools and game agents to any cluster.

```bash
# Fresh deployment
export KIBANA_URL=https://your-cluster.kb.cloud.es.io
export KIBANA_API_KEY=your_api_key
./deploy-canonical.sh

# Force redeploy (deletes existing first)
./deploy-canonical.sh --delete-existing
```

**What it does:**
1. Deploys 9 base tools from elastic-grocery-core
2. Deploys 5 game personality agents from definitions/game_agents.json

**Exit codes:**
- `0` = Success, all deployed
- `1` = Failure, some definitions failed

---

### `scripts/deploy_game.py`

Python script for deploying game-specific agents.

```bash
python scripts/deploy_game.py [--delete-existing]
```

**What it does:**
- Reads `definitions/game_agents.json`
- Deploys 5 game agents (Budget Master, Health Guru, Gourmet Chef, Speed Shopper, Vegas Local Expert)
- Uses AgentBuilderClient from elastic-grocery-core

---

### `verify-deployment.sh` ✅ **VERIFICATION SCRIPT**

Verify that deployment is correct and complete.

```bash
export KIBANA_URL=https://your-cluster.kb.cloud.es.io
export KIBANA_API_KEY=your_api_key
./verify-deployment.sh
```

**What it checks:**
- ✅ 9 base tools deployed (from elastic-grocery-core)
- ✅ 5 game agents deployed
- ✅ `check_store_inventory` tool has correct query

**Exit codes:**
- `0` = Deployment verified
- `1` = Deployment incorrect or incomplete

---

## 🎮 Game Management Scripts

### `run-game-ui.sh`

Start the game UI (Next.js).

```bash
./run-game-ui.sh
```

Starts the game interface on http://localhost:3000

---

### `run-leaderboard-api.sh`

Start the leaderboard API service.

```bash
./run-leaderboard-api.sh
```

Starts the FastAPI leaderboard service on http://localhost:8001

---

## 📚 Documentation

### `README.md` ✅ **START HERE**

Main project documentation with:
- Architecture overview
- Quick start guide
- Deployment instructions
- Game rules

---

### `DEPLOYMENT.md` ✅ **DEPLOYMENT GUIDE**

Complete deployment guide with:
- Prerequisites and setup
- Deployment commands
- Verification steps
- Troubleshooting
- Schema reference

---

### `docs/GAME_RULES.md`

Game rules and scoring mechanics:
- How the game works
- Scoring system
- Max items per bag rules
- Agent personalities

---

### `docs/archive/`

Historical documentation from development:
- Refactoring plans
- Code reviews
- Development notes

---

## 🗂️ Directory Structure

```
/Users/jeffvestal/repos/grocery/the-price-is-bot/
├── definitions/
│   └── game_agents.json            # 5 game personality agents
│
├── scripts/
│   └── deploy_game.py             # Game agent deployment
│
├── game-ui/                       # Next.js game interface
├── leaderboard-api/               # FastAPI leaderboard service  
├── backend/                       # Game backend (if used)
├── frontend/                      # Old frontend (legacy)
│
├── deploy-canonical.sh            # ✅ Main deployment script
├── verify-deployment.sh           # ✅ Verification script
├── run-game-ui.sh                 # Start game UI
├── run-leaderboard-api.sh         # Start leaderboard API
│
├── README.md                      # Main documentation
├── DEPLOYMENT.md                  # Deployment guide
├── SCRIPTS.md                     # This file
└── docs/                          # Additional documentation
    ├── GAME_RULES.md
    └── archive/                   # Historical docs
```

---

## 🎯 Common Workflows

### First-Time Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# This installs:
# - elastic-grocery-core (data gen + agent tools)
# - Game-specific dependencies (FastAPI, etc.)

# 2. Generate data (using elastic-grocery-core)
export ES_URL=https://your-es-url
export ES_API_KEY=your_api_key

python -m elastic_grocery_core.scripts.generate_data \
  --grocery-items 1000 \
  --store-count 5

# 3. Deploy tools and agents
export KIBANA_URL=https://your-kibana-url
export KIBANA_API_KEY=your_api_key

./deploy-canonical.sh

# 4. Verify
./verify-deployment.sh

# 5. Start game
./run-leaderboard-api.sh &
./run-game-ui.sh
```

---

### Deploy to New Cluster

```bash
# 1. Set credentials
export KIBANA_URL=https://new-cluster.kb.cloud.es.io
export KIBANA_API_KEY=new_api_key

# 2. Deploy (base tools + game agents)
./deploy-canonical.sh

# 3. Verify
./verify-deployment.sh
```

---

### Update Game Agents Only

```bash
# Edit game agent definitions
vim definitions/game_agents.json

# Redeploy only game agents (keeps base tools)
python scripts/deploy_game.py --delete-existing

# Verify
./verify-deployment.sh
```

---

### Redeploy Everything

```bash
export KIBANA_URL=https://target-cluster.kb.cloud.es.io
export KIBANA_API_KEY=target_api_key

# Force redeploy (deletes and recreates)
./deploy-canonical.sh --delete-existing

# Verify
./verify-deployment.sh
```

---

## 🔧 Tool Scripts

### `tools/generate_admin_jwt.py`

Generate admin JWT token for game management.

```bash
python tools/generate_admin_jwt.py
```

---

### `tools/decode_jwt.py`

Decode and inspect JWT tokens.

```bash
python tools/decode_jwt.py <token>
```

---

## 🆘 Troubleshooting

### elastic-grocery-core not found
**Problem:** `ModuleNotFoundError: No module named 'elastic_grocery_core'`

**Solution:** Install the core library:
```bash
pip install git+https://github.com/elastic/elastic-grocery-core.git@main
```

---

### Wrong number of tools deployed
**Problem:** verify-deployment.sh reports wrong tool count

**Solution:** 
- Expected: 9 tools (from elastic-grocery-core) + 5 agents
- Old duplicates may exist. Use `--delete-existing` flag
```bash
./deploy-canonical.sh --delete-existing
```

---

### Script can't find virtual environment
**Problem:** "venv/bin/activate: No such file or directory"

**Solution:** The `venv/` directory is not version controlled (it's in .gitignore). Create it:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

### Data generation fails
**Problem:** Can't generate grocery data

**Solution:** Make sure elastic-grocery-core is installed:
```bash
pip install git+https://github.com/elastic/elastic-grocery-core.git@main
```

Then use the core library's data generation:
```bash
python -m elastic_grocery_core.scripts.generate_data \
  --es-url YOUR_URL \
  --es-api-key YOUR_KEY
```

---

## 📊 Script Summary Table

| Script | Purpose | Required Env Vars | Exit Codes |
|--------|---------|-------------------|------------|
| `deploy-canonical.sh` | Deploy base tools + game agents | `KIBANA_URL`, `KIBANA_API_KEY` | 0=success, 1=failure |
| `scripts/deploy_game.py` | Deploy game agents only | `KIBANA_URL`, `KIBANA_API_KEY` | 0=success, 1=failure |
| `verify-deployment.sh` | Verify deployment | `KIBANA_URL`, `KIBANA_API_KEY` | 0=verified, 1=incorrect |
| `run-game-ui.sh` | Start game UI | None | N/A (long-running) |
| `run-leaderboard-api.sh` | Start leaderboard API | Elasticsearch credentials | N/A (long-running) |

---

## 🎓 Learning Path

1. **Read architecture**: `README.md` architecture section
2. **Install dependencies**: `pip install -r requirements.txt`
3. **Generate data**: Use elastic-grocery-core's data generator
4. **Deploy**: `./deploy-canonical.sh`
5. **Verify**: `./verify-deployment.sh`
6. **Play**: `./run-game-ui.sh` and `./run-leaderboard-api.sh`
7. **Customize**: Edit `definitions/game_agents.json` and redeploy

---

## 📞 Support

For script issues:
1. Check this reference guide
2. Review `README.md` and `DEPLOYMENT.md`
3. Check script exit codes and output
4. Verify environment variables are set
5. Ensure elastic-grocery-core is installed

---

**Last Updated:** 2025-10-11  
**Version:** 2.0 (Post-Refactoring with elastic-grocery-core)
