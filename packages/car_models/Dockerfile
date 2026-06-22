FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json tsconfig.json prisma.config.ts ./
COPY src/ ./src/
COPY prisma/ ./prisma/
RUN npm install && npx prisma generate && npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json .
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY images/ ./images/
EXPOSE 4001
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/index.js"]
