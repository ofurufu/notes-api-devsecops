# Dockerfile

# ─── Stage 1: Install ALL dependencies (including dev, for potential build steps) ─
FROM node:20-alpine AS deps
WORKDIR /app

# Copy lockfile and manifest first — Docker caches this layer.
# If package*.json hasn't changed, this layer is reused on next build.
COPY package*.json ./
RUN npm ci

# ─── Stage 2: Production runner ──────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Create a non-root system user and group.
# Running as root inside a container is a critical security risk.
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 --ingroup nodejs nodeuser

# Copy only production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY src/ ./src/
COPY package.json ./

# Switch to non-root user before the final layers
# (the files above are owned by root, which is fine — nodeuser can read them)
USER nodeuser

# Document the port the app listens on (doesn't actually publish it)
EXPOSE 3000

# Health check — Docker will call this every 30s.
# If it fails 3 times in a row, the container is marked unhealthy.
# GitHub Actions and Kubernetes both respect this.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start the server
CMD ["node", "src/server.js"]