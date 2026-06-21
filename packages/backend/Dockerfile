FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json tsconfig.json prisma.config.ts ./
COPY src/ ./src/
COPY prisma/ ./prisma/
RUN npm install && npx prisma generate && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json .
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
EXPOSE 4000
# Run pending migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
