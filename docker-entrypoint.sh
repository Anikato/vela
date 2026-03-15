#!/bin/sh
set -e

# Fix ownership of the uploads directory (may be mounted as a host volume owned by root)
chown -R nextjs:nodejs /app/public/uploads 2>/dev/null || true

echo "[vela] Running database migrations..."
su-exec nextjs node scripts/migrate.mjs

echo "[vela] Running database seed (idempotent)..."
su-exec nextjs node scripts/seed.mjs

echo "[vela] Starting application..."
exec su-exec nextjs node server.js
