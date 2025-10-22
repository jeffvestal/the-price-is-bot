# The Price is Bot 🤖 Deployment Guide

Complete guide for deploying The Price is Bot 🤖 to any Elasticsearch cluster with reproducible, consistent results.

## Quick Start

```bash
# 1. Set your target cluster credentials
export KIBANA_URL=https://your-cluster.kb.cloud.es.io
export KIBANA_API_KEY=your_api_key

# 2. Deploy canonical agent definitions (tools + agents)
./deploy-canonical.sh --delete-existing
```

That's it! Your cluster is now ready to run the The Price is Bot 🤖 game.

## What Gets Deployed

### 🔧 Tools (8 total)
Agent Builder ES|QL tools for querying grocery data:

1. **search_grocery_items** - Core search (name, category, description)
2. **find_budget_items** - Optimal $15-25 price range items  
3. **find_deals** - Sales and promotions
4. **check_nutrition** - Nutritional facts
5. **find_recipe_items** - Recipe combinations
6. **check_store_inventory** - Real-time inventory (✅ searches by name OR item_id)
7. **seasonal_recommendations** - Seasonal products
8. **dietary_filter** - Dietary restrictions (vegan, gluten-free, etc.)

### 🤖 Agents (5 total)
Grocery shopping AI personalities:

1. **budget_master** - Savings expert, best deals
2. **health_guru** - Wellness focused, nutrition emphasis
3. **gourmet_chef** - Culinary expert, recipes
4. **speed_shopper** - Efficiency expert, popular items
5. **local_expert** - Las Vegas insider, local specialties

## Prerequisites

### 1. Python Environment

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install aiohttp python-dotenv
```

### 2. Grocery Data

The agents expect these Elasticsearch indices with grocery data:

- `grocery_items` - Items with prices, categories, nutrition
- `store_inventory` - Stock levels per store
- `store_locations` - Store details and specialties
- `seasonal_availability` - Seasonal item data
- `promotional_offers` - Sales and deals
- `nutrition_facts` - Detailed nutrition info
- `recipe_combinations` - Recipe suggestions

**Generate data** (if not already present):

```bash
# TODO: Create and document data generation script
# ./generate-grocery-data.sh
```

### 3. Kibana API Credentials

You need a Kibana API key with permissions to:
- Create/delete Agent Builder tools
- Create/delete Agent Builder agents

Get your API key from Kibana → Management → API Keys

## Deployment Commands

### Fresh Deployment

Deploy to a new cluster (will fail if tools/agents already exist):

```bash
export KIBANA_URL=https://new-cluster.kb.cloud.es.io
export KIBANA_API_KEY=new_api_key

./deploy-canonical.sh
```

### Redeploy (Force Update)

Delete existing and redeploy all tools and agents:

```bash
export KIBANA_URL=https://existing-cluster.kb.cloud.es.io
export KIBANA_API_KEY=existing_api_key

./deploy-canonical.sh --delete-existing
```

### Manual Python Deploy

```bash
source venv/bin/activate

# Deploy without deleting
python deploy_canonical_agents.py

# Or force redeploy
python deploy_canonical_agents.py --delete-existing
```

## Deployment Architecture

```
canonical-definitions/
├── tools.json          # 8 ES|QL tool definitions (CANONICAL SOURCE)
├── agents.json         # 5 agent definitions (CANONICAL SOURCE)
└── README.md           # Schema documentation

deploy_canonical_agents.py    # Python deployment script
deploy-canonical.sh           # Shell wrapper (activates venv)
agent-builder-service/
└── agent_builder_client.py   # Python API client
```

### Canonical Definitions

The **canonical definitions** in `canonical-definitions/` are the single source of truth. These are:

1. ✅ **Production-tested** - Extracted from working production deployment
2. ✅ **Schema-validated** - Correct API format for create operations
3. ✅ **Version-controlled** - Git tracked for reproducibility
4. ✅ **Cluster-agnostic** - No hardcoded cluster-specific values

## Updating Canonical Definitions

After making changes to tools or agents via the UI or API, update the canonical definitions:

```bash
export KIBANA_URL=https://your-cluster.kb.cloud.es.io
export KIBANA_API_KEY=your_api_key

# Export current production state
curl -s "${KIBANA_URL}/api/agent_builder/tools" \
  -H "Authorization: ApiKey ${KIBANA_API_KEY}" \
  -H "kbn-xsrf: true" | \
  jq '[.results[] | select(.readonly == false)]' > canonical-definitions/tools.json

curl -s "${KIBANA_URL}/api/agent_builder/agents" \
  -H "Authorization: ApiKey ${KIBANA_API_KEY}" \
  -H "kbn-xsrf: true" | \
  jq '[.results[] | select(.readonly == false)]' > canonical-definitions/agents.json

