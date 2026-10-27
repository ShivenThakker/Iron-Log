FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace roots and package definitions
COPY package*.json ./
COPY prisma.config.ts ./
COPY packages ./packages
COPY apps/api/package*.json ./apps/api/

# Install monorepo dependencies
RUN npm ci

# Build shared package first
RUN npm run build --workspace=@ironlog/shared

# Copy API application source
COPY apps/api ./apps/api

# Generate Prisma Client and compile TypeScript
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
COPY prisma.config.ts ./
COPY packages ./packages
COPY apps/api/package*.json ./apps/api/

RUN npm ci --omit=dev

# Copy compiled shared package
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Copy compiled API dist and generated Prisma artifacts
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/index.js"]
