#!/bin/bash
# Deploy The Price is Bot to GCP Cloud Run
# Deploys three services: game-ui, backend, leaderboard-api

set -e  # Exit on any error

echo "🚀 Deploying The Price is Bot to GCP Cloud Run"
echo "=================================================="
echo ""

# Load environment variables
if [ -f ".env.gcp" ]; then
    export $(cat .env.gcp | grep -v '^#' | xargs)
    echo "✓ Loaded .env.gcp"
fi

if [ -f ".env.secrets" ]; then
    export $(cat .env.secrets | grep -v '^#' | xargs)
    echo "✓ Loaded .env.secrets"
fi

if [ -f ".env.elasticsearch" ]; then
    export $(cat .env.elasticsearch | grep -v '^#' | xargs)
    echo "✓ Loaded .env.elasticsearch"
fi

if [ -f ".env.kibana" ]; then
    export $(cat .env.kibana | grep -v '^#' | xargs)
    echo "✓ Loaded .env.kibana"
fi

echo ""

# Check required variables
if [ -z "$GCP_PROJECT" ]; then
    echo "❌ GCP_PROJECT not set!"
    echo "Set it in .env.gcp or export GCP_PROJECT='your-project-id'"
    exit 1
fi

# Set defaults
GCP_REGION=${GCP_REGION:-us-central1}
ARTIFACT_REGISTRY_LOCATION=${ARTIFACT_REGISTRY_LOCATION:-us-central1}
ARTIFACT_REGISTRY_REPO=${ARTIFACT_REGISTRY_REPO:-price-is-bot}

echo "📦 GCP Project: $GCP_PROJECT"
echo "🌍 Region: $GCP_REGION"
echo "📦 Artifact Registry: $ARTIFACT_REGISTRY_LOCATION/$ARTIFACT_REGISTRY_REPO"
echo ""

# Step 1: Enable required GCP APIs
echo "Step 1: Enabling required GCP APIs..."
gcloud services enable run.googleapis.com \
    artifactregistry.googleapis.com \
    secretmanager.googleapis.com \
    --project=$GCP_PROJECT

echo "✅ APIs enabled"
echo ""

# Step 2: Create Artifact Registry repository (if it doesn't exist)
echo "Step 2: Setting up Artifact Registry..."
if ! gcloud artifacts repositories describe $ARTIFACT_REGISTRY_REPO \
    --location=$ARTIFACT_REGISTRY_LOCATION \
    --project=$GCP_PROJECT &>/dev/null; then
    
    echo "Creating Artifact Registry repository..."
    gcloud artifacts repositories create $ARTIFACT_REGISTRY_REPO \
        --repository-format=docker \
        --location=$ARTIFACT_REGISTRY_LOCATION \
        --project=$GCP_PROJECT
    echo "✅ Repository created"
else
    echo "✅ Repository already exists"
fi
echo ""

# Step 3: Create secrets in Secret Manager
echo "Step 3: Setting up Secret Manager..."

# Function to create or update secret
create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if gcloud secrets describe $secret_name --project=$GCP_PROJECT &>/dev/null; then
        echo "  Updating $secret_name..."
        echo -n "$secret_value" | gcloud secrets versions add $secret_name \
            --data-file=- \
            --project=$GCP_PROJECT
    else
        echo "  Creating $secret_name..."
        echo -n "$secret_value" | gcloud secrets create $secret_name \
            --data-file=- \
            --replication-policy="automatic" \
            --project=$GCP_PROJECT
    fi
}

# Create/update secrets
if [ -n "$ES_URL" ]; then
    create_or_update_secret "elasticsearch-url" "$ES_URL"
fi

if [ -n "$ES_API_KEY" ]; then
    create_or_update_secret "elasticsearch-api-key" "$ES_API_KEY"
fi

if [ -n "$KIBANA_URL" ]; then
    create_or_update_secret "kibana-url" "$KIBANA_URL"
fi

if [ -n "$KIBANA_API_KEY" ]; then
    create_or_update_secret "kibana-api-key" "$KIBANA_API_KEY"
fi

if [ -n "$SECRET_KEY" ]; then
    create_or_update_secret "jwt-secret-key" "$SECRET_KEY"
fi

if [ -n "$ADMIN_TOKEN" ]; then
    create_or_update_secret "admin-token" "$ADMIN_TOKEN"
fi

echo "✅ Secrets configured"
echo ""

# Step 4: Build and push Docker images (linux/amd64 via buildx)
echo "Step 4: Building and pushing Docker images..."

# Configure Docker for Artifact Registry
gcloud auth configure-docker ${ARTIFACT_REGISTRY_LOCATION}-docker.pkg.dev --quiet

# Ensure buildx builder exists
docker buildx create --use >/dev/null 2>&1 || true

echo ""
echo "Building and pushing backend (linux/amd64)..."
docker buildx build --platform linux/amd64 -t ${ARTIFACT_REGISTRY_LOCATION}-docker.pkg.dev/${GCP_PROJECT}/${ARTIFACT_REGISTRY_REPO}/backend:latest \
    ./backend --push

echo ""
echo "Building and pushing leaderboard-api (linux/amd64)..."
docker buildx build --platform linux/amd64 -t ${ARTIFACT_REGISTRY_LOCATION}-docker.pkg.dev/${GCP_PROJECT}/${ARTIFACT_REGISTRY_REPO}/leaderboard-api:latest \
    ./leaderboard-api --push

