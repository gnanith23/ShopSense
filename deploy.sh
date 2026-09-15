#!/bin/bash
# ============================================================
# ShopSense - AWS EC2 Deployment Script
# ============================================================
# Run this script on your EC2 Ubuntu instance ONCE to set up
# and start the full ShopSense application stack.
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
# ============================================================

set -e  # Stop the script if any command fails

echo ""
echo "============================================"
echo "  ShopSense - AWS EC2 Deployment Script"
echo "============================================"
echo ""

# ---- Step 1: Install Docker (if not already installed) ----
if ! command -v docker &> /dev/null; then
    echo "[1/6] Installing Docker..."
    sudo apt-get update -y
    sudo apt-get install -y docker.io
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    echo "Docker installed. You may need to log out and log back in."
else
    echo "[1/6] Docker is already installed. Skipping."
fi

# ---- Step 2: Install Docker Compose (if not already installed) ----
if ! command -v docker compose &> /dev/null; then
    echo "[2/6] Installing Docker Compose plugin..."
    sudo apt-get install -y docker-compose-plugin
else
    echo "[2/6] Docker Compose is already installed. Skipping."
fi

# ---- Step 3: Detect EC2 Public IP ----
echo "[3/6] Detecting EC2 public IP..."
EC2_IP=$(curl -s http://checkip.amazonaws.com || curl -s http://ifconfig.me)
if [ -z "$EC2_IP" ]; then
    echo "Could not detect public IP automatically."
    read -p "Please enter your EC2 public IP: " EC2_IP
fi
echo "    EC2 Public IP: $EC2_IP"

# ---- Step 4: Create backend/.env if it does not exist ----
echo "[4/6] Checking backend environment file..."
if [ ! -f "backend/.env" ]; then
    echo ""
    echo "ERROR: backend/.env file not found."
    echo "Please create backend/.env with the following variables:"
    echo ""
    echo "  MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/shopsense"
    echo "  JWT_SECRET=<your_long_random_secret>"
    echo "  OPENROUTER_API_KEY=<your_openrouter_key>"
    echo ""
    echo "Then run this script again."
    echo ""
    exit 1
fi
echo "    backend/.env found."

# ---- Step 5: Build and Start Docker Containers ----
echo "[5/6] Building and starting all containers..."
echo "    Frontend will use API URL: http://${EC2_IP}:5000/api"
echo ""

# Export environment variables for docker-compose
export VITE_API_URL="http://${EC2_IP}:5000/api"
export VITE_WS_URL="ws://${EC2_IP}:8000"
export BACKEND_PORT=5000
export FRONTEND_PORT=8080
export REALTIME_PORT=8000

# Build fresh and start in detached mode
docker compose down --remove-orphans 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

# ---- Step 6: Show Status ----
echo ""
echo "[6/6] Deployment complete!"
echo ""
echo "============================================"
echo "  ShopSense is now running on your EC2!"
echo "============================================"
echo ""
echo "  Frontend:        http://${EC2_IP}:8080"
echo "  Backend API:     http://${EC2_IP}:5000/api"
echo "  FastAPI Docs:    http://${EC2_IP}:8000/docs"
echo "  WebSocket:       ws://${EC2_IP}:8000/ws/vendor/<vendorId>"
echo ""
echo "Make sure these ports are open in your EC2 Security Group:"
echo "  - TCP 8080  (Frontend)"
echo "  - TCP 5000  (Backend API)"
echo "  - TCP 8000  (FastAPI / WebSocket)"
echo ""
echo "To check container status:  docker compose ps"
echo "To view logs:               docker compose logs -f"
echo "To stop all:                docker compose down"
echo ""
