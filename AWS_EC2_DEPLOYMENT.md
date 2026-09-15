# ShopSense — AWS EC2 Deployment Guide

This guide explains how to run the full ShopSense application on an AWS EC2 Ubuntu server using Docker Compose.

---

## What Will Run on EC2

| Service | Technology | Port |
|---|---|---|
| Frontend | React + Nginx | 8080 |
| Backend API | Node.js / Express | 5000 |
| Realtime Service | FastAPI / WebSocket | 8000 |
| Database | MongoDB Atlas (cloud) | External |

---

## Before You Start

You need:
- An **AWS EC2** instance running **Ubuntu 22.04 LTS** (t2.micro or larger)
- A **MongoDB Atlas** account with your connection string ready
- Your **OpenRouter API key** (from https://openrouter.ai)
- An **SSH key** to connect to your EC2

---

## Step 1 — Open Ports in EC2 Security Group

In the AWS Console, go to **EC2 → Security Groups** and add these inbound rules:

| Port | Protocol | Source | Purpose |
|---|---|---|---|
| 22 | TCP | Your IP | SSH access |
| 8080 | TCP | 0.0.0.0/0 | Frontend |
| 5000 | TCP | 0.0.0.0/0 | Backend API |
| 8000 | TCP | 0.0.0.0/0 | FastAPI / WebSocket |

---

## Step 2 — Connect to Your EC2

```bash
ssh -i your-key.pem ubuntu@<your-ec2-public-ip>
```

---

## Step 3 — Copy the Project to EC2

**Option A — Clone from GitHub (easiest)**
```bash
git clone https://github.com/your-username/ShopSense.git
cd ShopSense
```

**Option B — Copy from your computer**
```bash
# Run this from your local machine (not EC2)
scp -i your-key.pem -r ./ShopSense ubuntu@<ec2-ip>:~/ShopSense
```

---

## Step 4 — Create the Backend `.env` File on EC2

On EC2, create the secrets file:

```bash
cd ~/ShopSense
nano backend/.env
```

Paste and fill in your real values:

```
MONGO_URI=mongodb+srv://YourUser:YourPass@yourcluster.mongodb.net/shopsense
JWT_SECRET=some_long_random_secret_string_here
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key
PORT=5000
```

Save with `Ctrl+O`, then `Enter`, then `Ctrl+X`.

> ⚠️ **Never commit this file to GitHub.** It is already listed in `.gitignore`.

---

## Step 5 — Run the Deployment Script

Make the script executable and run it:

```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. Install Docker and Docker Compose (if not already installed)
2. Detect your EC2 public IP automatically
3. Build all three containers (frontend, backend, realtime)
4. Start everything in the background

---

## Step 6 — Verify It Is Working

After the script finishes, open a browser and test:

| What to test | URL |
|---|---|
| Frontend app | `http://<your-ec2-ip>:8080` |
| Backend health | `http://<your-ec2-ip>:5000/` |
| FastAPI docs | `http://<your-ec2-ip>:8000/docs` |
| FastAPI health | `http://<your-ec2-ip>:8000/health` |

---

## Useful Commands on EC2

```bash
# Check if all containers are running
docker compose ps

# View live logs from all containers
docker compose logs -f

# View logs from one specific container
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f realtime_service

# Stop all containers
docker compose down

# Rebuild and restart (after code changes)
VITE_API_URL=http://<ec2-ip>:5000/api docker compose up --build -d
```

---

## How the Three Services Connect

```
User Browser
    │
    ├── HTTP → EC2:8080 → Frontend (Nginx + React)
    │               │
    │               └── API calls → EC2:5000 → Backend (Node.js)
    │                                   │
    │                                   └── Sale events → EC2:8000 → FastAPI Realtime
    │
    └── WebSocket → EC2:8000 → FastAPI Realtime (real-time dashboard)
```

- The **frontend** calls the backend using `VITE_API_URL` (set at build time).
- The **backend** sends sale events to FastAPI using `FASTAPI_REALTIME_URL=http://realtime_service:8000` (internal Docker network).
- The **browser** connects to the WebSocket directly at `ws://<ec2-ip>:8000`.
- The **database** (MongoDB Atlas) is cloud-hosted — no local setup needed.

---

## Common Problems

| Problem | Solution |
|---|---|
| Cannot reach frontend | Check EC2 Security Group — port 8080 must be open |
| Login fails | Check `MONGO_URI` and `JWT_SECRET` in `backend/.env` |
| No real-time notifications | Check port 8000 is open; verify WebSocket URL in browser console |
| Container build fails | Run `docker compose logs realtime_service` or `docker compose logs backend` |
| Changes not showing | Run `docker compose down && docker compose up --build -d` |

---

## After Deployment

- The application runs 24/7 with `restart: unless-stopped`.
- The AI Agent sends weekly vendor reports every Monday at 9 AM (requires email config).
- To update the app: pull new code, then re-run `deploy.sh`.
