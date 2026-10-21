# 🚀 Kubernetes Core Concepts Practice Application

This repository contains a complete, hands-on practice setup for a containerized **Guestbook Application** (Frontend Nginx Web App + Backend MySQL Database). It is designed as a practical learning blueprint to understand how fundamental Kubernetes objects interact to build an isolated, self-healing, and externally accessible architecture.

---

## 🗺️ Architectural Concept Architecture & Flow

```text
[ Developer Laptop ] 
       │  (1. Build & Push Image)
       ▼
[ Docker Registry (Hub) ] <────────────────────────────────┐ (3. Pulls Image)
                                                           │
========================= KUBERNETES CLUSTER ==============│=========================
[ Namespace: practice-app ]                                │
                                                           │
  [ Ingress ] ──────────> [ Service: web-service ] ────────┘
  (External Web Traffic)   (Stable Cluster IP & LB)
                               │
                               ▼ (Distributes Requests)
                        [ Deployment: web-deployment ]
                               │
                               ├──> [ Pod 1 ] ──┐
                               ├──> [ Pod 2 ] ──┼──> Injected: [ ConfigMap / Secret ]
                               ├──> [ Pod 3 ] ──┤
                               ├──> [ Pod 4 ] ──┤
                               └──> [ Pod 5 ] ──┘
                                      │
                                      ▼ (Data Persistence)
                                [ Volume (PVC) ]
```

---

## 🗂️ Kubernetes Concepts Cheat Sheet

| Concept | Abstraction Level | Purpose | Application in this Project |
| :--- | :--- | :--- | :--- |
| **Namespace** | Organization | Logical isolation of resources. | Groups all objects inside `practice-app` to avoid collisions. |
| **ConfigMap** | Configuration | Stores non-sensitive variables. | Holds the database hostname (`DB_HOST`). |
| **Secret** | Configuration | Stores encrypted sensitive data (Base64). | Holds the database root password (`DB_PASSWORD`). |
| **Volume (PVC)** | Storage | Persistent storage outliving Pod lifecycles. | Prevents data loss when the MySQL database pod restarts. |
| **Deployment**| Application | Manages, updates, and scales Pod states. | Maintains our target scale of 5 Frontend Pods. |
| **Pod** | Application | Smallest deployable container unit. | The actual running instances of Nginx and MySQL. |
| **Service** | Networking | Stable internal IP & basic load balancer. | Maps traffic dynamically across temporary, fragile Pod IPs. |
| **Ingress** | Networking | HTTP/HTTPS smart router at cluster edge. | Proxies external web requests to the internal frontend service. |

---

## 🏗️ External Access Methods Explained

To expose an application to the outside world, Kubernetes provides different networking entry points:

1. **NodePort (Used Here):** Opens a static high-numbered port (`30000-32767`) directly on every physical or virtual server (Node) in your cluster. It is excellent for local testing but exposes raw server interfaces.
2. **LoadBalancer:** Requests a dedicated external network load balancer from a public cloud vendor (like AWS, GCP, Azure). It provisions a public, dedicated IP address for your service.
3. **Ingress (Best Practice):** Acts as a consolidated single gateway/traffic cop for the entire cluster. Instead of buying a cloud LoadBalancer for every application, a single Ingress Controller routes traffic to dozens of services based on domain names or URL paths.

---

## 🚀 Step-by-Step Deployment Guide

### Prerequisites
Ensure you have [Minikube](https://k8s.io) and [kubectl](https://kubernetes.io) installed. Start your local cluster:
```bash
minikube start
```

### 1. Create the Isolated Environment (Namespace)
Initialize the boundary to keep your practice resources separate:
```bash
kubectl apply -f 01-namespace.yaml
```

### 2. Inject Configuration (ConfigMap & Secret)
Apply the application configuration parameters into the cluster memory:
```bash
kubectl apply -f 02-config-secret.yaml
```

### 3. Provision Persistent Storage (Volume)
Carve out hard drive space on the Node so your database records are safe:
```bash
kubectl apply -f 03-storage.yaml
```

### 4. Deploy the Backend & Frontend Workloads
Launch your database and application tiers alongside their corresponding cluster Services:
```bash
kubectl apply -f 04-backend.yaml
kubectl apply -f 05-frontend.yaml
```

### 5. Configure Routing Gateway (Ingress)
Enable external HTTP pathways to reach your internal network components:
```bash
kubectl apply -f 06-ingress.yaml
```

---

## 🧪 Day-2 Operations & Practice Lab

### How to Scale Your Workloads
Command the Deployment controller to upscale your application infrastructure effortlessly from 2 to 5 concurrent replicas:
```bash
kubectl scale deployment/web-deployment --replicas=5 -n practice-app
```

### How to Verify Live Resources
Inspect the complete deployment state inside your logical namespace:
```bash
kubectl get all -n practice-app
```

### How to Stream Aggregated Logs
Monitor incoming web requests balancing across all 5 frontend container instances in real-time:
```bash
kubectl logs -l app=web-frontend -n practice-app -f --tail=1
```

### How to Access the App Locally
If browser-hooking scripts throw pipe errors on your local Linux machine, safely bypass it by using the direct console URL generator:
```bash
minikube service web-service -n practice-app --url
```
*Copy and paste the returned IP/Port address string straight into your standard web browser window.*
