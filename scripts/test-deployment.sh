#!/bin/bash
# Test deployment of The Price is Bot
# Runs smoke tests on deployed services

echo "🧪 Testing The Price is Bot Deployment"
echo "=================================================="
echo ""

# Load GCP configuration
if [ -f ".env.gcp" ]; then
    export $(cat .env.gcp | grep -v '^#' | xargs)
fi

GCP_REGION=${GCP_REGION:-us-central1}
GCP_PROJECT=${GCP_PROJECT:-}

if [ -z "$GCP_PROJECT" ]; then
    echo "⚠️  GCP_PROJECT not set, skipping Cloud Run tests"
    echo "   Set it in .env.gcp to test deployed services"
    SKIP_GCP=true
else
    SKIP_GCP=false
fi

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    echo -n "Testing $name... "
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "$expected_code" ]; then
        echo "✅ PASS (HTTP $HTTP_CODE)"
        ((TESTS_PASSED++))
        return 0
    else
        echo "❌ FAIL (HTTP $HTTP_CODE, expected $expected_code)"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Get Cloud Run service URLs
if [ "$SKIP_GCP" = false ]; then
    echo "Fetching Cloud Run service URLs..."
    
    GAME_UI_URL=$(gcloud run services describe price-is-bot-game-ui \
        --platform=managed \
        --region=$GCP_REGION \
        --project=$GCP_PROJECT \
        --format='value(status.url)' 2>/dev/null)
    
    BACKEND_URL=$(gcloud run services describe price-is-bot-backend \
        --platform=managed \
        --region=$GCP_REGION \
        --project=$GCP_PROJECT \
        --format='value(status.url)' 2>/dev/null)
    
    LEADERBOARD_URL=$(gcloud run services describe price-is-bot-leaderboard-api \
        --platform=managed \
        --region=$GCP_REGION \
        --project=$GCP_PROJECT \
        --format='value(status.url)' 2>/dev/null)
    
    echo ""
    echo "Service URLs:"
    echo "  Game UI:         ${GAME_UI_URL:-Not found}"
    echo "  Backend:         ${BACKEND_URL:-Not found}"
    echo "  Leaderboard API: ${LEADERBOARD_URL:-Not found}"
    echo ""
fi

# Run tests
echo "Running tests..."
echo ""

if [ "$SKIP_GCP" = false ]; then
    # Test 1: Game UI loads
    if [ -n "$GAME_UI_URL" ]; then
        test_endpoint "Game UI homepage" "$GAME_UI_URL"
    fi
    
    # Test 2: Backend health check
    if [ -n "$BACKEND_URL" ]; then
        test_endpoint "Backend health" "$BACKEND_URL/health"
    fi
    
    # Test 3: Leaderboard API health check
    if [ -n "$LEADERBOARD_URL" ]; then
        test_endpoint "Leaderboard API health" "$LEADERBOARD_URL/health"
    fi
    
    # Test 4: Leaderboard API settings
    if [ -n "$LEADERBOARD_URL" ]; then
        test_endpoint "Leaderboard settings" "$LEADERBOARD_URL/api/settings"
    fi
    
    # Test 5: Leaderboard API leaderboard endpoint
    if [ -n "$LEADERBOARD_URL" ]; then
        test_endpoint "Leaderboard endpoint" "$LEADERBOARD_URL/api/leaderboard"
    fi
else
    echo "⚠️  Skipping Cloud Run tests (GCP_PROJECT not set)"
fi

# Test Kibana deployment (if credentials available)
if [ -f ".env.kibana" ]; then
    export $(cat .env.kibana | grep -v '^#' | xargs)
    
    if [ -n "$KIBANA_URL" ] && [ -n "$KIBANA_API_KEY" ]; then
        echo ""
        echo "Testing Kibana Agent Builder..."
        
        # Test tools count
        TOOL_COUNT=$(curl -s "${KIBANA_URL}/api/agent_builder/tools" \
            -H "Authorization: ApiKey ${KIBANA_API_KEY}" \
            -H "kbn-xsrf: true" 2>/dev/null | \
            python3 -c "import sys, json; data = json.load(sys.stdin); print(len([t for t in data.get('results', []) if not t.get('readonly', False)]))" 2>/dev/null || echo "0")
        
        if [ "$TOOL_COUNT" = "8" ]; then
            echo "  ✅ Tools deployed: $TOOL_COUNT/8"
            ((TESTS_PASSED++))
        else
            echo "  ❌ Tools deployed: $TOOL_COUNT/8 (expected 8)"
            ((TESTS_FAILED++))
        fi
        
        # Test agents count
        AGENT_COUNT=$(curl -s "${KIBANA_URL}/api/agent_builder/agents" \
            -H "Authorization: ApiKey ${KIBANA_API_KEY}" \
            -H "kbn-xsrf: true" 2>/dev/null | \
            python3 -c "import sys, json; data = json.load(sys.stdin); print(len([a for a in data.get('results', []) if not a.get('readonly', False)]))" 2>/dev/null || echo "0")
        
        if [ "$AGENT_COUNT" = "5" ]; then
            echo "  ✅ Agents deployed: $AGENT_COUNT/5"
            ((TESTS_PASSED++))
        else
            echo "  ❌ Agents deployed: $AGENT_COUNT/5 (expected 5)"
            ((TESTS_FAILED++))
        fi
    fi
fi

# Test summary
echo ""
echo "=================================================="
echo "Test Results:"
echo "  ✅ Passed: $TESTS_PASSED"
echo "  ❌ Failed: $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "⚠️  Some tests failed. Check the logs above for details."
    exit 1
fi

