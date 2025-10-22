#!/bin/bash
# Test all game agents with Agent Builder API

# Check for required environment variables
if [ -z "$KIBANA_URL" ] || [ -z "$KIBANA_API_KEY" ]; then
    echo "❌ Missing required environment variables!"
    echo "Please set:"
    echo "  export KIBANA_URL='https://your-kibana.kb.cloud.es.io'"
    echo "  export KIBANA_API_KEY='your_kibana_api_key'"
    exit 1
fi

# Activate venv if available
if [ -f "../venv/bin/activate" ]; then
    source ../venv/bin/activate
fi

# Run agent tests
python3 tools/test_agents.py

