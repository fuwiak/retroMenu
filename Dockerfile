# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:22.12.0-alpine AS builder
WORKDIR /app

# Build arguments for Vite environment variables
ARG VITE_YOUTUBE_API_KEY=""
ARG VITE_VK_TOKEN=""

# Expose them as environment variables for npm scripts
ENV VITE_YOUTUBE_API_KEY=${VITE_YOUTUBE_API_KEY}
ENV VITE_VK_TOKEN=${VITE_VK_TOKEN}

# Install dependencies
COPY retro-terrain/package.json retro-terrain/package-lock.json ./
RUN npm ci

# Copy source
COPY retro-terrain/ ./

# Ensure required env vars exist for the build
RUN if [ -z "$VITE_YOUTUBE_API_KEY" ]; then \
      echo "VITE_YOUTUBE_API_KEY is required at build time" && exit 1; \
    fi

# Persist env vars for Vite build
RUN printf "VITE_YOUTUBE_API_KEY=%s\nVITE_VK_TOKEN=%s\n" "$VITE_YOUTUBE_API_KEY" "$VITE_VK_TOKEN" > .env.production

# Build static assets
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
