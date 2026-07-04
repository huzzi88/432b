# ═══════════════════════════════════════════════
# KEPLER432B Backend — Production Dockerfile
# Migrations run automatically on startup
# ═══════════════════════════════════════════════

# Stage 1: Build TypeScript → JavaScript
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Production deps only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JS
COPY --from=builder /app/dist ./dist

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Migrations run inside server.ts startServer() — no ts-node needed
CMD ["node", "dist/server.js"]