# Commit changes
git add canonical-definitions/
git commit -m "Update canonical agent definitions"
git push
```

## Verification

After deployment, verify everything works:

### 1. Check Tool and Agent Counts

```bash
export KIBANA_URL=https://your-cluster.kb.cloud.es.io
export KIBANA_API_KEY=your_api_key

# Should return 8 tools
curl -s "${KIBANA_URL}/api/agent_builder/tools" \
  -H "Authorization: ApiKey ${KIBANA_API_KEY}" \
  -H "kbn-xsrf: true" | \
  jq '[.results[] | select(.readonly == false)] | length'

# Should return 5 agents
curl -s "${KIBANA_URL}/api/agent_builder/agents" \
  -H "Authorization: ApiKey ${KIBANA_API_KEY}" \
  -H "kbn-xsrf: true" | \
  jq '[.results[] | select(.readonly == false)] | length'
```

### 2. Test a Query

Test the fixed `check_store_inventory` tool:

```bash
curl -s "${KIBANA_URL}/api/agent_builder/converse" \
  -H "Authorization: ApiKey ${KIBANA_API_KEY}" \
  -H "kbn-xsrf: true" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "speed_shopper",
    "input": "check inventory for tilapia"
  }' | jq '.steps[] | select(.type == "tool_call")'
```

### 3. Test the Game UI

```bash
# Start the frontend (from game-ui directory)
cd game-ui
npm run dev
```

Navigate to `http://localhost:3000` and test:
- Access code entry (use `bob-belcher` for testing)
- Agent selection
- Chat with an agent
- Adding items to bags
- Scoring system

## Common Issues

### Issue: Tools fail to deploy with "readonly" error

**Solution**: The deployment script now filters out `readonly`, `created_at`, and `updated_at` fields automatically.

### Issue: Agents fail with "type" error

**Solution**: The deployment script filters out `type` from agent create requests (it's returned in GET but not allowed in POST).

### Issue: 401 Unauthorized

**Solution**: Check your `KIBANA_API_KEY` has write permissions for Agent Builder.

### Issue: Agent can't find items with generic terms like "veggies"

**Solution**: The deployed agents include instructions to use `platform.*` tools for semantic search when specialized tools return no results. Ensure agents have access to:
- `platform.core.search`
- `platform.core.execute_esql`
- `platform.core.generate_esql`

These are already included in the canonical agent definitions.

## Files Reference

| File | Purpose |
|------|---------|
| `canonical-definitions/tools.json` | ✅ **SOURCE OF TRUTH** for tools |
| `canonical-definitions/agents.json` | ✅ **SOURCE OF TRUTH** for agents |
| `deploy_canonical_agents.py` | Deployment script (reads canonical definitions) |
| `deploy-canonical.sh` | Shell wrapper (activates venv, runs Python) |
| `agent-builder-service/agent_builder_client.py` | Agent Builder API client |

## Development Workflow

### Making Changes to Tools/Agents

1. **Option A: Edit via Kibana UI**
   - Make changes in Kibana
   - Export to canonical definitions (see "Updating Canonical Definitions" above)
   - Test on dev cluster
   - Deploy to production

2. **Option B: Edit canonical JSON directly**
   - Edit `canonical-definitions/tools.json` or `agents.json`
   - Deploy to dev cluster: `./deploy-canonical.sh --delete-existing`
   - Test thoroughly
   - Deploy to production

### Schema Reference

See `canonical-definitions/README.md` for detailed schema documentation.

## Deployment Checklist

Before deploying to production:

- [ ] Test all agents with the canonical initial request:
  ```
  I need 5 unique items in separate bags. 
  There can be more than one of the same item per bag. 
  I need all the bags to total up to $100
  ```
- [ ] Verify each agent returns items (not empty responses)
- [ ] Test with generic terms (vegetables, meat, dairy)
- [ ] Verify price ranges are reasonable ($5-35 per item)
- [ ] Check that items add up close to $100
- [ ] Test both streaming and non-streaming modes
- [ ] Verify game scoring works correctly
- [ ] Check leaderboard updates

## Production URLs

| Environment | Kibana URL |
|-------------|------------|
| Production | `https://your-production-cluster.kb.cloud.es.io` |

## Support

For issues or questions about deployment:
1. Check this guide first
2. Review logs from `./deploy-canonical.sh`
3. Check `canonical-definitions/README.md` for schema details
4. Test individual API calls with curl

## Version History

- **v1.0** (2025-10-08) - Initial canonical deployment system
  - 8 tools, 5 agents
  - Fixed `check_store_inventory` to search by name OR item_id
  - All tools use correct ES|QL syntax
  - All agents use correct configuration schema