echo ""
echo "Building and pushing game-ui (linux/amd64)..."
docker buildx build --platform linux/amd64 -t ${ARTIFACT_REGISTRY_LOCATION}-docker.pkg.dev/${GCP_PROJECT}/${ARTIFACT_REGISTRY_REPO}/game-ui:latest \
    ./game-ui --push

echo "✅ Images built and pushed"
echo ""

# Step 5: Deploy backend service
echo "Step 5: Deploying backend service..."
gcloud run deploy price-is-bot-backend \
    --image=${ARTIFACT_REGISTRY_LOCATION}-docker.pkg.dev/${GCP_PROJECT}/${ARTIFACT_REGISTRY_REPO}/backend:latest \
    --platform=managed \
    --region=$GCP_REGION \
    --project=$GCP_PROJECT \
    --service-account=price-is-bot-sa@${GCP_PROJECT}.iam.gserviceaccount.com \
    --allow-unauthenticated \
    --port=8080 \
    --cpu=1 \
    --memory=512Mi \
    --min-instances=0 \
    --max-instances=10 \
    --timeout=300s \
    --set-secrets=ELASTICSEARCH_HOST=elasticsearch-url:latest,ELASTICSEARCH_API_KEY=elasticsearch-api-key:latest,SECRET_KEY=jwt-secret-key:latest,ADMIN_TOKEN=admin-token:latest

BACKEND_URL=$(gcloud run services describe price-is-bot-backend \
    --platform=managed \
    --region=$GCP_REGION \
    --project=$GCP_PROJECT \
    --format='value(status.url)')

echo "✅ Backend deployed: $BACKEND_URL"
echo ""

# Step 6: Deploy leaderboard-api service
echo "Step 6: Deploying leaderboard-api service..."
gcloud run deploy price-is-bot-leaderboard-api \
    --image=${ARTIFACT_REGISTRY_LOCATION}-docker.pkg.dev/${GCP_PROJECT}/${ARTIFACT_REGISTRY_REPO}/leaderboard-api:latest \
    --platform=managed \
    --region=$GCP_REGION \
    --project=$GCP_PROJECT \
    --service-account=price-is-bot-sa@${GCP_PROJECT}.iam.gserviceaccount.com \
    --allow-unauthenticated \
    --port=8080 \
    --cpu=1 \
    --memory=512Mi \
    --min-instances=0 \
    --max-instances=10 \
    --timeout=300s \
    --set-secrets=ELASTICSEARCH_URL=elasticsearch-url:latest,ELASTICSEARCH_API_KEY=elasticsearch-api-key:latest

LEADERBOARD_URL=$(gcloud run services describe price-is-bot-leaderboard-api \
    --platform=managed \
    --region=$GCP_REGION \
    --project=$GCP_PROJECT \
    --format='value(status.url)')

echo "✅ Leaderboard API deployed: $LEADERBOARD_URL"
echo ""

# Step 7: Deploy game-ui service
echo "Step 7: Deploying game-ui service..."
gcloud run deploy price-is-bot-game-ui \
    --image=${ARTIFACT_REGISTRY_LOCATION}-docker.pkg.dev/${GCP_PROJECT}/${ARTIFACT_REGISTRY_REPO}/game-ui:latest \
    --platform=managed \
    --region=$GCP_REGION \
    --project=$GCP_PROJECT \
    --service-account=price-is-bot-sa@${GCP_PROJECT}.iam.gserviceaccount.com \
    --allow-unauthenticated \
    --port=8080 \
    --cpu=1 \
    --memory=512Mi \
    --min-instances=1 \
    --max-instances=10 \
    --timeout=60s \
    --set-env-vars=NEXT_PUBLIC_BACKEND_URL=${BACKEND_URL},NEXT_PUBLIC_LEADERBOARD_API_URL=${LEADERBOARD_URL} \
    --set-secrets=KIBANA_URL=kibana-url:latest,KIBANA_API_KEY=kibana-api-key:latest

GAME_UI_URL=$(gcloud run services describe price-is-bot-game-ui \
    --platform=managed \
    --region=$GCP_REGION \
    --project=$GCP_PROJECT \
    --format='value(status.url)')

# Update backend CORS to allow the game UI

gcloud run services update price-is-bot-backend \
  --region=$GCP_REGION \
  --platform=managed \
  --project=$GCP_PROJECT \
  --update-env-vars=CORS_ALLOWED_ORIGINS=${GAME_UI_URL}

# Ensure leaderboard-api has ADMIN_TOKEN secret wired

gcloud run services update price-is-bot-leaderboard-api \
  --region=$GCP_REGION \
  --platform=managed \
  --project=$GCP_PROJECT \
  --set-secrets=ADMIN_TOKEN=admin-token:latest

echo "✅ Game UI deployed: $GAME_UI_URL"
echo ""

# Summary
echo "=================================================="
echo "🎉 Deployment Complete!"
echo ""
echo "Service URLs:"
echo "  🎮 Game UI:         $GAME_UI_URL"
echo "  🔧 Backend:         $BACKEND_URL"
echo "  📊 Leaderboard API: $LEADERBOARD_URL"
echo ""
echo "Next steps:"
echo "  1. Test deployment: ./scripts/test-deployment.sh"
echo "  2. Open game: open $GAME_UI_URL"
echo ""

