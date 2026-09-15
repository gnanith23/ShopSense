# ==================== STAGE 1: BUILD REACT SPA ====================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package*.json ./

# Install dependencies using npm ci
RUN npm ci

# Copy frontend source code
COPY . .

# Build arguments: customize API URL and WebSocket URL at build time
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_WS_URL=ws://localhost:8000
ENV VITE_WS_URL=$VITE_WS_URL

# Build production bundle with Vite
RUN npm run build

# ==================== STAGE 2: SERVE WITH NGINX ====================
FROM nginx:alpine

# Copy compiled SPA assets to Nginx default html folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration supporting React Router SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port 80
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
