# The Price is Bot - GCP Quick Start

**Deploy everything in under 30 minutes!** ⚡

---

## Prerequisites

- ✅ Google Cloud Platform account
- ✅ Elasticsearch cluster with data
- ✅ Kibana with Agent Builder
- ✅ Docker and gcloud CLI installed

---

## Step 1: Configure Environment (5 minutes)

```bash
cd the-price-is-bot

# Copy templates
cp .env.elasticsearch.example .env.elasticsearch
cp .env.kibana.example .env.kibana
cp .env.gcp.example .env.gcp
cp .env.secrets.example .env.secrets

# Edit each file with your credentials
# Use your editor: vim, nano, VS Code, etc.
```

### Fill in:
- `.env.elasticsearch` → ES_URL, ES_API_KEY
- `.env.kibana` → KIBANA_URL, KIBANA_API_KEY  
- `.env.gcp` → GCP_PROJECT, GCP_REGION
- `.env.secrets` → Generate with `openssl rand -base64 32`

---

## Step 2: Deploy Everything (20-25 minutes)

```bash
./scripts/deploy-everything.sh
```

This single command:
1. ✅ Installs elastic-grocery-core
2. ✅ Generates 5000 grocery items
3. ✅ Deploys 8 tools + 5 agents
4. ✅ Builds 3 Docker images
5. ✅ Deploys to GCP Cloud Run
6. ✅ Runs verification tests

---

## Step 3: Play the Game! (< 1 minute)

After deployment completes, you'll see:

```
🎉 Deployment Complete!

Service URLs:
  🎮 Game UI:         https://price-is-bot-game-ui-XXXXX-uc.a.run.app
  🔧 Backend:         https://price-is-bot-backend-XXXXX-uc.a.run.app
  📊 Leaderboard API: https://price-is-bot-leaderboard-api-XXXXX-uc.a.run.app
```

**Open the Game UI URL and start playing!**

---

## Troubleshooting

### Deployment failed?
```bash
# Check logs
./scripts/test-deployment.sh

# View detailed logs
gcloud run services logs read price-is-bot-game-ui --region=us-central1 --limit=100
```

### Need help?
1. Check [DEPLOYMENT_GCP.md](DEPLOYMENT_GCP.md) for detailed guide
2. Review [SCRIPTS.md](SCRIPTS.md) for script reference
3. See troubleshooting section in DEPLOYMENT_GCP.md

---

## What's Deployed?

### Three Cloud Run Services:
- **game-ui** (Next.js) - Player interface
- **backend** (FastAPI) - Game logic & scoring
- **leaderboard-api** (FastAPI) - Admin & leaderboard

### In Elasticsearch:
- 5000 grocery items
- 10 store locations
- Inventory, nutrition, seasonal data
- 8 search & query tools
- 5 AI shopping agents

---

## Admin Features

### Generate Access Codes
```bash
# Get leaderboard API URL
LEADERBOARD_URL=https://price-is-bot-leaderboard-api-XXXXX-uc.a.run.app

# Generate codes (requires ADMIN_TOKEN)
curl -X POST "$LEADERBOARD_URL/admin/generate-codes" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"count": 10}'
```

### View Leaderboard
```bash
# Public leaderboard
curl "$LEADERBOARD_URL/api/leaderboard"
```

---

## Cost Estimate

**Monthly cost: $15-40** for low-medium usage

- Cloud Run (3 services): $10-30
- Artifact Registry: ~$1
- Secret Manager: ~$0.50
- Networking: $1-5

**Scale-to-zero enabled** on backend and leaderboard-api!

---

## Next Steps

### Customize the Game
- Edit agent personalities: `definitions/game_agents.json`
- Redeploy: `./scripts/deploy-to-gcp.sh`

### Monitor & Manage
- View logs: `gcloud run services logs read SERVICE_NAME --region=us-central1`
- Update code: Make changes and run `./scripts/deploy-to-gcp.sh`
- Rollback: See DEPLOYMENT_GCP.md for rollback procedures

### Add More Data
- Edit grocery data generation parameters
- Rerun: `./scripts/setup-elasticsearch.sh`

---

## Running the Deployment

### Single Command Deployment

