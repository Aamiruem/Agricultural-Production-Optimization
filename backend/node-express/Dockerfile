# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
USER node
EXPOSE 4100
HEALTHCHECK --interval=20s --timeout=5s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:4100/health || exit 1
CMD ["node", "src/server.js"]
