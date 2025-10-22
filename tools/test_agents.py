#!/usr/bin/env python3
"""Test all game agents after refactoring"""
import os
import json
import requests
import time
from typing import Dict, Any

KIBANA_URL = os.getenv("KIBANA_URL")
KIBANA_API_KEY = os.getenv("KIBANA_API_KEY")

HEADERS = {
    "Authorization": f"ApiKey {KIBANA_API_KEY}",
    "kbn-xsrf": "true",
    "Content-Type": "application/json"
}

# Test scenarios for each agent
AGENT_TESTS = {
    "budget_master": {
        "name": "Budget Master",
        "queries": [
            "I need to shop on a tight budget. Can you help me find cheap items?",
            "What are the best deals available right now?",
            "Show me budget-friendly vegetables"
        ]
    },
    "health_guru": {
        "name": "Health Guru",
        "queries": [
            "I'm looking for healthy, nutritious food options",
            "What items are high in protein and low in sugar?",
            "I need gluten-free options"
        ]
    },
    "gourmet_chef": {
        "name": "Gourmet Chef",
        "queries": [
            "I want to make a gourmet Italian dinner. What premium ingredients do you recommend?",
            "Show me the finest cheeses available",
            "What recipe ingredients would you suggest for a special meal?"
        ]
    },
    "speed_shopper": {
        "name": "Speed Shopper",
        "queries": [
            "I need to shop quickly. What are the most popular items?",
            "Give me quick recommendations for a weekly grocery run",
            "What's the fastest way to fill my cart?"
        ]
    },
    "local_expert": {
        "name": "Vegas Local Expert",
        "queries": [
            "Where are the best grocery stores in Las Vegas?",
            "What local stores have the best selection?",
            "Which stores are closest to the Strip?"
        ]
    }
}

def test_agent(agent_id: str, agent_info: Dict[str, Any]) -> bool:
    """Test an agent with multiple queries"""
    print(f"\n{'='*60}")
    print(f"Testing: {agent_info['name']} ({agent_id})")
    print('='*60)
    
    all_passed = True
    conversation_id = None
    
    for i, query in enumerate(agent_info['queries'], 1):
        print(f"\n  Query {i}: {query}")
        
        # Prepare payload
        payload = {
            "input": query,
            "agent_id": agent_id
        }
        
        # Include conversation_id for follow-up queries
        if conversation_id:
            payload["conversation_id"] = conversation_id
        
        # Send message using converse endpoint
        try:
            response = requests.post(
                f"{KIBANA_URL}/api/agent_builder/converse",
                headers=HEADERS,
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                error_text = response.text if len(response.text) < 200 else response.text[:200] + "..."
                print(f"    ❌ Request failed: {response.status_code}")
                print(f"       {error_text}")
                all_passed = False
                continue
            
            result = response.json()
            
            # Extract conversation_id for follow-up queries
            if 'conversation_id' in result:
                conversation_id = result['conversation_id']
            
            # Get response text
            response_text = str(result.get('response', result.get('output', '')))
            
            if response_text and response_text != '':
                # Truncate for display
                preview = response_text[:150].replace('\n', ' ')
                if len(response_text) > 150:
                    preview += "..."
                print(f"    ✅ Response: {preview}")
                
                # Check if tools were used
                if 'steps' in result:
                    tools_used = [step.get('tool', {}).get('name', 'unknown') 
                                for step in result.get('steps', []) 
                                if 'tool' in step]
                    if tools_used:
                        print(f"       🔧 Tools used: {', '.join(tools_used[:3])}")
            else:
                print(f"    ❌ No response received")
                all_passed = False
            
        except Exception as e:
            print(f"    ❌ Error: {str(e)}")
            all_passed = False
        
        time.sleep(1)  # Rate limiting
    
    return all_passed

def main():
    print("🧪 Testing All Game Agents After Refactoring")
    print(f"Target: {KIBANA_URL}")
    
    results = {}
    
    for agent_id, agent_info in AGENT_TESTS.items():
        passed = test_agent(agent_id, agent_info)
        results[agent_id] = passed
    
    # Summary
    print(f"\n\n{'='*60}")
    print("📊 TEST SUMMARY")
    print('='*60)
    
    for agent_id, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"  {AGENT_TESTS[agent_id]['name']}: {status}")
    
    all_passed = all(results.values())
    
    print(f"\n{'='*60}")
    if all_passed:
        print("🎉 ALL AGENTS TESTED SUCCESSFULLY!")
        print("✅ Refactoring verification complete")
    else:
        print("⚠️  Some agents had issues - review above")
    print('='*60)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit(main())

