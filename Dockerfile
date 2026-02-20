# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Non-root user for security
RUN addgroup -S gateway && adduser -S gateway -G gateway

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src/

USER gateway

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 8080

CMD ["node", "src/server.js"]
