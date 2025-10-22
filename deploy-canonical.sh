#!/bin/bash
# Deploy base tools and game agents for The Price is Bot

echo "🚀 Deploying The Price is Bot 🤖 Game Components..."
echo ""

# Check for required environment variables
if [ -z "$KIBANA_URL" ] || [ -z "$KIBANA_API_KEY" ]; then
    echo "❌ Missing required environment variables!"
    echo "Please set:"
    echo "  export KIBANA_URL='https://your-kibana.kb.cloud.es.io'"
    echo "  export KIBANA_API_KEY='your_kibana_api_key'"
    echo ""
    echo "Then run: ./deploy-canonical.sh"
    exit 1
fi

echo "📡 Target: $KIBANA_URL"
echo ""

# Step 1: Deploy base tools from elastic-grocery-core
echo "🔧 Step 1: Deploying base grocery tools from elastic-grocery-core..."
python3 ../elastic-grocery-core/scripts/deploy_base_tools.py "$@"

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy base tools"
    exit 1
fi

echo ""

# Step 2: Deploy game-specific agents
echo "🤖 Step 2: Deploying game agents..."
python3 scripts/deploy_game.py "$@"

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy game agents"
    exit 1
fi

echo ""
echo "=" | tr '=' '-' | head -c 60
echo ""
echo "🎉 The Price is Bot 🤖 deployment complete!"
echo ""
echo "Next steps:"
echo "  1. Verify deployment: ./verify-deployment.sh"
echo "  2. Start game UI: ./run-game-ui.sh"
echo "  3. Start leaderboard API: ./run-leaderboard-api.sh"
echo ""
