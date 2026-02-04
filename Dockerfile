FROM node:18-alpine AS base

WORKDIR /app

COPY package.json bun.lockb* ./

RUN npm install -g bun

RUN bun install --frozen-lockfile

FROM base AS builder
COPY . .
RUN bun run build

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN mkdir -p /app/data
RUN chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
