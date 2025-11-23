#!/bin/sh
set -euo pipefail

# Build a runtime config file for the frontend from environment variables.
cat > /usr/share/nginx/html/scripts/config.js <<CONFIG
window.__REDIS_WEB_CONFIG = {
  host: "${REDIS_WEB_HOST:-}",
  port: "${REDIS_WEB_PORT:-}",
  username: "${REDIS_WEB_USERNAME:-}",
  password: "${REDIS_WEB_PASSWORD:-}",
  prefillPassword: "${PREFILL_PASSWORD:-false}" === "true",
  proxyUrl: "${REDIS_WEB_PROXY_URL:-}"
};
CONFIG

exec nginx -g "daemon off;"
