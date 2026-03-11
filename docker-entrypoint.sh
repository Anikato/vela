#!/bin/sh
set -e

echo "[vela] Running database migrations..."
node scripts/migrate.mjs

echo "[vela] Running database seed (idempotent)..."
node scripts/seed.mjs

echo "[vela] Starting application..."
exec node server.js
