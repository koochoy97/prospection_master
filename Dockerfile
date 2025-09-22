# Multi-stage Dockerfile to build and serve a Vite React app

# 1) Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (leverage caching)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Accept build-time env for Vite (Coolify: set as Build Args)
ARG VITE_NOCODB_TOKEN
ARG VITE_NOCODB_BASE_URL
ARG VITE_NOCODB_VIEW_ID
ENV VITE_NOCODB_TOKEN=$VITE_NOCODB_TOKEN \
    VITE_NOCODB_BASE_URL=$VITE_NOCODB_BASE_URL \
    VITE_NOCODB_VIEW_ID=$VITE_NOCODB_VIEW_ID

# Build static assets
RUN npm run build

# 2) Serve stage
FROM nginx:1.27-alpine AS runner

# Copy build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Basic SPA config: fallback to index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

