# Build stage
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder
WORKDIR /app
ARG VITE_APP_BASE_PATH=/
ENV VITE_APP_BASE_PATH=${VITE_APP_BASE_PATH}
COPY package*.json ./
COPY vendor/gouno-ui-0.1.0.tgz ./vendor/
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Runtime stage
FROM nginx:stable-alpine

# Run nginx as non-root
RUN apk upgrade --no-cache \
    && mkdir -p /etc/nginx/snippets \
    && chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid

COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/snippets/security-headers.conf

USER nginx

EXPOSE 8083

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8083/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
