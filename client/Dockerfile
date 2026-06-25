# syntax=docker/dockerfile:1
# Bike Connect SPA — build the static bundle, then serve it with nginx (which
# also reverse-proxies /api and /uploads to the server). Build context is the
# REPO ROOT (the client imports the @bike-connect/shared workspace).

# ---- Build stage: compile shared + build the Vite SPA ----------------------
FROM node:22-alpine3.21 AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci

# shared must be built before the client (it is imported as a workspace dep).
COPY tsconfig.base.json ./
COPY shared ./shared
COPY client ./client
RUN npm run build -w shared && npm run build -w client

# ---- Runtime stage: nginx serves the SPA + proxies the API -----------------
FROM nginx:1.27-alpine AS runtime
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/client/dist /usr/share/nginx/html
EXPOSE 80
# Base image already runs `nginx -g 'daemon off;'` as its CMD.
