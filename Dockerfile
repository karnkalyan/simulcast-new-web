FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production
ENV PORT=3079
ENV HOSTNAME=0.0.0.0
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/server.mjs ./server.mjs
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/src ./src
EXPOSE 3079
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push --skip-generate || true; (npx tsx prisma/seed.ts || true); node server.mjs"]
