FROM node:20-alpine AS deps

WORKDIR /app


COPY package*.json ./
RUN npm ci --omit=dev
FROM node:20-alpine AS runner

WORKDIR /app


RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 --ingroup nodejs nodeuser

# Copy only production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

COPY src/ ./src/
COPY package.json ./


USER nodeuser


EXPOSE 3000


HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

  CMD ["node", "src/server.js"]