```bash
cd /Users/jeffvestal/repos/grocery/the-price-is-bot
./scripts/deploy-everything.sh
```

### What This Script Does

**Phase 1: Elasticsearch Setup (10-15 min)**
- Installs Python dependencies
- Generates 5,000 grocery items using LLM
- Creates 10 store locations in Las Vegas
- Loads all data to Elasticsearch
- Deploys 8 base grocery tools
- Deploys 5 game agents

**Phase 2: Docker Build (3-5 min)**
- Builds backend Docker image
- Builds game-ui Docker image  
- Builds leaderboard-api Docker image
- Pushes all images to Google Artifact Registry

**Phase 3: Cloud Run Deployment (5-7 min)**
- Creates GCP secrets (ES, Kibana, JWT, admin token)
- Deploys backend service
- Deploys leaderboard-api service
- Deploys game-ui service
- Configures CORS between services
- Sets up autoscaling and health checks

**Phase 4: Verification (1-2 min)**
- Tests all service endpoints
- Verifies Elasticsearch connection
- Checks agent availability
- Validates CORS configuration

**Total Time: ~20-30 minutes**

---

## What to Check Online

### In Google Cloud Console

**1. Cloud Run Services**
- Navigate to: Cloud Run → Services
- Verify 3 services are deployed and "Healthy":
  - `price-is-bot-backend`
  - `price-is-bot-game-ui`
  - `price-is-bot-leaderboard-api`
- Check CPU/Memory: Should be within limits (1 CPU, 512Mi-2Gi RAM)
- Check Traffic: Should show 100% to latest revision

**2. Artifact Registry**
- Navigate to: Artifact Registry → Repositories → `price-is-bot`
- Verify 3 images exist:
  - `backend:latest`
  - `game-ui:latest`
  - `leaderboard-api:latest`
- Check image sizes (backend ~200MB, game-ui ~150MB, leaderboard ~100MB)

**3. Secret Manager**
- Navigate to: Secret Manager → Secrets
- Verify 6 secrets exist:
  - `elasticsearch-url`
  - `elasticsearch-api-key`
  - `kibana-url`
  - `kibana-api-key`
  - `jwt-secret-key`
  - `admin-token`
- Check "In use by" shows Cloud Run services

**4. Cloud Logging**
- Navigate to: Logging → Logs Explorer
- Filter by: `resource.type="cloud_run_revision"`
- Check for errors (should see mostly INFO logs)

### Functional Testing

**1. Game UI Loads**
```bash
# Get the Game UI URL from deployment output, then:
curl -I https://price-is-bot-game-ui-XXXXX-uc.a.run.app
# Should return: HTTP/2 200
```

**2. Create a Player Session**
- Open Game UI in browser
- Click "Start Game" or "New Player"
- Enter a username
- Verify session ID is created

**3. Agent Chat Responds**
- In the game interface, send a message to an agent
- Example: "Find me some apples"
- Should receive a response within 3-5 seconds
- Check that grocery items are returned

**4. Leaderboard Displays**
```bash
curl https://price-is-bot-leaderboard-api-XXXXX-uc.a.run.app/api/leaderboard
# Should return JSON with player scores
```

**5. Backend Health Check**
```bash
curl https://price-is-bot-backend-XXXXX-uc.a.run.app/health
# Should return: {"status":"healthy"}
```

### Common Issues

**Issue: Game UI loads but shows "Cannot connect to backend"**
- Check CORS configuration: `gcloud run services describe price-is-bot-backend --format="value(spec.template.spec.containers[0].env)"`
- Verify `CORS_ALLOWED_ORIGINS` includes the game-ui URL

**Issue: Agents don't respond**
- Check Kibana connection: Look for "KIBANA_URL" in backend logs
- Verify Agent Builder has 5 agents deployed
- Check backend logs for "Agent ID not found" errors

**Issue: 502 Bad Gateway**
- Service is likely crashed or starting up
- Check logs: `gcloud run services logs read SERVICE_NAME --limit=50`
- Common causes: Missing environment variables, out of memory

---

## Shutting Down

### Option 1: Delete All Services (Recommended for demos)

**Complete cleanup - removes everything:**

