# ------------------------------------------------------------
# DOCKERFILE FOR MINI SHOPEE BACKEND API (Node.js + Express)
# Multi-stage build with security hardening (non-root user, health check)
# ------------------------------------------------------------
FROM node:20-alpine AS base

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production || npm install --production

# Copy application source
COPY . .

# Ensure data directory has correct permissions
RUN mkdir -p /app/data && chown -R node:node /app

# Switch to non-root node user for security
USER node

# Expose API port
EXPOSE 5000

# Default environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Docker healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the server
CMD ["node", "server.js"]
