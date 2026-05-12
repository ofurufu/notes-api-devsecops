# ── Stage 1: Install dependencies ──────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files first (layer cache optimization)
# Docker only re-runs npm ci if these files change
COPY package*.json ./
RUN npm ci --only=production

# ── Stage 2: Final image ────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Security: create and run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only production deps from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY src/ ./src/

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

# Document the port (doesn't publish it, just metadata)
EXPOSE 3000

# Health check — Docker and orchestrators (ECS, k8s) use this
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start the app
CMD ["node", "src/index.js"]