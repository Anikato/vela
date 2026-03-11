#!/bin/sh
set -e

echo "[vela] Running database migrations..."
node scripts/migrate.mjs

echo "[vela] Starting application..."
exec node server.js
