# syntax=docker/dockerfile:1

# --- deps ---------------------------------------------------------------
FROM oven/bun:1-alpine AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# --- build --------------------------------------------------------------
FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# CI / fresh clone often has no contracts.json (gitignored) — fallback to template
RUN test -f contracts.json || cp contracts.example.json contracts.json

ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# --- run ----------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
	&& adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080

CMD ["node", "server.js"]
