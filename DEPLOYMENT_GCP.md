# The Price is Bot - GCP Cloud Run Deployment Guide

Complete guide for deploying The Price is Bot to Google Cloud Platform using Cloud Run.

---

## 🎯 Overview

This guide covers deploying three Cloud Run services:

1. **game-ui** (Next.js) - Player-facing game interface
2. **backend** (FastAPI) - Game logic, scoring, Socket.IO
3. **leaderboard-api** (FastAPI) - Admin panel, access codes, leaderboard

**Deployment Architecture:**
- All services on GCP Cloud Run (serverless)
- Secrets managed in GCP Secret Manager
- Docker images stored in Artifact Registry
- Connects to your existing Elasticsearch cluster

---

## 📋 Prerequisites

### Required Accounts & Services
- ✅ Google Cloud Platform account with billing enabled
- ✅ Elasticsearch cluster (8.15+) with data
- ✅ Kibana with Agent Builder enabled
- ✅ Docker installed locally (for building images)
- ✅ gcloud CLI installed and configured

### Required Tools
```bash
# Install gcloud CLI (if not already installed)
# https://cloud.google.com/sdk/docs/install

# Install Docker
# https://docs.docker.com/get-docker/

# Verify installations
gcloud --version
docker --version
python --version  # Need Python 3.9+
node --version    # Need Node.js 18+
```

### GCP Project Setup
```bash
# Create a new GCP project (or use existing)
gcloud projects create your-project-id --name="The Price is Bot"

# Set as active project
gcloud config set project your-project-id

# Enable billing (required for Cloud Run)
# Do this via GCP Console: https://console.cloud.google.com/billing
```

---

## 🔧 Step 1: Environment Configuration

### 1.1 Copy Environment Templates
```bash
cd /path/to/the-price-is-bot

cp .env.elasticsearch.example .env.elasticsearch
cp .env.kibana.example .env.kibana
cp .env.gcp.example .env.gcp
cp .env.secrets.example .env.secrets
```

### 1.2 Configure Elasticsearch
Edit `.env.elasticsearch`:
```bash
ES_URL=https://your-cluster.es.cloud.es.io:443
ES_API_KEY=your_elasticsearch_api_key_here
```

### 1.3 Configure Kibana
Edit `.env.kibana`:
```bash
KIBANA_URL=https://your-cluster.kb.cloud.es.io
KIBANA_API_KEY=your_kibana_api_key_here
```

### 1.4 Configure GCP
Edit `.env.gcp`:
```bash
GCP_PROJECT=your-gcp-project-id
GCP_REGION=us-central1
ARTIFACT_REGISTRY_LOCATION=us-central1
ARTIFACT_REGISTRY_REPO=price-is-bot
```

### 1.5 Generate Secrets
Edit `.env.secrets`:
```bash
# Generate secret keys
SECRET_KEY=$(openssl rand -base64 32)
ADMIN_TOKEN=$(openssl rand -base64 32)

# Add to .env.secrets
echo "SECRET_KEY=$SECRET_KEY" > .env.secrets
echo "ADMIN_TOKEN=$ADMIN_TOKEN" >> .env.secrets
```

---

## 🚀 Step 2: One-Command Deployment

### Option A: Deploy Everything from Scratch
```bash
# This will:
# 1. Install elastic-grocery-core
# 2. Generate grocery data in Elasticsearch
# 3. Deploy tools and agents to Kibana
# 4. Build and deploy to GCP Cloud Run
# 5. Run verification tests

./scripts/deploy-everything.sh
```

### Option B: Deploy in Steps

#### 2.1 Setup Elasticsearch (Data + Agents)
```bash
# Generate data and deploy agents
./scripts/setup-elasticsearch.sh

# This creates:
# - 5000 grocery items
# - 10 store locations
# - Inventory data
# - 8 base tools
# - 5 game agents
```

