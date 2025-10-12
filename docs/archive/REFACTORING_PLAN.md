# Multi-Demo Architecture: Copy & Clean Approach

## User's Initial Setup (Manual Steps)

1. Create new GitHub repository: `elastic-grocery-core`
2. Copy entire `elasti-cart/` directory contents into `elastic-grocery-core/`
3. Open `elastic-grocery-core/` as new Cursor project
4. Follow this plan to clean and restructure

---

## Phase 1: Clean Up Core Repository

### Step 1.1: Remove Demo-Specific Components

DELETE these directories (demo-specific, not needed in core):

- `game-ui/` - Game frontend (Next.js app)
- `leaderboard-api/` - Game leaderboard service
- `frontend/` - Old frontend (if exists)
- `backend/` - Demo-specific backend

DELETE these files (demo-specific):

- `run-game-ui.sh`
- `run-leaderboard-api.sh`
- `CONVERSATION_TEST.md`
- `CODE_REVIEW_RESULTS.md`
- Any game-specific documentation

KEEP these components:

- `grocery-data-generator/` - Core data generation library
- `agent-builder-service/` - Agent Builder API client
- `canonical-definitions/` - Will filter to base tools only
- `deploy-canonical.sh`, `verify-deployment.sh` - Deployment scripts

### Step 1.2: Restructure as Python Package

Create new package structure:

```
elastic-grocery-core/
├── setup.py                    # NEW - Python package config
├── pyproject.toml             # NEW - Modern packaging
├── README.md                  # UPDATE - Core library docs
├── LICENSE                    # KEEP
├── requirements.txt           # UPDATE - Core deps only
├── elastic_grocery_core/      # NEW - Main package
│   ├── __init__.py            # NEW - Package exports
│   ├── data_generator/        # MOVE from grocery-data-generator/lib/
│   │   ├── __init__.py
│   │   ├── data_generators.py
│   │   ├── elasticsearch_client.py
│   │   └── llm_client.py
│   ├── agent_builder/         # MOVE from agent-builder-service/
│   │   ├── __init__.py
│   │   ├── client.py          # From agent_builder_client.py
│   │   └── base_tools.py      # NEW - Tool definitions
│   └── schemas/               # NEW - Shared data models
│       └── __init__.py
├── scripts/                   # Scripts for end-users
│   ├── generate_data.py       # From grocery-data-generator/control.py
│   └── deploy_base_tools.py   # NEW - Deploy base tools only
├── definitions/               # Base tool/agent definitions
│   └── base_tools.json        # Extract from canonical-definitions/
└── tests/
    └── __init__.py
```

### Step 1.3: Filter Tools to Base Only

From `canonical-definitions/tools.json`, extract ONLY generic tools:

**Include (generic grocery tools):**

- `find_budget_items` - Product search by price
- `check_nutrition` - Nutritional info lookup
- `seasonal_recommendations` - Seasonal products
- `find_store_locations` - Store locations

**Exclude (demo-specific):**

- Tools with "vegas" or "local" references
- Game scoring tools
- Any customizations for specific demos

Save filtered tools to `definitions/base_tools.json`

### Step 1.4: Create Package Configuration Files

**setup.py:**

```python
from setuptools import setup, find_packages

setup(
    name="elastic-grocery-core",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "elasticsearch>=8.0.0",
        "anthropic>=0.3.0",
        "aiohttp>=3.8.0",
        # ... from current requirements.txt
    ],
    python_requires=">=3.9",
    author="Elastic",
    description="Shared grocery data and agent tools for Elastic demos"
)
```

**pyproject.toml:**

```toml
[build-system]
requires = ["setuptools>=45", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "elastic-grocery-core"
version = "0.1.0"
requires-python = ">=3.9"
```

### Step 1.5: Update Core README

Create comprehensive documentation:

- What the core library provides
- How to install it (`pip install git+https://...`)
- How to generate data
- How to deploy base tools
- How to extend it for new demos

---

## Phase 2: Refactor Elasti-Cart to Use Core

### Step 2.1: Clean Up Elasti-Cart Repository

In the ORIGINAL `elasti-cart/` repo:

DELETE these directories (now in core):

- `grocery-data-generator/` - Moved to core
- `agent-builder-service/` - Moved to core

KEEP these components (demo-specific):

- `game-ui/` - Game frontend
- `leaderboard-api/` - Game API
- `backend/` - If used for game
- Game-specific scripts and docs

### Step 2.2: Create Demo-Specific Definitions

Create `definitions/` in elasti-cart with:

- `game_agents.json` - 5 game personalities (Budget Master, Health Guru, etc.)
- `game_tools.json` - Game-specific tools only (if any beyond base)

### Step 2.3: Update Elasti-Cart Dependencies

**requirements.txt:**

```
# Add core library dependency
elastic-grocery-core @ git+https://github.com/elastic/elastic-grocery-core.git@main

# Game-specific dependencies
fastapi>=0.100.0
uvicorn>=0.23.0
# ... other game deps
```

### Step 2.4: Update Import Statements

Change imports throughout elasti-cart:

```python
# Old:
from grocery_data_generator.lib.elasticsearch_client import ElasticsearchClient
from agent_builder_service.agent_builder_client import AgentBuilderClient

# New:
from elastic_grocery_core.data_generator import ElasticsearchClient
from elastic_grocery_core.agent_builder import AgentBuilderClient
```

