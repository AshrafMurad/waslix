FROM node:22-bookworm-slim AS deps

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:22-bookworm-slim AS builder

WORKDIR /app

ENV BETTER_AUTH_SECRET=build-time-placeholder-secret-32chars \
  BETTER_AUTH_URL=http://localhost:3000 \
  DATABASE_URL=postgresql://waslix:waslix@localhost:5432/waslix?schema=public \
  NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  NEXT_TELEMETRY_DISABLED=1 \
  NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV HOSTNAME=0.0.0.0 \
  NEXT_TELEMETRY_DISABLED=1 \
  NODE_ENV=production \
  PORT=3000 \
  WORKER_HEARTBEAT_FILE=/tmp/waslix-worker-heartbeat

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app ./

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]
