FROM node:22-alpine AS base

# --- Dependencies ---
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile --shamefully-hoist

# --- Builder ---
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN corepack enable pnpm && pnpm build

# --- Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache su-exec

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Script dependencies
COPY --from=deps /app/node_modules/postgres ./node_modules/postgres
COPY --from=deps /app/node_modules/bcryptjs ./node_modules/bcryptjs

# sharp (native image processing) — copy the package + platform-specific binary
COPY --from=deps /app/node_modules/sharp ./node_modules/sharp
COPY --from=deps /app/node_modules/@img ./node_modules/@img

# pino structured logging
COPY --from=deps /app/node_modules/pino ./node_modules/pino
COPY --from=deps /app/node_modules/pino-std-serializers ./node_modules/pino-std-serializers
COPY --from=deps /app/node_modules/sonic-boom ./node_modules/sonic-boom
COPY --from=deps /app/node_modules/atomic-sleep ./node_modules/atomic-sleep
COPY --from=deps /app/node_modules/fast-redact ./node_modules/fast-redact
COPY --from=deps /app/node_modules/on-exit-leak-free ./node_modules/on-exit-leak-free
COPY --from=deps /app/node_modules/quick-format-unescaped ./node_modules/quick-format-unescaped
COPY --from=deps /app/node_modules/thread-stream ./node_modules/thread-stream
COPY --from=deps /app/node_modules/real-require ./node_modules/real-require
COPY --from=deps /app/node_modules/safe-stable-stringify ./node_modules/safe-stable-stringify

# Migration/seed files and entrypoint script
COPY --from=builder --chown=nextjs:nodejs /app/src/server/db/migrations ./migrations
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=builder --chown=nextjs:nodejs /app/scripts/seed.mjs ./scripts/seed.mjs
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

RUN mkdir -p /app/public/uploads && chown nextjs:nodejs /app/public/uploads

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./docker-entrypoint.sh"]
