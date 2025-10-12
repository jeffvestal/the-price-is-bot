#!/bin/bash
# Verify The Price is Bot deployment status

echo "🔍 Verifying The Price is Bot 🤖 Deployment..."
echo ""

# Check for required environment variables
if [ -z "$KIBANA_URL" ] || [ -z "$KIBANA_API_KEY" ]; then
    echo "❌ Missing required environment variables!"
    echo "Please set:"
    echo "  export KIBANA_URL='https://your-kibana.kb.cloud.es.io'"
    echo "  export KIBANA_API_KEY='your_kibana_api_key'"
    exit 1
fi

echo "📡 Target: $KIBANA_URL"
echo ""

# Check tools (should be 8 base tools from elastic-grocery-core)
echo "🔧 Checking Base Tools..."
TOOL_COUNT=$(curl -s "${KIBANA_URL}/api/agent_builder/tools" \
  -H "Authorization: ApiKey ${KIBANA_API_KEY}" \
  -H "kbn-xsrf: true" 2>/dev/null | \
  jq '[.results[] | select(.readonly == false)] | length' 2>/dev/null)

if [ "$TOOL_COUNT" = "8" ]; then
    echo "  ✅ 8/8 base tools deployed"
else
    echo "  ❌ Expected 8 tools, found $TOOL_COUNT"
fi

# Check agents (should be 5 game agents)
echo "🤖 Checking Game Agents..."
AGENT_COUNT=$(curl -s "${KIBANA_URL}/api/agent_builder/agents" \
  -H "Authorization: ApiKey ${KIBANA_API_KEY}" \
  -H "kbn-xsrf: true" 2>/dev/null | \
  jq '[.results[] | select(.readonly == false)] | length' 2>/dev/null)

if [ "$AGENT_COUNT" = "5" ]; then
    echo "  ✅ 5/5 game agents deployed"
else
    echo "  ❌ Expected 5 agents, found $AGENT_COUNT"
fi

# Verify critical tool fix
echo "🔍 Checking Critical Fixes..."
CHECK_STORE_QUERY=$(curl -s "${KIBANA_URL}/api/agent_builder/tools" \
  -H "Authorization: ApiKey ${KIBANA_API_KEY}" \
  -H "kbn-xsrf: true" 2>/dev/null | \
  jq -r '.results[] | select(.id == "check_store_inventory") | .configuration.query' 2>/dev/null)

if echo "$CHECK_STORE_QUERY" | grep -q "name: ?item_query OR item_id: ?item_query"; then
    echo "  ✅ check_store_inventory tool has correct query (searches by name OR id)"
else
    echo "  ❌ check_store_inventory tool query is incorrect"
fi

# Summary
echo ""
echo "=" | tr '=' '-' | head -c 60
echo ""
if [ "$TOOL_COUNT" = "8" ] && [ "$AGENT_COUNT" = "5" ]; then
    echo "🎉 Deployment verified successfully!"
    echo ""
    echo "Components deployed:"
    echo "  • 8 base grocery tools (from elastic-grocery-core)"
    echo "  • 5 game personality agents (Budget Master, Health Guru, etc.)"
    exit 0
else
    echo "⚠️  Deployment incomplete or incorrect"
    echo "Expected: 8 tools + 5 agents"
    echo "Found: $TOOL_COUNT tools + $AGENT_COUNT agents"
    exit 1
fi
