#!/bin/bash
set -e

IMAGE_NAME="dockerhub_username/my_static_app:v01"
SERVER_USER="bpg"
SERVER_IP="192.168.10.213"
DOCKER_USERNAME="dockerhub_username"
DOCKER_PASSWORD="your_actual_dockerhub_token_or_password_here" 

echo "Building docker image..."
docker build -t $IMAGE_NAME . 

echo "🔑 Logging into Docker Registry..."
# Pipe the password into stdin so it doesn't freeze
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

echo "🚀 Pushing image to registry..."
docker push $IMAGE_NAME

echo "🌐 Connecting to remote server and deploying..."
ssh ${SERVER_USER}@${SERVER_IP} << EOF
  echo "📥 Pulling latest image..."
  docker pull $IMAGE_NAME

  echo "🛡️ Managing containers and networks..."
  docker rm -f my_static_web 2>/dev/null || true
  docker network create my_custom_network 2>/dev/null || true

  echo "▶️ Running new container..."
  docker run -d -p 8080:80 \
    --name my_static_web \
    --network my_custom_network \
    $IMAGE_NAME

  echo "✅ Deployment on server complete!"
EOF

echo "🎉 All Done!"
