# syntax=docker/dockerfile:1
# Bike Connect API — multi-stage build. Build context is the REPO ROOT
# (the server depends on the @bike-connect/shared workspace).

# ---- Build stage: install all workspaces, compile shared + server ----------
FROM node:22-alpine3.21 AS builder
WORKDIR /app

# Install deps first so this layer is cached unless a manifest changes.
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci

# shared must be built before server (server's tsc consumes its .d.ts).
COPY tsconfig.base.json ./
COPY shared ./shared
COPY server ./server
RUN npm run build -w shared \
 && npm run build -w server \
 && npm prune --omit=dev

# ---- Runtime stage: minimal, non-root, prod dependencies only --------------
FROM node:22-alpine3.21 AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Non-root user (UID 1001).
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Pruned prod node_modules (the @bike-connect/shared workspace symlink is kept)
# plus the compiled output. shared/dist is the symlink target, so it ships too.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/shared/package.json ./shared/package.json
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/server/dist ./server/dist

# Uploads dir — a named volume mounts here and inherits this ownership on first
# init, so the non-root user can write uploaded images.
RUN mkdir -p /app/uploads && chown -R nodejs:nodejs /app/uploads

USER nodejs
EXPOSE 3000

# Liveness/readiness — the API's own health route.
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/dist/index.js"]
