#!/bin/bash
set -e

echo "🚀 Deploying Agent Builder Tools and Agents"
echo "=" | awk '{s=$0; while(length(s)<60) s=s$0; print s}'

# Environment variables (set by setup-host-1)
KIBANA_URL="${KIBANA_URL_UI:-http://kubernetes-vm:30001}"
KIBANA_API_KEY="${ELASTICSEARCH_APIKEY}"

if [[ -z "$KIBANA_URL" ]] || [[ -z "$KIBANA_API_KEY" ]]; then
    echo "❌ Missing required environment variables"
    echo "KIBANA_URL: ${KIBANA_URL:-not set}"
    echo "KIBANA_API_KEY: ${KIBANA_API_KEY:+set}"
    exit 1
fi

echo "📡 Target Kibana: ${KIBANA_URL}"
echo ""

# Set up paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFINITIONS_DIR="${SCRIPT_DIR}/definitions"

# Install elastic-grocery-core if not available
if ! python3 -c "import elastic_grocery_core" 2>/dev/null; then
    echo "📦 Installing elastic-grocery-core..."
    
    # Check if we have the local source
    GROCERY_CORE_PATH="/workspace/grocery/elastic-grocery-core"
    if [[ -d "$GROCERY_CORE_PATH" ]]; then
        echo "  Using local source from ${GROCERY_CORE_PATH}"
        pip3 install -q "$GROCERY_CORE_PATH"
    else
        echo "  ⚠️  Local source not found, trying system python..."
        # Try to use venv if available
        if [[ -d "/workspace/grocery/venv" ]]; then
            source /workspace/grocery/venv/bin/activate
        fi
    fi
    
    # Verify installation
    if ! python3 -c "import elastic_grocery_core" 2>/dev/null; then
        echo "❌ Failed to install elastic-grocery-core"
        exit 1
    fi
    echo "  ✅ Installed"
fi

# Deploy base tools
echo ""
echo "🔧 Deploying Base Tools..."
echo "-" | awk '{s=$0; while(length(s)<60) s=s$0; print s}'

python3 - <<'DEPLOY_TOOLS'
import asyncio
import json
import os
import sys
from pathlib import Path

from elastic_grocery_core.agent_builder import AgentBuilderClient

async def deploy_tools():
    kibana_url = os.getenv('KIBANA_URL')
    api_key = os.getenv('KIBANA_API_KEY')
    
    definitions_dir = Path(os.getenv('DEFINITIONS_DIR', './definitions'))
    tools_file = definitions_dir / 'base_tools.json'
    
    if not tools_file.exists():
        print(f'❌ Base tools file not found: {tools_file}')
        return False
    
    with open(tools_file) as f:
        base_tools = json.load(f)
    
    print(f'📋 Loaded {len(base_tools)} base tool definitions')
    
    deployed_tools = []
    failed_tools = []
    
    async with AgentBuilderClient(kibana_url, api_key) as client:
        for tool in base_tools:
            tool_id = tool['id']
            try:
                tool_def = {k: v for k, v in tool.items() if k not in ['created_at', 'updated_at', 'readonly']}
                await client.create_tool(tool_def)
                deployed_tools.append(tool_id)
                print(f'  ✅ {tool_id}')
            except Exception as e:
                # Tool might already exist, that's OK
                if 'already exists' in str(e).lower() or 'conflict' in str(e).lower():
                    print(f'  ℹ️  {tool_id} (already exists)')
                    deployed_tools.append(tool_id)
                else:
                    failed_tools.append((tool_id, str(e)))
                    print(f'  ❌ {tool_id}: {str(e)[:80]}')
    
    print(f'\n✅ Deployed {len(deployed_tools)}/{len(base_tools)} tools')
    return len(failed_tools) == 0

if __name__ == '__main__':
    success = asyncio.run(deploy_tools())
    sys.exit(0 if success else 1)
DEPLOY_TOOLS

TOOLS_RESULT=$?

# Deploy game agents
echo ""
echo "🤖 Deploying Game Agents..."
echo "-" | awk '{s=$0; while(length(s)<60) s=s$0; print s}'

python3 - <<'DEPLOY_AGENTS'
import asyncio
import json
import os
import sys
from pathlib import Path

from elastic_grocery_core.agent_builder import AgentBuilderClient

async def deploy_agents():
    kibana_url = os.getenv('KIBANA_URL')
    api_key = os.getenv('KIBANA_API_KEY')
    
    definitions_dir = Path(os.getenv('DEFINITIONS_DIR', './definitions'))
    agents_file = definitions_dir / 'game_agents.json'
    
    if not agents_file.exists():
        print(f'❌ Game agents file not found: {agents_file}')
        return False
    
    with open(agents_file) as f:
        game_agents = json.load(f)
    
    print(f'📋 Loaded {len(game_agents)} game agent definitions')
    
    deployed_agents = []
    failed_agents = []
    
    async with AgentBuilderClient(kibana_url, api_key) as client:
        for agent in game_agents:
            agent_id = agent['id']
            try:
                agent_def = {k: v for k, v in agent.items() if k not in ['created_at', 'updated_at', 'readonly', 'type']}
                await client.create_agent(agent_def)
                deployed_agents.append(agent_id)
                print(f'  ✅ {agent_id}')
            except Exception as e:
                # Agent might already exist, that's OK
                if 'already exists' in str(e).lower() or 'conflict' in str(e).lower():
                    print(f'  ℹ️  {agent_id} (already exists)')
                    deployed_agents.append(agent_id)
                else:
                    failed_agents.append((agent_id, str(e)))
                    print(f'  ❌ {agent_id}: {str(e)[:80]}')
    
    print(f'\n✅ Deployed {len(deployed_agents)}/{len(game_agents)} agents')
    return len(failed_agents) == 0

if __name__ == '__main__':
    success = asyncio.run(deploy_agents())
    sys.exit(0 if success else 1)
DEPLOY_AGENTS

AGENTS_RESULT=$?

# Summary
echo ""
echo "=" | awk '{s=$0; while(length(s)<60) s=s$0; print s}'
echo "📊 Deployment Summary"
echo "=" | awk '{s=$0; while(length(s)<60) s=s$0; print s}'

if [[ $TOOLS_RESULT -eq 0 ]] && [[ $AGENTS_RESULT -eq 0 ]]; then
    echo "🎉 All tools and agents deployed successfully!"
    exit 0
else
    echo "⚠️  Some deployments failed"
    [[ $TOOLS_RESULT -ne 0 ]] && echo "  - Tools: FAILED"
    [[ $AGENTS_RESULT -ne 0 ]] && echo "  - Agents: FAILED"
    exit 1
fi

