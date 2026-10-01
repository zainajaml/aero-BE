# syntax=docker/dockerfile:1

# --- Build: static SPA bundle -------------------------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# Browser-visible API origin, fixed at build time. Empty = same origin (nginx proxies /api below).
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# --- Runtime: nginx serving dist with SPA fallback ----------------------------------------------
FROM nginx:alpine

# Where /api, /mcp and the OAuth discovery documents are proxied to (same-origin deployment).
ENV API_UPSTREAM=http://api:4000 \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1

COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
