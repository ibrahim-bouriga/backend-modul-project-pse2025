#!/usr/bin/env bash
# generate-env.sh
# Reads the root .env file and generates .env files for each service,
# mirroring the docker-compose environment logic but targeting localhost.

set -euo pipefail

ROOT_ENV="${1:-.env}"

if [ ! -f "$ROOT_ENV" ]; then
  echo "Error: '$ROOT_ENV' not found. Pass the path as the first argument or create a .env file."
  exit 1
fi

# ── Load root .env (skip blank lines and comments) ──────────────────────────
while IFS= read -r line || [ -n "$line" ]; do
  [[ "$line" =~ ^[[:space:]]*$ ]] && continue
  [[ "$line" =~ ^# ]] && continue
  export "${line?}"
done < "$ROOT_ENV"

# ── Defaults (mirrors docker-compose ${VAR:-default} syntax) ────────────────
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-changeme}"

CAR_MODELS_POSTGRES_DB="${CAR_MODELS_POSTGRES_DB:-pse2025}"
CAR_MODELS_POSTGRES_PORT="${CAR_MODELS_POSTGRES_PORT:-5432}"
CAR_MODELS_PORT="${CAR_MODELS_PORT:-4001}"

WEBSHOP_POSTGRES_DB="${WEBSHOP_POSTGRES_DB:-webshopdb}"
WEBSHOP_POSTGRES_PORT="${WEBSHOP_POSTGRES_PORT:-5433}"
WEBSHOP_PORT="${WEBSHOP_PORT:-4003}"

REDIS_PORT="${REDIS_PORT:-6379}"

MQTT_PORT="${MQTT_PORT:-1883}"
MQTT_WS_PORT="${MQTT_WS_PORT:-9001}"

MINIO_ENDPOINT="${MINIO_ENDPOINT:-localhost}"
MINIO_PORT="${MINIO_PORT:-9000}"
MINIO_ROOT_USER="${MINIO_ROOT_USER:-minioadmin}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-minioadmin}"
MINIO_USE_SSL="${MINIO_USE_SSL:-false}"

SERVICE_MYPSECARS_PORT="${SERVICE_MYPSECARS_PORT:-4004}"

# ── car_models ───────────────────────────────────────────────────────────────
cat > packages/car_models/.env <<EOF
PORT=${CAR_MODELS_PORT}
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${CAR_MODELS_POSTGRES_PORT}/${CAR_MODELS_POSTGRES_DB}
MINIO_ENDPOINT=localhost
MINIO_PORT=${MINIO_PORT}
MINIO_ROOT_USER=${MINIO_ROOT_USER}
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
MINIO_USE_SSL=${MINIO_USE_SSL}
MINIO_PUBLIC_URL=http://localhost:${MINIO_PORT}
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=${MQTT_PORT}
MQTT_WS_PORT=${MQTT_WS_PORT}
EOF
echo "Generated packages/car_models/.env"

# ── service-mypsecars ────────────────────────────────────────────────────────
cat > packages/service-mypsecars/.env <<EOF
PORT=${SERVICE_MYPSECARS_PORT}
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=${MQTT_PORT}
EOF
echo "Generated packages/service-mypsecars/.env"

# ── webshop ──────────────────────────────────────────────────────────────────
cat > packages/webshop/.env <<EOF
PORT=${WEBSHOP_PORT}
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${WEBSHOP_POSTGRES_PORT}/${WEBSHOP_POSTGRES_DB}
REDIS_URL=redis://localhost:${REDIS_PORT}
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=${MQTT_PORT}
MQTT_WS_PORT=${MQTT_WS_PORT}
MINIO_ENDPOINT=localhost
MINIO_PORT=${MINIO_PORT}
MINIO_ROOT_USER=${MINIO_ROOT_USER}
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
MINIO_USE_SSL=${MINIO_USE_SSL}
EOF
echo "Generated packages/webshop/.env"

echo ""
echo "Done. Run this script again whenever you change .env."
