#!/bin/bash
# Master deployment script for The Price is Bot
# Deploys everything from scratch: data, agents, and GCP services

set -e  # Exit on any error

echo "🤖 The Price is Bot - Complete Deployment"
echo "=================================================="
echo ""
echo "This script will:"
echo "  1. Install elastic-grocery-core"
echo "  2. Generate grocery data in Elasticsearch"
echo "  3. Deploy tools and agents to Kibana"
echo "  4. Build and deploy to GCP Cloud Run"
echo "  5. Run verification tests"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Step 1: Install elastic-grocery-core
echo "Step 1: Installing elastic-grocery-core..."
if [ -d "../elastic-grocery-core" ]; then
    pip install -e ../elastic-grocery-core
    echo "✅ elastic-grocery-core installed"
else
    echo "⚠️  ../elastic-grocery-core not found"
    echo "   Attempting to install from requirements.txt..."
    pip install -r requirements.txt
fi
echo ""

# Step 2: Setup Elasticsearch (data + agents)
echo "Step 2: Setting up Elasticsearch..."
./scripts/setup-elasticsearch.sh "$@"

if [ $? -ne 0 ]; then
    echo "❌ Elasticsearch setup failed"
    exit 1
fi
echo ""

# Step 3: Deploy to GCP
echo "Step 3: Deploying to GCP Cloud Run..."
./scripts/deploy-to-gcp.sh

if [ $? -ne 0 ]; then
    echo "❌ GCP deployment failed"
    exit 1
fi
echo ""

# Step 4: Run tests
echo "Step 4: Running deployment tests..."
./scripts/test-deployment.sh

if [ $? -ne 0 ]; then
    echo "⚠️  Some tests failed, but deployment may still be functional"
    echo "   Check the logs above for details"
fi
echo ""

# Summary
echo "=================================================="
echo "🎉 Complete Deployment Finished!"
echo ""
echo "Your game is now running on GCP Cloud Run."
echo "Check the service URLs above to access the game."
echo ""
echo "To redeploy:"
echo "  - Elasticsearch only: ./scripts/setup-elasticsearch.sh"
echo "  - GCP only: ./scripts/deploy-to-gcp.sh"
echo "  - Everything: ./scripts/deploy-everything.sh"
echo ""

