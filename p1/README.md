# Dockerizing and Deploying a Static Web Application

This repository contains the configuration, documentation, and automation scripts to package a static HTML/CSS website into a lightweight Docker image and deploy it across environments using a user-defined custom bridge network.

---

## 🏗️ 1. Architecture Overview

- **Base Image:** `nginx:alpine` (A minimal, secure, and production-ready web server).
- **Network Architecture:** Isolated user-defined custom bridge network (`my_prod_network`). This prevents exposure to the default bridge network and enables reliable internal container communications.
- **Port Mapping:** Port `8080` on the host machine maps to internal port `80` inside the container. Traffic is intended to be routed smoothly via an external reverse proxy (like Nginx Proxy Manager) to eliminate typing ports in the web browser.

---

## 📄 2. Dockerfile Explained

```dockerfile
# Use the lightweight, official Nginx Alpine image as the base blueprint
FROM nginx:alpine

# Copy all static assets from the current directory into Nginx's default public directory
COPY . /usr/share/nginx/html

# Document that the container listens on port 80 at runtime
EXPOSE 80
```

---

## 💻 3. Local Development & Manual Workflow

### Step A: Initialize the Custom Network
Create an isolated bridge network on your local machine for staging and testing:
```bash
docker network create my_prod_network
```

### Step B: Authenticate with Docker Hub
Log into your registry from your terminal before pushing the built image:
```bash
docker login
```

### Step C: Build and Push the Image
Compile the blueprint and ship it to your remote registry. Replace `your_dockerhub_username` with your exact registry namespace:
```bash
# Build and tag the image
docker build -t your_dockerhub_username/static_app:v1 .

# Push the image to the remote registry
docker push your_dockerhub_username/static_app:v1
```

### Step D: Pull and Run on the Target Server
Execute these commands on your deployment server to fetch the image and spin up the live environment:
Note: before pulling the image, If you push into docker private registery or AWS ECS use cridentials accordingly
```bash
# Pull the latest image from the registry
docker pull your_dockerhub_username/static_app:v1

# Run the container attached to the custom network in detached background mode
docker run -d \
  --name my_static_website \
  --network my_prod_network \
  -p 8080:80 \
  your_dockerhub_username/static_app:v1
```

---

## 🚀 4. Automated Deployment Script (Option 1: SSH Keys)

To eliminate manual steps, use the deployment script included in this repository (`deploy.sh`). This script builds, pushes, logs into your remote server using pre-configured passwordless SSH keys, tears down stale containers, and starts the new instance automatically.

### Pre-requisite: One-Time SSH Key Setup
Ensure your local public SSH key is copied to your production server so the script can log in without pausing for a password prompt:
```bash
ssh-copy-id bpg@192.168.10.213
```

### Running the Deployment Script
Make the script executable and trigger the pipeline:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🛠️ 5. Essential Docker Cheat Sheet

### Inspection & Debugging
* **View Real-Time Logs:** View runtime outputs or errors from Nginx.
  ```bash
  docker logs -f my_static_website
  ```
* **Inspect Custom Network:** Verify which containers are attached to your network and see their internal IPs.
  ```bash
  docker network inspect my_prod_network
  ```
* **Interactive Terminal Access:** Drop into a live shell container environment for debugging files inside `/usr/share/nginx/html`.
  ```bash
  docker exec -it my_static_website sh
  ```

### Container Lifecycle Management
* **Stop Container:** Safely pause the active container process.
  ```bash
  docker stop my_static_website
  ```
* **Start Container:** Resume a stopped container instance.
  ```bash
  docker start my_static_website
  ```
* **Force Remove Container:** Stop and delete the container instance in one command.
  ```bash
  docker rm -f my_static_website
  ```
* **Remove Local Image:** Delete the cached static image from your host disk to save space.
  ```bash
  docker rmi your_dockerhub_username/static_app:v1
  ```
* **Retag Image:** Create an alias shortcut targeting a specific registry layout.
  ```bash
  docker tag static_app:v1 your_dockerhub_username/static_app:v1
  ```
