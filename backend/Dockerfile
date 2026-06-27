# Stage 1: Builder
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat && \
    npm install -g npm@10.9.3

WORKDIR /builder

COPY package.json package-lock.json ./

RUN npm install --frozen-lockfile

COPY . .

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

RUN npm run db:generate
RUN npm run build

# Stage 2: Runner
FROM node:22-alpine AS runner

WORKDIR /app

COPY package.json package-lock.json ./

# Install ALL dependencies because `prisma migrate deploy`
# requires the Prisma CLI.
RUN npm install --frozen-lockfile

COPY --from=builder /builder/prisma ./prisma
COPY --from=builder /builder/prisma.config.ts ./prisma.config.ts
COPY --from=builder /builder/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /builder/dist ./dist

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

EXPOSE 8000

CMD ["npm", "start"]