FROM node:22-alpine AS base

# --- Dependencies (pnpm, for building) ---
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && corepack install && pnpm install --frozen-lockfile

# --- Builder ---
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG CACHE_BUST
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npx next build

# --- Runtime deps (npm flat layout, avoids pnpm symlink issues) ---
FROM base AS runtime-deps
WORKDIR /deps
RUN npm init -y > /dev/null 2>&1 && \
    npm install --omit=dev postgres bcryptjs sharp pino

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

# Merge runtime deps into standalone's node_modules
COPY --from=runtime-deps /deps/node_modules /tmp/runtime_modules
RUN cd node_modules && \
    for pkg in /tmp/runtime_modules/*; do rm -rf "./$(basename "$pkg")"; done && \
    cp -r /tmp/runtime_modules/* ./ && \
    rm -rf /tmp/runtime_modules

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
