#!/bin/sh
set -eu
cd "$(dirname "$0")/.."

docker compose up -d db

i=0
until docker compose exec -T db pg_isready -U catraca -d catraca; do
  i=$((i + 1))
  if [ "$i" -gt 30 ]; then
    echo "Postgres nao ficou pronto" >&2
    exit 1
  fi
  sleep 1
done

docker compose exec -T db psql -U catraca -d postgres -c "CREATE DATABASE catraca_test" || true
docker compose build app
docker compose run --rm \
  -e DATABASE_URL=postgres://catraca:catraca@db:5432/catraca_test \
  -e PARTNER_API_KEY=partner_key_catraca_dev \
  -e SESSION_SECRET=catraca-dev-session-secret \
  -e GATEWAY_FAST_MIN_MS=800 \
  -e GATEWAY_FAST_MAX_MS=1200 \
  -e GATEWAY_SLOW_MIN_MS=3000 \
  -e GATEWAY_SLOW_MAX_MS=3500 \
  app npm test

echo "Gates ok"
