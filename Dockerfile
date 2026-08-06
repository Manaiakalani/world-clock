# ── Stage 1: Install dependencies ──────────────────────────────────
FROM node:25-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
# Must install devDependencies: globals.css does `@import "shadcn/tailwind.css"`,
# and shadcn is a devDependency (it drags in hono/undici/ip-address, which have
# no business in the runtime tree). Do NOT add --omit=dev or set
# NODE_ENV=production here -- the Tailwind build in stage 2 would fail to
# resolve that import. Only the stage 3 runner sets NODE_ENV=production.
RUN npm ci

# ── Stage 2: Build the Next.js app ────────────────────────────────
FROM node:25-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so the
# public origin has to be supplied here rather than at container start. It feeds
# canonical URLs, robots.txt, sitemap.xml and .well-known/security.txt.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: Production runner ────────────────────────────────────
FROM node:25-alpine AS runner
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