### Step 2.5: Update Deployment Scripts

**New `scripts/deploy_demo.sh`:**

```bash
#!/bin/bash
# Deploy base tools from core
python -m elastic_grocery_core.scripts.deploy_base_tools

# Deploy game-specific agents
python deploy_game_agents.py
```

---

## Phase 3: Testing & Validation

### Step 3.1: Test Core Package Installation

```bash
# In a clean environment
pip install git+https://github.com/elastic/elastic-grocery-core.git

# Test imports
python -c "from elastic_grocery_core.data_generator import GroceryDataGenerator"
python -c "from elastic_grocery_core.agent_builder import AgentBuilderClient"
```

### Step 3.2: Test Data Generation

```bash
python -m elastic_grocery_core.scripts.generate_data \
  --es-url $ES_URL \
  --es-api-key $ES_API_KEY
```

### Step 3.3: Test Elasti-Cart with Core

```bash
cd elasti-cart
pip install -r requirements.txt  # Should install core
./scripts/deploy_demo.sh
./run-game-ui.sh
```

---

## Phase 4: Documentation & Templates

### Step 4.1: Core Library Documentation

Create in `elastic-grocery-core/README.md`:

- Installation instructions
- Data generation guide
- Base tools reference
- Extension patterns for new demos
- API documentation

### Step 4.2: Demo Template

Create `DEMO_TEMPLATE.md` in core repo:

```markdown
# Creating a New Demo

## 1. Setup
- Create new repo: elastic-{demo-name}
- Add core dependency to requirements.txt

## 2. Define Demo-Specific Components
- Create definitions/agents.json
- Create definitions/tools.json (if needed)
- Build frontend/backend as needed

## 3. Deployment
- Use core for data generation
- Deploy base tools from core
- Deploy demo-specific agents
```

### Step 4.3: Migration Guide

Document the new architecture:

- Why multi-repo approach
- How data sharing works
- When to use core vs demo-specific code
- Versioning strategy

---

## File-by-File Action List

### elastic-grocery-core (new repo)

**Files to Create:**

- `setup.py` - Package configuration
- `pyproject.toml` - Modern packaging
- `elastic_grocery_core/__init__.py` - Package root
- `elastic_grocery_core/data_generator/__init__.py` - Module exports
- `elastic_grocery_core/agent_builder/__init__.py` - Module exports
- `elastic_grocery_core/agent_builder/client.py` - Rename from agent_builder_client.py
- `elastic_grocery_core/schemas/__init__.py` - Shared schemas
- `scripts/deploy_base_tools.py` - Base tool deployment
- `definitions/base_tools.json` - Filtered generic tools
- `tests/__init__.py` - Test structure

**Files to Move:**

- `grocery-data-generator/lib/*.py` → `elastic_grocery_core/data_generator/`
- `grocery-data-generator/control.py` → `scripts/generate_data.py`
- `agent-builder-service/agent_builder_client.py` → `elastic_grocery_core/agent_builder/client.py`

**Files to Update:**

- `README.md` - Core library documentation
- `requirements.txt` - Core dependencies only

**Files to Delete:**

- `game-ui/` (entire directory)
- `leaderboard-api/` (entire directory)
- `frontend/` (if exists)
- `backend/` (if exists)
- Demo-specific scripts and docs

### elasti-cart (existing repo)

**Files to Create:**

- `definitions/game_agents.json` - Game personalities
- `definitions/game_tools.json` - Game-specific tools (if any)
- `scripts/deploy_demo.sh` - Game deployment

**Files to Update:**

- `requirements.txt` - Add core dependency
- All Python files - Update import statements
- `README.md` - Document new architecture

**Files to Delete:**

- `grocery-data-generator/` (entire directory)
- `agent-builder-service/` (entire directory)
- `canonical-definitions/` - Move to core or filter

---

## Benefits Summary

1. **Independent Deployment** - Deploy demos separately
2. **Shared Foundation** - Consistent data across all demos
3. **Version Control** - Demos pin core versions as needed
4. **Clear Ownership** - Obvious what's shared vs demo-specific
5. **Scalability** - Easy to add new demos
6. **Flexibility** - Different tech stacks per demo

---

## Next Steps After Plan Approval

1. User creates elastic-grocery-core repo and copies elasti-cart into it
2. User opens elastic-grocery-core in new Cursor project
3. Execute cleanup and restructuring in elastic-grocery-core
4. Test core package installation
5. Refactor elasti-cart to use core
6. Validate everything works
7. Create first new demo as proof of concept

---

## Implementation Checklist

- [ ] Create elastic-grocery-core repository structure with setup.py, package layout, and initial files
- [ ] Extract grocery-data-generator/lib/ into elastic_grocery_core/data_generator/ module
- [ ] Extract agent-builder-service/agent_builder_client.py into elastic_grocery_core/agent_builder/ module
- [ ] Create base_tools.json with only generic tools (product search, nutrition, seasonal, store locations)
- [ ] Create setup.py and pyproject.toml for core package with proper dependencies
- [ ] Test core package installation and basic functionality independently
- [ ] Refactor elasti-cart to use core library - update requirements.txt and imports
- [ ] Split canonical-definitions into base (in core) and demo-specific (in elasti-cart)
- [ ] Update elasti-cart deployment scripts to use core for base setup
- [ ] Create template/guide for new demo repositories
- [ ] Write comprehensive documentation for multi-repo architecture and development workflow

