# ── Stage 1: Install dependencies ──────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
# Must install devDependencies: globals.css does `@import "shadcn/tailwind.css"`,
# and shadcn is a devDependency (it drags in hono/undici/ip-address, which have
# no business in the runtime tree). Do NOT add --omit=dev or set
# NODE_ENV=production here -- the Tailwind build in stage 2 would fail to
# resolve that import. Only the stage 3 runner sets NODE_ENV=production.
RUN npm ci

# ── Stage 2: Build the Next.js app ────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: Production runner ────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3009

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3009

CMD ["node", "server.js"]
