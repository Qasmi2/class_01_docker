# Real-Time Attendance Board 📋

A fully containerized production-grade full-stack attendance management dashboard built with React (Vite), Express.js, and PostgreSQL. The application is completely dockerized and includes an automated shell script pipeline for continuous deployment (CD) to a remote production environment using Docker Hub and SSH.

---

## 🏗️ Architecture Overview

The system consists of three highly optimized, decoupled service layers connecting over a isolated bridge network:

graph TD
    classDef browser fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef network fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,stroke-dasharray: 5 5;
    classDef container fill:#fff,stroke:#555,stroke-width:1.5px;
    classDef db fill:#e8f5e9,stroke:#388e3c,stroke-width:2px;

    User([User Browser]):::browser
    
    subgraph my_custom_network [DOCKER BRIDGE NETWORK: my_custom_network]
        direction TB
        subgraph Services
            direction LR
            Frontend["frontend_web<br/><i>(Nginx Proxy)</i>"]:::container
            Backend["backend_api<br/><i>(Node/Express)</i>"]:::container
        end
        
        DB["postgresql_db<br/><i>(Postgres 18)</i>"]:::db
    end

    User -- "Public HTTP (Port 80 / 5000)" --> Frontend
    Frontend -- "Docker DNS" --> Backend
    Backend -.-> DB

    class my_custom_network network;



*   **Frontend (`frontend_web`)**: A single-page React app bundled via Vite. Uses a **Multi-Stage Docker build** compiled using Node 22 and served via a highly performant **Nginx Alpine** engine (dropped from ~400MB down to **28.9MB**). Custom Nginx routing redirects fallback client endpoints cleanly to prevent 404 router reload issues.
*   **Backend (`backend_api`)**: Node.js runtime executing REST queries with a modular Controller-Repository pattern. Automatically maps client camelCase properties into traditional snake_case SQL properties cleanly.
*   **Database (`postgresql_db`)**: Active **PostgreSQL 18** relational database with independent data storage volume persistence and execution order schema initialization hooks.

---

## 📁 Repository Directory Structure

```text
.
├── backend/
│   ├── src/
│   │   ├── config/db.js                  # Database connection pool settings
│   │   ├── controllers/                  # Express request handlers
│   │   ├── repositories/                 # SQL query abstractions
│   │   └── routes/                       # API path mappings
│   ├── Dockerfile                        # Fast layered node-cache file
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── src/                              # Components (App.jsx, Header.jsx, etc.)
│   ├── Dockerfile                        # Optimized production Nginx builder
│   ├── nginx.conf                        # Custom SPA redirect rules
│   ├── package.json
│   └── package-lock.json
├── init-db/
│   └── init.sql                          # First-run schema/table seeds
├── docker-compose.yml                    # Local multi-container development configuration
├── docker-compose.prod.yml               # Production remote node instance blueprint
├── deploy.sh                             # Automated CI/CD script
└── .env                                  # Local variable injection (Ignored from git)
```

---

## 🛠️ Local Development Quickstart

### 1. Prerequisites
Ensure you have the following installed locally:
*   [Docker Engine & Docker Compose](https://docker.com)

### 2. Set Up Your Environment Values
Create a `.env` file at the root of the workspace directory:
```ini
POSTGRES_USER=dev_user
POSTGRES_PASSWORD=dev_secret_password
POSTGRES_DB=attendance_dev_db
```

Create a `.env` file inside the `frontend/` subdirectory to set local development variables:
```ini
VITE_API_URL=http://localhost:5000
```

### 3. Spin Up the Local Infrastructure
Build and run the entire local development stack with a single command:
```bash
docker compose up -d --build
```
*   **Frontend Dashboard:** Available at `http://localhost:80` (or `http://localhost`)
*   **Backend API Endpoints:** Accessible at `http://localhost:5000/api/attendance`
*   **Database Engine Port:** Connected at `localhost:5432`

---

## 🚀 Production Automated Deployment Pipeline (CD)

The project includes an automatic shell script (`deploy.sh`) that manages your production lifecycle. It compiles optimized staging assets, pushes verified builds to Docker Hub, copies routing configurations via secure transfers (`scp`), and executes container image pulls and zero-downtime rolling upgrades on your remote server via passwordless `ssh`.

### 1. Initial One-Time Remote Server Setup
Log into your production VPS/server manually once:
```bash
ssh bpg@your-server-ip
```
Create a persistent production secret key layer file inside the home directory (`~/.env`):
```bash
nano .env
```
Populate it with robust production database configurations:
```ini
POSTGRES_USER=production_admin
POSTGRES_PASSWORD=extremely_secure_random_hash_key
POSTGRES_DB=attendance_live
```

### 2. Review Configuration Parameters inside `deploy.sh`
Ensure the configuration block inside your local `deploy.sh` contains your correct account credentials and server IP addresses:
```bash
DOCKER_HUB_USER="your_dockerhub_account"
SERVER_USER="bpg"
SERVER_IP="your_remote_vps_ip"
DOCKER_PASSWORD="your_dockerhub_personal_access_token"
```

### 3. Trigger Deployment
Run the executable script locally from your development machine:
```bash
./deploy.sh
```

### What `deploy.sh` Does under the Hood:
1.  **Registry Authentication**: Signs securely into your Docker Hub profile container namespace using a protected token stdin buffer.
2.  **Optimized Compilations**: Compiles backend layers and injects the live target `SERVER_IP` environment arguments directly into the multi-stage frontend compilation step.
3.  **Registry Push**: Distributes the immutable images (`attendance-db`, `attendance-backend`, `attendance-frontend`) securely up to Docker Hub tagged with a fixed version (e.g., `v1.0.0`).
4.  **Secure Transfers**: Automatically copies migrations (`init.sql`) and orchestration maps (`docker-compose.prod.yml`) cleanly over to the remote host.
5.  **SSH Orchestration**: Automatically enters the production server shell environment to:
    *   Initialize the external Docker bridge network (`my_custom_network`) if missing.
    *   Pull the newly compiled layers from Docker Hub.
    *   Tear down outdated containers and scale up clean services bound to your server's secure `~/.env` data file.
    *   Prune dangling background image blocks to safeguard remote hard drive spaces.

---

## 🐳 Essential Management Commands Cheat Sheet

| Intent | Command |
| :--- | :--- |
| **View Active Services** | `docker compose ps` |
| **Inspect System Logs** | `docker compose logs -f` |
| **Inspect Specific App Component Logs** | `docker compose logs -f backend` |
| **Gracefully Shutdown Container Instances** | `docker compose down` |
| **Wipe Containers AND Storage Volumes (Fresh Start)** | `docker compose down -v` |
| **Manually Validate Nginx Config Inside Container** | `docker exec -it frontend_web cat /etc/nginx/conf.d/default.conf` |

---

## 🔒 Security Best Practices Implemented
*   **Zero Leakage Pattern**: Sensitive credentials remain isolated within local `.env` runtime layers and are included in `.dockerignore` to prevent them from ever leaking onto Docker Hub or public git repositories.
*   **Robust Startup Integrity**: A native `pg_isready` database health check loop prevents Express from launching until PostgreSQL completely finishes internal system migrations, eliminating initialization boot-loops.
*   **Reduced Attack Surface**: Application files are hosted via an unprivileged Alpine minimal server shell container layout with `sudo` removed, blocking traditional host machine root access vectors.