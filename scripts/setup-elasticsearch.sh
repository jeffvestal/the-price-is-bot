#!/bin/bash
# Setup Elasticsearch with grocery data and deploy agents
# This script handles the complete Elasticsearch setup for The Price is Bot

set -e  # Exit on any error

echo "🔧 Setting up Elasticsearch for The Price is Bot"
echo "=================================================="
echo ""

# Use project root as working directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Resolve absolute path to elastic-grocery-core
CORE_ROOT="$(cd "$PROJECT_ROOT/../elastic-grocery-core" && pwd)"

# Resolve Python and Pip from local venv if available
if [ -x ".venv/bin/python" ]; then
    PYTHON=".venv/bin/python"
    PIP=".venv/bin/pip"
    echo "✓ Using Python from .venv: $($PYTHON -V)"
else
    PYTHON=$(command -v python3 || true)
    PIP=$(command -v pip3 || true)
    if [ -z "$PYTHON" ] || [ -z "$PIP" ]; then
        echo "❌ python3/pip3 not found. Create a venv first:"
        echo "   python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
        exit 1
    fi
    echo "✓ Using system Python: $($PYTHON -V)"
fi

echo ""
# Load environment variables if .env files exist
if [ -f ".env.elasticsearch" ]; then
    export $(cat .env.elasticsearch | grep -v '^#' | xargs)
    echo "✓ Loaded .env.elasticsearch"
fi

if [ -f ".env.kibana" ]; then
    export $(cat .env.kibana | grep -v '^#' | xargs)
    echo "✓ Loaded .env.kibana"
fi

echo ""
# Check for required environment variables
if [ -z "$ES_URL" ] || [ -z "$ES_API_KEY" ]; then
    echo "❌ Missing Elasticsearch credentials!"
    echo "Please set ES_URL and ES_API_KEY in .env.elasticsearch"
    echo ""
    echo "Or export them:"
    echo "  export ES_URL='https://your-cluster.es.cloud.es.io'"
    echo "  export ES_API_KEY='your_api_key'"
    exit 1
fi

if [ -z "$KIBANA_URL" ] || [ -z "$KIBANA_API_KEY" ]; then
    echo "❌ Missing Kibana credentials!"
    echo "Please set KIBANA_URL and KIBANA_API_KEY in .env.kibana"
    echo ""
    echo "Or export them:"
    echo "  export KIBANA_URL='https://your-cluster.kb.cloud.es.io'"
    echo "  export KIBANA_API_KEY='your_api_key'"
    exit 1
fi

echo "📡 Elasticsearch: $ES_URL"
echo "📡 Kibana: $KIBANA_URL"
echo ""

# Ensure dependencies are installed
echo "Step 0: Installing project requirements (if needed)..."
$PIP install --upgrade pip >/dev/null
$PIP install -r requirements.txt >/dev/null
$PIP install -e "$CORE_ROOT" >/dev/null
echo "✅ Requirements installed"

echo ""
# Step 1: Check Elasticsearch connection
echo "Step 1: Testing Elasticsearch connection..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: ApiKey $ES_API_KEY" \
    "$ES_URL")

if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ Failed to connect to Elasticsearch (HTTP $HTTP_CODE)"
    exit 1
fi
echo "✅ Elasticsearch connection successful"
echo ""

# Build optional LLM args
LLM_ARGS=()
if [ -n "$LLM_PROVIDER" ]; then
  LLM_ARGS+=("--llm-provider" "$LLM_PROVIDER")
fi
if [ -n "$LLM_MODEL" ]; then
  LLM_ARGS+=("--llm-model" "$LLM_MODEL")
fi
if [ -n "$LLM_INFERENCE_PROFILE_ARN" ]; then
  LLM_ARGS+=("--llm-inference-profile-arn" "$LLM_INFERENCE_PROFILE_ARN")
fi

# Step 2: Generate grocery data
echo "Step 2: Generating grocery data..."
# Allow overriding totals via env for re-runs
ITEMS_TOTAL=${GROCERY_ITEMS:-5000}
STORES_TOTAL=${STORE_COUNT:-10}
echo "  Items: ${ITEMS_TOTAL}"
echo "  Stores: ${STORES_TOTAL}"
echo ""

# Call the script via absolute path (avoid -m import issues)
PYTHONUNBUFFERED=1 $PYTHON "$CORE_ROOT/scripts/generate_data.py" \
    --es-url "$ES_URL" \
    --es-api-key "$ES_API_KEY" \
    --grocery-items ${ITEMS_TOTAL} \
    --store-count ${STORES_TOTAL} \
    "${LLM_ARGS[@]}"

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate grocery data"
    exit 1
fi
echo "✅ Grocery data generated successfully"
echo ""

# Step 3: Deploy base tools (8 tools from elastic-grocery-core)
echo "Step 3: Deploying base grocery tools..."
$PYTHON "$CORE_ROOT/scripts/deploy_base_tools.py" "$@"

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy base tools"
    exit 1
fi
echo "✅ Base tools deployed successfully"
echo ""

# Step 4: Deploy game agents (5 agents)
echo "Step 4: Deploying game agents..."
$PYTHON scripts/deploy_game.py "$@"

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy game agents"
    exit 1
fi
echo "✅ Game agents deployed successfully"
echo ""

# Step 5: Verify deployment
echo "Step 5: Verifying deployment..."

# Check tool count (should be 8)
TOOL_COUNT=$(curl -s "${KIBANA_URL}/api/agent_builder/tools" \
  -H "Authorization: ApiKey ${KIBANA_API_KEY}" \
  -H "kbn-xsrf: true" 2>/dev/null | \
  $PYTHON -c "import sys, json; data = json.load(sys.stdin); print(len([t for t in data.get('results', []) if not t.get('readonly', False)]))" 2>/dev/null || echo "0")

# Check agent count (should be 5)
AGENT_COUNT=$(curl -s "${KIBANA_URL}/api/agent_builder/agents" \
  -H "Authorization: ApiKey ${KIBANA_API_KEY}" \
  -H "kbn-xsrf: true" 2>/dev/null | \
  $PYTHON -c "import sys, json; data = json.load(sys.stdin); print(len([a for a in data.get('results', []) if not a.get('readonly', False)]))" 2>/dev/null || echo "0")

echo "  Tools deployed: $TOOL_COUNT/8"
echo "  Agents deployed: $AGENT_COUNT/5"

if [ "$TOOL_COUNT" = "8" ] && [ "$AGENT_COUNT" = "5" ]; then
    echo "✅ Deployment verified successfully"
else
    echo "⚠️  Deployment counts don't match expected values"
    echo "    Expected: 8 tools, 5 agents"
    echo "    Check logs above for errors"
fi

echo ""
echo "=================================================="
echo "🎉 Elasticsearch setup complete!"
echo ""
echo "Next steps:"
echo "  1) Clean reload (optional): set CLEAN_LOAD=true to drop indices before load"
echo "     CLEAN_LOAD=true ./scripts/setup-elasticsearch.sh"
echo "  2) Load-only (skip generation): set LOAD_ONLY=true to just load generated_data/*.json"
echo "     LOAD_ONLY=true ./scripts/setup-elasticsearch.sh"
echo "  3) Deploy to GCP: ./scripts/deploy-to-gcp.sh"
echo "  4) Or deploy everything: ./scripts/deploy-everything.sh"
echo ""

