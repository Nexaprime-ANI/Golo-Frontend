# ==============================
# Builder Stage
# ==============================
FROM node:20-bullseye-slim AS builder

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN echo $NEXT_PUBLIC_API_URL


# Build app
RUN npm run build


# ==============================
# Production Stage
# ==============================
FROM node:20-bullseye-slim AS runner

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r nextjs && \
    useradd -r -g nextjs -d /app -s /usr/sbin/nologin nextjs

# Copy standalone build
COPY --from=builder /app/.next/standalone ./

# Copy static assets
COPY --from=builder /app/.next/static ./.next/static

# Copy public folder
COPY --from=builder /app/public ./public

# Permissions
RUN chown -R nextjs:nextjs /app

USER nextjs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3001 || exit 1

# Start Next.js
CMD ["node", "server.js"]