#### 2.2 Deploy to GCP
```bash
# Build images and deploy to Cloud Run
./scripts/deploy-to-gcp.sh

# This will:
# - Enable required GCP APIs
# - Create Artifact Registry
# - Setup Secret Manager
# - Build 3 Docker images
# - Push to Artifact Registry
# - Deploy 3 Cloud Run services
```

#### 2.3 Verify Deployment
```bash
# Run smoke tests
./scripts/test-deployment.sh

# Tests:
# - Service health checks
# - Agent Builder connectivity
# - Leaderboard API
# - Tool and agent counts
```

---

## 📦 Step 3: Manual Deployment (Alternative)

If you prefer manual control:

### 3.1 Install Dependencies
```bash
# Install Python dependencies (includes elastic-grocery-core)
pip install -r requirements.txt

# Install game-ui dependencies
cd game-ui
npm install
cd ..
```

### 3.2 Setup GCP Infrastructure
```bash
# Set your project
export GCP_PROJECT=your-project-id
gcloud config set project $GCP_PROJECT

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Create Artifact Registry repository
gcloud artifacts repositories create price-is-bot \
    --repository-format=docker \
    --location=us-central1 \
    --project=$GCP_PROJECT
```

### 3.3 Create Secrets
```bash
# Load environment variables
source .env.elasticsearch
source .env.kibana
source .env.secrets

# Create secrets
echo -n "$ES_URL" | gcloud secrets create elasticsearch-url --data-file=- --replication-policy=automatic
echo -n "$ES_API_KEY" | gcloud secrets create elasticsearch-api-key --data-file=- --replication-policy=automatic
echo -n "$KIBANA_URL" | gcloud secrets create kibana-url --data-file=- --replication-policy=automatic
echo -n "$KIBANA_API_KEY" | gcloud secrets create kibana-api-key --data-file=- --replication-policy=automatic
echo -n "$SECRET_KEY" | gcloud secrets create jwt-secret-key --data-file=- --replication-policy=automatic
echo -n "$ADMIN_TOKEN" | gcloud secrets create admin-token --data-file=- --replication-policy=automatic
```

### 3.4 Build and Push Images
```bash
# Configure Docker for Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build images
docker build -t us-central1-docker.pkg.dev/$GCP_PROJECT/price-is-bot/backend:latest ./backend
docker build -t us-central1-docker.pkg.dev/$GCP_PROJECT/price-is-bot/leaderboard-api:latest ./leaderboard-api
docker build -t us-central1-docker.pkg.dev/$GCP_PROJECT/price-is-bot/game-ui:latest ./game-ui

# Push images
docker push us-central1-docker.pkg.dev/$GCP_PROJECT/price-is-bot/backend:latest
docker push us-central1-docker.pkg.dev/$GCP_PROJECT/price-is-bot/leaderboard-api:latest
docker push us-central1-docker.pkg.dev/$GCP_PROJECT/price-is-bot/game-ui:latest
```

### 3.5 Deploy Services
```bash
# Deploy backend
gcloud run deploy price-is-bot-backend \
    --image=us-central1-docker.pkg.dev/$GCP_PROJECT/price-is-bot/backend:latest \
    --region=us-central1 \
    --allow-unauthenticated \
    --port=8080 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --set-secrets=ELASTICSEARCH_HOST=elasticsearch-url:latest,ELASTICSEARCH_API_KEY=elasticsearch-api-key:latest,SECRET_KEY=jwt-secret-key:latest,ADMIN_TOKEN=admin-token:latest

# Deploy leaderboard-api
gcloud run deploy price-is-bot-leaderboard-api \
    --image=us-central1-docker.pkg.dev/$GCP_PROJECT/price-is-bot/leaderboard-api:latest \
    --region=us-central1 \
    --allow-unauthenticated \
    --port=8080 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --set-secrets=ELASTICSEARCH_URL=elasticsearch-url:latest,ELASTICSEARCH_API_KEY=elasticsearch-api-key:latest

# Get backend and leaderboard URLs
BACKEND_URL=$(gcloud run services describe price-is-bot-backend --region=us-central1 --format='value(status.url)')
LEADERBOARD_URL=$(gcloud run services describe price-is-bot-leaderboard-api --region=us-central1 --format='value(status.url)')

# Deploy game-ui (needs backend URLs)
gcloud run deploy price-is-bot-game-ui \
    --image=us-central1-docker.pkg.dev/$GCP_PROJECT/price-is-bot/game-ui:latest \
    --region=us-central1 \
    --allow-unauthenticated \
    --port=8080 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=1 \
    --max-instances=10 \
    --set-env-vars=NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL,NEXT_PUBLIC_LEADERBOARD_URL=$LEADERBOARD_URL \
    --set-secrets=KIBANA_URL=kibana-url:latest,KIBANA_API_KEY=kibana-api-key:latest
```

