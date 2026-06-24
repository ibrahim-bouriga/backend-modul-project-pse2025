FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json tsconfig.json ./
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY prisma/ ./prisma/
RUN npm install && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY package.json ./
COPY prisma/ ./prisma/
RUN npm install --omit=dev && npx prisma generate
COPY --from=builder /app/dist ./dist
EXPOSE 4001
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
