#!/usr/bin/env bash

# Exit immediately if any command returns a non-zero status
set -e

# ==========================================
# 📋 CONFIGURATION PARAMETERS
# ==========================================
DOCKER_HUB_USER="dockerhub username"                  # Your Docker Hub account name
VERSION="v1.0.0"                           # Your deployment tag

# Production Server Details
SERVER_USER="bpg"                          # Your production SSH username
SERVER_IP="your server IP"                 # Your production server IP
DOCKER_PASSWORD="password for your dockerhub" 

# Define full Image names for registry target routing
DB_IMAGE="${DOCKER_HUB_USER}/attendance-db:${VERSION}"
BACKEND_IMAGE="${DOCKER_HUB_USER}/attendance-backend:${VERSION}"
FRONTEND_IMAGE="${DOCKER_HUB_USER}/attendance-frontend:${VERSION}"

echo "=================================================="
# 🔐 STEP 1: AUTHENTICATE WITH DOCKER HUB REGISTRY
# ==================================================
echo "🔐 Logging into Docker Hub Registry..."
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_HUB_USER" --password-stdin

echo "=================================================="
# 🏗️ STEP 2: BUILD AND TAG HIGHLY OPTIMIZED TARGETS
# ==================================================
echo "🏗️ Building and Tagging Production Images..."

# Build & tag PostgreSQL locally
docker build -t "$DB_IMAGE" -f - . <<EOF
FROM postgres:18
EOF

# Build & tag Backend
docker build -t "$BACKEND_IMAGE" ./backend

# Build & tag Frontend (baking in the production URL endpoint)
docker build \
  --build-arg VITE_API_URL="http://${SERVER_IP}:5000" \
  -t "$FRONTEND_IMAGE" \
  ./frontend

echo "=================================================="
# 🚀 STEP 3: PUSH LOGGED IMAGES TO DOCKER HUB
# ==================================================
echo "🚀 Pushing compiled layers to Docker Hub..."
docker push "$DB_IMAGE"
docker push "$BACKEND_IMAGE"
docker push "$FRONTEND_IMAGE"

echo "=================================================="
# 🌐 STEP 4: TRANSFER CONFIGURATIONS & DEPLOY VIA SSH
# ==================================================
echo "🌐 Synchronizing architectural orchestrations with production environment..."

# 1. Create a migration folder on the server if it doesn't exist
ssh "${SERVER_USER}@${SERVER_IP}" "mkdir -p ~/init-db"

# 2. Securely copy your schema setup script to the server
scp ./init-db/init.sql "${SERVER_USER}@${SERVER_IP}:~/init-db/init.sql"

# 🚀 3. FIXED: THIS STEP WAS MISSING! This copies your docker-compose.prod.yml file up to the server as docker-compose.yml
scp docker-compose.prod.yml "${SERVER_USER}@${SERVER_IP}:~/docker-compose.yml"

# 4. Execute a remote script block inside your target deployment server
echo "🚀 Triggering remote container upgrades..."
ssh "${SERVER_USER}@${SERVER_IP}" << REMOTE_SSH_COMMANDS
  set -e
  
  # Ensure the custom network exists on the server before doing anything else
  docker network inspect my_custom_network >/dev/null 2>&1 || docker network create my_custom_network

  # Pull the brand new updated layers directly inside the server architecture
  docker pull "${DB_IMAGE}"
  docker pull "${BACKEND_IMAGE}"
  docker pull "${FRONTEND_IMAGE}"
  
  # Shut down existing services and launch the new updates using the uploaded map
  docker compose -f ~/docker-compose.yml down
  docker compose -f ~/docker-compose.yml up -d
  
  # Prune ancient dangling imagery to preserve remote server disk block spaces
  docker image prune -f
REMOTE_SSH_COMMANDS

echo "=================================================="
echo "🎉 SUCCESS: Version ${VERSION} is fully deployed at http://${SERVER_IP} !"
echo "=================================================="
