# The Price is Bot - GCP Cloud Run Complete Deployment Plan

## Vision
Single-command deployment that sets up everything from scratch: Elasticsearch data generation, agent/tool deployment, and three GCP Cloud Run services.

---

## Architecture Overview

**Three Cloud Run Services:**
1. **game-ui** (Next.js) - Player-facing game interface → Connects directly to Kibana Agent Builder API
2. **backend** (FastAPI) - Game logic, Socket.IO, scoring, user management → Connects to Elasticsearch  
3. **leaderboard-api** (FastAPI) - Admin panel for leaderboard and access code generation → Connects to Elasticsearch

**Key Dependencies:**
- elastic-grocery-core (separate repo at `../elastic-grocery-core/`) - needs to be installable
- Existing Elasticsearch cluster (user has this)
- Kibana with Agent Builder enabled

---

## Phase 1: Project Cleanup

**Delete:**
- `version_1/` directory (confirmed obsolete)
- `frontend/` directory (legacy React app - game-ui is current)
- Root .md files: CLEANUP_COMPLETE.md, REFACTORING_COMPLETE.md, FINAL_UPDATES_COMPLETE.md, README_UPDATES_COMPLETE.md, REFACTORING_AND_TESTING_SUMMARY.md, RENAME_SUMMARY.md, TEST_SUITE_COMPLETE.md, TESTING_COMPLETE.md, MEAL_PLANNING_IMPLEMENTATION_PLAN.md, QUICK_START.md, VERIFICATION_REPORT.md
- docs/archive/* (development notes - can be archived to separate location if needed)

**Keep:**
- README.md, DEPLOYMENT.md, SCRIPTS.md
- docs/GAME_RULES.md
- elasti-cart_first_thoughts.md (historical context)

**Create:**
- `.dockerignore` files for all three services
- `.env.example` templates

---

## Phase 2: elastic-grocery-core Integration

**Problem:** `deploy-canonical.sh` line 23 references `../elastic-grocery-core/scripts/deploy_base_tools.py`

**Solution:** Make elastic-grocery-core pip-installable:
```bash
# Add to the-price-is-bot/requirements.txt
-e ../elastic-grocery-core
```

**Update deploy-canonical.sh** to use installed package:
```bash
# Change from:
python3 ../elastic-grocery-core/scripts/deploy_base_tools.py "$@"

# To:
python -m elastic_grocery_core.scripts.deploy_base_tools "$@"
```

**Also update:**
```bash
# Change from:
python3 scripts/deploy_game.py "$@"

# To:
python -m scripts.deploy_game "$@"
```

---

## Phase 3: Complete Automation Scripts

### Script 1: setup-elasticsearch.sh
Automated Elasticsearch setup:
```bash
#!/bin/bash
# 1. Check ES connection
# 2. Generate grocery data (5000 items, 10 stores)
# 3. Deploy 8 base tools from elastic-grocery-core
# 4. Deploy 5 game agents
# 5. Verify deployment (8 tools + 5 agents)
```

### Script 2: deploy-to-gcp.sh
GCP deployment automation:
```bash
#!/bin/bash
# 1. Setup GCP infrastructure (Artifact Registry, Secret Manager)
# 2. Build 3 Docker images
# 3. Push to Artifact Registry
# 4. Deploy 3 Cloud Run services
# 5. Configure secrets and environment variables
# 6. Output service URLs
```

### Script 3: deploy-everything.sh
Master orchestrator:
```bash
#!/bin/bash
# 1. Load environment variables from .env files
# 2. Install elastic-grocery-core
# 3. Run setup-elasticsearch.sh
# 4. Run deploy-to-gcp.sh
# 5. Run test-deployment.sh
# 6. Output success message with URLs
```

### Script 4: test-deployment.sh
Smoke tests:
```bash
#!/bin/bash
# 1. Health checks for all 3 services
# 2. Test agent chat functionality
# 3. Test leaderboard API
# 4. Test access code generation (admin endpoint)
# 5. Report results
```

---

## Phase 4: Docker Configurations

### game-ui/Dockerfile (NEW - needs creation)
Multi-stage Next.js production build:
```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Production
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV PORT 8080
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 8080
CMD ["node", "server.js"]
```

### backend/Dockerfile (EXISTS - review and update)
Current Dockerfile looks good:
- Python 3.12 slim
- Port 8080
- uvicorn server

**Updates needed:**
- Add elastic-grocery-core if imports are needed
- Verify all requirements.txt dependencies
- Update CORS configuration for Cloud Run URLs

### leaderboard-api/Dockerfile (NEW - needs creation)
```dockerfile
FROM python:3.12-slim
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application
COPY main.py .

# Expose port
EXPOSE 8080

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### .dockerignore files
Create for all three services:
```
# Git
.git
.gitignore

# Environment
.env
.env.*
!.env.example

# Python
__pycache__
*.pyc
*.pyo
*.pyd
.Python
*.so
.pytest_cache
*.egg-info

# Node
node_modules
.next
npm-debug.log

# IDE
.vscode
.idea
*.swp
*.swo

# Documentation
*.md
!README.md

# Other
.DS_Store
venv
dist
build
```

---

## Phase 5: GCP Cloud Run Configuration

### Service 1: game-ui
```yaml
Name: price-is-bot-game-ui
Container Port: 8080
CPU: 1
Memory: 512Mi
Min Instances: 1
Max Instances: 10
Timeout: 60s
Allow Unauthenticated: Yes
Concurrency: 80

Environment Variables:
  - KIBANA_URL (from Secret Manager)
  - KIBANA_API_KEY (from Secret Manager)
  - NEXT_PUBLIC_BACKEND_URL (Cloud Run backend URL)
  - NEXT_PUBLIC_LEADERBOARD_URL (Cloud Run leaderboard-api URL)
```

### Service 2: backend
```yaml
Name: price-is-bot-backend
Container Port: 8080
CPU: 1
Memory: 512Mi
Min Instances: 0
Max Instances: 10
Timeout: 300s
Allow Unauthenticated: Yes
Concurrency: 80

Environment Variables:
  - ELASTICSEARCH_HOST (from Secret Manager)
  - ELASTICSEARCH_API_KEY (from Secret Manager)
  - SECRET_KEY (from Secret Manager)
  - ADMIN_TOKEN (from Secret Manager)
  - PORT: 8080
```

### Service 3: leaderboard-api
```yaml
Name: price-is-bot-leaderboard-api
Container Port: 8080
CPU: 1
Memory: 512Mi
Min Instances: 0
Max Instances: 10
Timeout: 300s
Allow Unauthenticated: Yes
Concurrency: 80

Environment Variables:
  - ELASTICSEARCH_URL (from Secret Manager)
  - ELASTICSEARCH_API_KEY (from Secret Manager)
```

### GCP Secret Manager
Store these secrets:
- `elasticsearch-url`
- `elasticsearch-api-key`
- `kibana-url`
- `kibana-api-key`
- `jwt-secret-key`
- `admin-token`

### Required GCP APIs
```bash
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

---

## Phase 6: Environment Templates

Create these files:

### .env.elasticsearch.example
```bash
ES_URL=https://your-cluster.es.cloud.es.io
ES_API_KEY=your_elasticsearch_api_key
```

### .env.kibana.example
```bash
KIBANA_URL=https://your-cluster.kb.cloud.es.io
KIBANA_API_KEY=your_kibana_api_key
```

### .env.gcp.example
```bash
GCP_PROJECT=your-project-id
GCP_REGION=us-central1
ARTIFACT_REGISTRY_LOCATION=us-central1
ARTIFACT_REGISTRY_REPO=price-is-bot
```

### .env.secrets.example
```bash
# Generate with: openssl rand -base64 32
SECRET_KEY=your_generated_secret_key_here

# Generate with: openssl rand -base64 32
ADMIN_TOKEN=your_generated_admin_token_here
```

---

## Phase 7: Testing & Verification

### Local Docker Testing
```bash
# Build images
docker build -t backend-test ./backend
docker build -t leaderboard-test ./leaderboard-api  
docker build -t frontend-test ./game-ui

# Run backend
docker run -p 8080:8080 \
  -e ELASTICSEARCH_HOST=$ES_URL \
  -e ELASTICSEARCH_API_KEY=$ES_API_KEY \
  -e SECRET_KEY=test_secret \
  -e ADMIN_TOKEN=test_admin \
  backend-test

# Run leaderboard-api
docker run -p 8081:8080 \
  -e ELASTICSEARCH_URL=$ES_URL \
  -e ELASTICSEARCH_API_KEY=$ES_API_KEY \
  leaderboard-test

# Run frontend (needs backend URLs)
docker run -p 3000:8080 \
  -e KIBANA_URL=$KIBANA_URL \
  -e KIBANA_API_KEY=$KIBANA_API_KEY \
  -e NEXT_PUBLIC_BACKEND_URL=http://localhost:8080 \
  -e NEXT_PUBLIC_LEADERBOARD_URL=http://localhost:8081 \
  frontend-test
```

### Deployment Verification Checklist
- [ ] Elasticsearch has grocery data (check indices: grocery_items, store_inventory, etc.)
- [ ] 8 base tools deployed in Kibana
- [ ] 5 game agents deployed in Kibana (budget_master, health_guru, gourmet_chef, speed_shopper, local_expert)
- [ ] All 3 Cloud Run services running and healthy
- [ ] game-ui loads successfully at Cloud Run URL
- [ ] Agent selection works
- [ ] Agent chat works (tests Kibana Agent Builder connection)
- [ ] Game flow works end-to-end (select items, submit cart)
- [ ] Leaderboard displays correctly
- [ ] Admin can generate access codes via leaderboard-api
- [ ] Scoring calculates correctly

---

## Phase 8: Documentation

### Update README.md
Add sections for:
- Quick start with deploy-everything.sh
- GCP prerequisites
- Environment setup guide
- Architecture diagram
- Troubleshooting section

### Create DEPLOYMENT_GCP.md
Comprehensive guide covering:
- GCP project setup and prerequisites
- Required APIs and permissions
- Secret Manager configuration
- Step-by-step deployment
- Service URLs and networking
- Monitoring and logging
- Cost management strategies
- Rollback and disaster recovery
- Troubleshooting common issues

### Update SCRIPTS.md
Document new scripts:
- `setup-elasticsearch.sh` - Data generation and agent deployment
- `deploy-to-gcp.sh` - GCP Cloud Run deployment
- `deploy-everything.sh` - Master orchestrator
- `test-deployment.sh` - Verification and smoke tests

---

## Implementation Order

### Week 1: Foundation
1. **Day 1: Cleanup** (2 hours)
   - Remove version_1/, frontend/, old .md files
   - Create .dockerignore files
   
2. **Day 1-2: elastic-grocery-core** (3 hours)
   - Make pip-installable
   - Update deployment scripts
   - Test locally

3. **Day 2: Environment Setup** (2 hours)
   - Create all .env.example templates
   - Document required variables

### Week 2: Docker & Scripts
4. **Day 3: Dockerfiles** (4 hours)
   - Create game-ui/Dockerfile
   - Create leaderboard-api/Dockerfile
   - Update backend configuration
   - Test locally

5. **Day 4: Automation Scripts** (6 hours)
   - Create setup-elasticsearch.sh
   - Create deploy-to-gcp.sh
   - Create deploy-everything.sh
   - Create test-deployment.sh

### Week 3: Deploy & Verify
6. **Day 5: GCP Setup** (4 hours)
   - Setup GCP project
   - Configure Secret Manager
   - Test deployment scripts

7. **Day 6: Deployment** (4 hours)
   - Run deploy-everything.sh
   - Troubleshoot issues
   - Verify all functionality

8. **Day 7: Documentation** (3 hours)
   - Update README.md
   - Create DEPLOYMENT_GCP.md
   - Update SCRIPTS.md
   - Record lessons learned

**Total: ~28 hours** (can be done over 2-3 weeks, working part-time)

---

## Success Criteria

✅ **From empty Elasticsearch → Fully deployed game in < 30 minutes**  
✅ **Single command: `./deploy-everything.sh`**  
✅ **Zero manual configuration needed**  
✅ **All services running on GCP Cloud Run**  
✅ **Complete admin capabilities (leaderboard + access codes)**  
✅ **Production-ready with proper security (Secret Manager, CORS, auth)**  
✅ **Cost-optimized (scale-to-zero for backend/admin services)**  
✅ **Fully documented and reproducible**

---

## Cost Estimates

**Monthly GCP costs (estimated):**
- Cloud Run (3 services): $10-30/month (with scale-to-zero)
- Artifact Registry: $0.10/GB/month (~$1)
- Secret Manager: $0.06/secret version/month (~$0.50)
- Networking/Egress: Variable, typically $1-5/month

**Total estimated: $15-40/month** for low-medium usage demo

**Elasticsearch costs:** User already has existing cluster, so no additional cost.

---

## Security Considerations

1. **Secrets Management**
   - All credentials in GCP Secret Manager
   - Never commit .env files
   - Rotate secrets regularly

2. **API Security**
   - Admin endpoints protected with Bearer token
   - CORS properly configured for Cloud Run domains
   - Rate limiting on public endpoints

3. **Network Security**
   - Service-to-service authentication optional
   - Cloud Run IAM roles properly configured
   - Minimal permissions principle

4. **Data Security**
   - Elasticsearch connection over HTTPS
   - API keys with minimal required permissions
   - No sensitive data in logs

---

## Monitoring & Observability

**Cloud Run Metrics:**
- Request count and latency
- Error rates (4xx, 5xx)
- Container instance count
- Cold start frequency

**Custom Logging:**
- Agent Builder API calls
- Elasticsearch query performance
- Game completion rates
- Access code usage

**Alerts:**
- Error rate threshold exceeded
- Service unavailable
- Unusual traffic patterns
- Cost threshold exceeded

---

## Future Enhancements

1. **CD/CI Pipeline**
   - GitHub Actions for automated deployments
   - Automated testing on PR
   - Staging environment

2. **Advanced Features**
   - Custom domain with Cloud Load Balancer
   - CDN for static assets
   - Redis cache for session data
   - WebSocket support optimization

3. **Monitoring**
   - Cloud Monitoring dashboards
   - Uptime checks
   - Performance profiling
   - User analytics

4. **Scalability**
   - Horizontal scaling rules
   - Database connection pooling
   - Caching strategies
   - Load testing

---

**Ready to start Phase 1! 🚀**

