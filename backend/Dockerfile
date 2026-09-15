FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules (e.g., sqlite3, bcrypt)
RUN apk add --no-cache python3 make g++

# Copy dependency manifests first to leverage Docker layer caching
COPY package*.json ./

# Clean install dependencies
RUN npm ci

# Copy backend application source code
COPY . .

# Expose Express server port
EXPOSE 5000

# Start backend server in production mode (no file watching)
CMD ["node", "server.js"]