---

## 🧪 Step 4: Testing

### 4.1 Get Service URLs
```bash
gcloud run services list --region=us-central1

# Or individually
gcloud run services describe price-is-bot-game-ui --region=us-central1 --format='value(status.url)'
gcloud run services describe price-is-bot-backend --region=us-central1 --format='value(status.url)'
gcloud run services describe price-is-bot-leaderboard-api --region=us-central1 --format='value(status.url)'
```

### 4.2 Test Services
```bash
# Run automated tests
./scripts/test-deployment.sh

# Manual tests
GAME_UI_URL=https://price-is-bot-game-ui-XXXXX-uc.a.run.app

# Test game UI
curl $GAME_UI_URL

# Test backend health
curl https://price-is-bot-backend-XXXXX-uc.a.run.app/health

# Test leaderboard API
curl https://price-is-bot-leaderboard-api-XXXXX-uc.a.run.app/health
```

### 4.3 End-to-End Testing
1. Open game UI URL in browser
2. Select an agent
3. Chat with the agent
4. Select 5 items
5. Submit cart
6. Check leaderboard

---

## 📊 Monitoring & Logs

### View Logs
```bash
# Game UI logs
gcloud run services logs read price-is-bot-game-ui --region=us-central1 --limit=50

# Backend logs
gcloud run services logs read price-is-bot-backend --region=us-central1 --limit=50

# Leaderboard API logs
gcloud run services logs read price-is-bot-leaderboard-api --region=us-central1 --limit=50

# Follow logs (tail)
gcloud run services logs tail price-is-bot-game-ui --region=us-central1
```

### View Metrics
```bash
# Via Cloud Console
# https://console.cloud.google.com/run?project=your-project-id

# Check service status
gcloud run services describe price-is-bot-game-ui --region=us-central1
```

---

## 💰 Cost Management

### Estimated Monthly Costs
- **Cloud Run**: $10-30/month (with scale-to-zero)
- **Artifact Registry**: ~$1/month
- **Secret Manager**: ~$0.50/month
- **Networking**: $1-5/month

**Total: ~$15-40/month** for low-medium usage

### Cost Optimization Tips
```bash
# Set min instances to 0 for backend and leaderboard-api (already done)
# Only game-ui has min-instances=1 for better UX

# Set request timeout appropriately
--timeout=60s  # game-ui
--timeout=300s # backend (needs more for Socket.IO)

# Use CPU allocation only during requests
--cpu-throttling  # Default behavior

# Set max instances to prevent runaway costs
--max-instances=10  # Already set
```

### Monitor Costs
- GCP Billing Dashboard: https://console.cloud.google.com/billing
- Set budget alerts
- Enable cost breakdown by service

---

## 🔐 Security Best Practices

### 1. Secret Management
- ✅ All credentials in Secret Manager (not environment variables)
- ✅ Secrets have automatic replication
- ✅ Use latest version for auto-updates