```bash
# Delete all Cloud Run services
gcloud run services delete price-is-bot-backend --region=us-central1 --quiet
gcloud run services delete price-is-bot-game-ui --region=us-central1 --quiet
gcloud run services delete price-is-bot-leaderboard-api --region=us-central1 --quiet

# Delete Docker images from Artifact Registry
gcloud artifacts docker images delete \
  us-central1-docker.pkg.dev/YOUR-PROJECT/price-is-bot/backend:latest --quiet
gcloud artifacts docker images delete \
  us-central1-docker.pkg.dev/YOUR-PROJECT/price-is-bot/game-ui:latest --quiet
gcloud artifacts docker images delete \
  us-central1-docker.pkg.dev/YOUR-PROJECT/price-is-bot/leaderboard-api:latest --quiet

# Optional: Delete secrets (if you want to start completely fresh)
gcloud secrets delete elasticsearch-url --quiet
gcloud secrets delete elasticsearch-api-key --quiet
gcloud secrets delete kibana-url --quiet
gcloud secrets delete kibana-api-key --quiet
gcloud secrets delete jwt-secret-key --quiet
gcloud secrets delete admin-token --quiet
```

**Cost after deletion: $0** (except Elasticsearch/Kibana if hosted on Elastic Cloud)

### Option 2: Scale to Zero (Pause without deleting)

**Keeps services deployed but stops billing:**

```bash
# Scale all services to 0 minimum instances
gcloud run services update price-is-bot-backend \
  --region=us-central1 \
  --min-instances=0

gcloud run services update price-is-bot-game-ui \
  --region=us-central1 \
  --min-instances=0

gcloud run services update price-is-bot-leaderboard-api \
  --region=us-central1 \
  --min-instances=0
```

**Cost when scaled to zero:**
- Cloud Run: $0 (only charged per request)
- Artifact Registry: ~$1/month (for stored images)
- Secret Manager: ~$0.50/month

**To resume:**
```bash
# Services will automatically start on first request
# Or manually scale back up:
gcloud run services update price-is-bot-game-ui \
  --region=us-central1 \
  --min-instances=1
```

### Option 3: Stop Just the Game UI (Keep backend running)

**Useful if you want to keep the system ready but disable public access:**

```bash
# Delete only the public-facing game UI
gcloud run services delete price-is-bot-game-ui --region=us-central1 --quiet
```

**Cost reduction:** ~$5-15/month (game UI typically uses the most resources)

### Quick Shutdown Script

Save this as `scripts/shutdown-gcp.sh`:

```bash
#!/bin/bash
set -e

echo "🛑 Shutting down Price is Bot on GCP"
echo ""

read -p "Delete services? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Deleting Cloud Run services..."
    gcloud run services delete price-is-bot-backend --region=us-central1 --quiet || true
    gcloud run services delete price-is-bot-game-ui --region=us-central1 --quiet || true
    gcloud run services delete price-is-bot-leaderboard-api --region=us-central1 --quiet || true
    echo "✅ Services deleted"
fi

echo ""
read -p "Delete Docker images? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Deleting Artifact Registry images..."
    GCP_PROJECT=$(gcloud config get-value project)
    gcloud artifacts docker images delete \
      us-central1-docker.pkg.dev/${GCP_PROJECT}/price-is-bot/backend:latest --quiet || true
    gcloud artifacts docker images delete \
      us-central1-docker.pkg.dev/${GCP_PROJECT}/price-is-bot/game-ui:latest --quiet || true
    gcloud artifacts docker images delete \
      us-central1-docker.pkg.dev/${GCP_PROJECT}/price-is-bot/leaderboard-api:latest --quiet || true
    echo "✅ Images deleted"
fi

echo ""
echo "🎉 Shutdown complete!"
echo "Note: Elasticsearch data and secrets are preserved"
```

Make it executable: `chmod +x scripts/shutdown-gcp.sh`

---

## Full Documentation

- **[DEPLOYMENT_GCP.md](DEPLOYMENT_GCP.md)** - Complete deployment guide
- **[SCRIPTS.md](SCRIPTS.md)** - Script reference
- **[DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md)** - Architecture details
- **[README.md](README.md)** - Project overview

---

**That's it! You're ready to demo The Price is Bot! 🤖**

