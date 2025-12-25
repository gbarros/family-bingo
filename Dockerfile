# Multi-stage build for Christmas Bingo Next.js app

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Next.js app (standalone output)
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create data directory for SQLite with proper permissions
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Copy built files from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy package files for rebuilding native modules
COPY --from=builder /app/package*.json ./

# Rebuild better-sqlite3 for the production architecture
RUN npm ci --production --ignore-scripts && \
    npm rebuild better-sqlite3

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]
