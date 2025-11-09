# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:22.12.0-alpine AS builder
WORKDIR /app

# Install dependencies
COPY retro-terrain/package.json retro-terrain/package-lock.json ./
RUN npm ci

# Build static assets
COPY retro-terrain/ ./
RUN npm run build

# ---- Runtime stage ----
FROM node:22.12.0-alpine
WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080

# Install a lightweight static file server
RUN npm install -g serve

# Copy built assets
COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${PORT}"]
