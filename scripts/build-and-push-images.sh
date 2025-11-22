#!/bin/bash
# Build and push Docker images to GCP Artifact Registry
# This only builds/pushes - does NOT deploy to Cloud Run

set -e

echo "🔨 Building and Pushing Docker Images"
echo "======================================"
echo ""

# Configuration
PROJECT="elastic-customer-eng"
LOCATION="us-central1"
REPO="price-is-bot"
REGISTRY="${LOCATION}-docker.pkg.dev/${PROJECT}/${REPO}"

echo "📦 Target Registry: ${REGISTRY}"
echo ""

# Configure Docker authentication
echo "🔐 Configuring Docker authentication..."
gcloud auth configure-docker ${LOCATION}-docker.pkg.dev --quiet
echo "✅ Docker authenticated"
echo ""

# Ensure buildx builder exists (for cross-platform builds)
echo "🏗️  Setting up Docker buildx..."
docker buildx create --use --name price-is-bot-builder 2>/dev/null || docker buildx use price-is-bot-builder
echo "✅ Buildx ready"
echo ""

# Build and push backend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Building backend (linux/amd64)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker buildx build --platform linux/amd64 \
  -t ${REGISTRY}/backend:latest \
  --push \
  ./backend
echo "✅ Backend pushed"
echo ""

# Build and push leaderboard-api
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Building leaderboard-api (linux/amd64)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker buildx build --platform linux/amd64 \
  -t ${REGISTRY}/leaderboard-api:latest \
  --push \
  ./leaderboard-api
echo "✅ Leaderboard API pushed"
echo ""

# Build and push game-ui
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Building game-ui (linux/amd64)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker buildx build --platform linux/amd64 \
  -t ${REGISTRY}/game-ui:latest \
  --push \
  ./game-ui
echo "✅ Game UI pushed"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 All images built and pushed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Images available at:"
echo "  - ${REGISTRY}/backend:latest"
echo "  - ${REGISTRY}/leaderboard-api:latest"
echo "  - ${REGISTRY}/game-ui:latest"
echo ""
echo "Next steps:"
echo "  1. Push updated Instruqt track: instruqt track push"
echo "  2. Launch new sandbox"
echo "  3. Containers will pull latest images automatically"
echo ""






