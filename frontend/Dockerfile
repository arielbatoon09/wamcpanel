# Stage 1: Base stage with Node.js Alpine image
FROM node:22-alpine AS base

# Install libc6-compat for compatibility and globally install specific npm version
RUN apk add --no-cache libc6-compat && \
  npm install -g npm@10.8.2

# Stage 2: Development stage starts from the base image
FROM base AS development

WORKDIR /app

# Copy package files to leverage caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Inform Docker that the dev server runs on port 3000
EXPOSE 3000

CMD ["npm", "run", "dev"]

# Stage 3: Builder stage builds the app
FROM development AS builder

# Set Next.js build-time environment variable to skip telemetry
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the Next.js application
RUN npm run build

# Stage 4: Runner stage starts from base again for a clean, minimal image
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root group and user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets and built static files (which aren't included in standalone)
COPY --from=builder /app/public ./public

# Set correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Run Next.js server entry point
CMD ["node", "server.js"]