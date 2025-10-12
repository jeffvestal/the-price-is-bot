#!/usr/bin/env python3
"""
Deploy game-specific agents for The Price is Bot game.
Assumes base tools have already been deployed from elastic-grocery-core.
"""

import asyncio
import json
import os
import sys
from pathlib import Path

# Import from elastic-grocery-core (must be installed)
try:
    from elastic_grocery_core.agent_builder import AgentBuilderClient
except ImportError:
    print('❌ Error: elastic-grocery-core not installed')
    print('Install with: pip install git+https://github.com/elastic/elastic-grocery-core.git')
    sys.exit(1)

async def deploy_game_agents(delete_existing=False):
    """Deploy game-specific shopping agents."""
    
    print('🚀 Deploying Elasti-Cart Game Agents')
    print('=' * 60)
    
    # Get environment variables
    kibana_url = os.getenv('KIBANA_URL')
    api_key = os.getenv('KIBANA_API_KEY')
    
    if not kibana_url or not api_key:
        print('❌ Missing KIBANA_URL or KIBANA_API_KEY environment variables')
        print('Please set these environment variables before running:')
        print('export KIBANA_URL="your_kibana_url"')
        print('export KIBANA_API_KEY="your_api_key"')
        return False
    
    print(f'📡 Target: {kibana_url}')
    print()
    
    # Load game agent definitions
    definitions_dir = Path(__file__).parent.parent / 'definitions'
    agents_file = definitions_dir / 'game_agents.json'
    
    if not agents_file.exists():
        print(f'❌ Game agents file not found: {agents_file}')
        return False
    
    with open(agents_file) as f:
        game_agents = json.load(f)
    
    print(f'📋 Loaded {len(game_agents)} game agent definitions')
    print()
    
    async with AgentBuilderClient(kibana_url, api_key) as client:
        
        # Delete existing agents if requested
        if delete_existing:
            print('🗑️  Deleting existing game agents...')
            for agent in game_agents:
                try:
                    await client.delete_agent(agent['id'])
                    print(f'  ✅ Deleted agent: {agent["id"]}')
                except Exception as e:
                    print(f'  ℹ️  Could not delete {agent["id"]}: {str(e)[:50]}')
            print()
        
        # Deploy agents
        print('🤖 Deploying Game Agents...')
        print('-' * 60)
        deployed_agents = []
        failed_agents = []
        
        for agent in game_agents:
            agent_id = agent['id']
            try:
                # Remove fields that shouldn't be in create request
                agent_def = {k: v for k, v in agent.items() if k not in ['created_at', 'updated_at', 'readonly', 'type']}
                
                result = await client.create_agent(agent_def)
                deployed_agents.append(agent_id)
                print(f'  ✅ {agent_id}')
            except Exception as e:
                failed_agents.append((agent_id, str(e)))
                print(f'  ❌ {agent_id}: {str(e)[:80]}')
        
        print()
        print(f'✅ Successfully deployed {len(deployed_agents)}/{len(game_agents)} agents')
        if failed_agents:
            print(f'❌ Failed to deploy {len(failed_agents)} agents')
        print()
        
        # Summary
        print('=' * 60)
        print('📊 Deployment Summary')
        print('=' * 60)
        print(f'Agents: {len(deployed_agents)}/{len(game_agents)} deployed')
        
        if failed_agents:
            print('\n❌ Failed Agents:')
            for agent_id, error in failed_agents:
                print(f'  - {agent_id}: {error[:100]}')
        
        success = len(failed_agents) == 0
        
        if success:
            print('\n🎉 All game agents deployed successfully!')
            print('\nℹ️  Note: Make sure base tools are deployed from elastic-grocery-core')
        else:
            print('\n⚠️  Some agents failed to deploy')
        
        return success

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Deploy game agents for The Price is Bot'
    )
    parser.add_argument(
        '--delete-existing',
        action='store_true',
        help='Delete existing agents before deploying'
    )
    
    args = parser.parse_args()
    
    success = asyncio.run(deploy_game_agents(
        delete_existing=args.delete_existing
    ))
    
    sys.exit(0 if success else 1)