### 2. IAM Permissions
```bash
# Principle of least privilege
# Cloud Run service accounts should only have necessary permissions

# Grant Secret Manager access to Cloud Run service accounts
gcloud projects add-iam-policy-binding $GCP_PROJECT \
    --member=serviceAccount:$(gcloud run services describe price-is-bot-backend --region=us-central1 --format='value(spec.template.spec.serviceAccountName)') \
    --role=roles/secretmanager.secretAccessor
```

### 3. Network Security
- Allow-unauthenticated is set for public access
- For private services, use Cloud Run authentication
- Consider Cloud Armor for DDoS protection (production)

### 4. Regular Updates
```bash
# Rotate secrets periodically
./scripts/rotate-secrets.sh  # Create this script

# Update Docker base images regularly
docker pull python:3.12-slim
docker pull node:18-alpine

# Redeploy with new images
./scripts/deploy-to-gcp.sh
```

---

## 🔄 Updates & Redeployment

### Update Code Only
```bash
# Make your code changes, then:
./scripts/deploy-to-gcp.sh

# This rebuilds images and redeploys all services
```

### Update Agents or Tools
```bash
# Edit definitions/game_agents.json or elastic-grocery-core tools
./scripts/setup-elasticsearch.sh --delete-existing

# No need to redeploy GCP services
```

### Update Secrets
```bash
# Update secret in Secret Manager
echo -n "new_secret_value" | gcloud secrets versions add secret-name --data-file=-

# Redeploy service to pick up new secret
gcloud run services update-traffic price-is-bot-backend --region=us-central1 --to-latest
```

### Rollback
```bash
# List revisions
gcloud run revisions list --service=price-is-bot-backend --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic price-is-bot-backend \
    --region=us-central1 \
    --to-revisions=price-is-bot-backend-00002-abc=100
```

---

## 🐛 Troubleshooting

### Issue: Deployment fails with "Permission Denied"
**Solution:**
```bash
# Ensure you're authenticated
gcloud auth login

# Set correct project
gcloud config set project your-project-id

# Enable required APIs
gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

### Issue: Docker build fails
**Solution:**
```bash
# Check Docker is running
docker ps

# Clear Docker cache
docker system prune -a

# Rebuild with no cache
docker build --no-cache -t image-name ./path
```

### Issue: Service returns 500 errors
**Solution:**
```bash
# Check logs
gcloud run services logs read service-name --region=us-central1 --limit=100

# Common issues:
# - Missing environment variables
# - Incorrect secret references
# - Elasticsearch connection issues
```

### Issue: Agent chat doesn't work
**Solution:**
```bash
# Verify Kibana credentials in Secret Manager
gcloud secrets versions access latest --secret=kibana-url
gcloud secrets versions access latest --secret=kibana-api-key

# Test Kibana connection
curl -H "Authorization: ApiKey YOUR_KEY" https://your-kibana.kb.cloud.es.io/api/agent_builder/agents

# Check game-ui logs
gcloud run services logs read price-is-bot-game-ui --region=us-central1
```

### Issue: Leaderboard doesn't load
**Solution:**
```bash
# Verify Elasticsearch connection
curl -H "Authorization: ApiKey YOUR_KEY" https://your-es-cluster.es.cloud.es.io

# Check if indices exist
curl -H "Authorization: ApiKey YOUR_KEY" https://your-es-cluster.es.cloud.es.io/_cat/indices

# Check leaderboard-api logs
gcloud run services logs read price-is-bot-leaderboard-api --region=us-central1
```

---

## 📚 Additional Resources

- [GCP Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Artifact Registry](https://cloud.google.com/artifact-registry/docs)
- [Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Elasticsearch Cloud](https://www.elastic.co/guide/en/cloud/current/index.html)
- [Agent Builder Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/agent-builder.html)

---

## 🆘 Getting Help

1. Check logs: `./scripts/test-deployment.sh`
2. Review this guide
3. Check SCRIPTS.md for script details
4. Review DEPLOYMENT_PLAN.md for architecture

---

**Deployment Complete! 🎉**

Your game is now running on GCP Cloud Run and ready for players!

