# Multi-stage Docker build for HP Printer E-commerce Platform

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies (production only)
RUN npm install --omit=dev


# Copy frontend source code
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Stage 3: Production Image
FROM node:18-alpine AS production

# Install PM2 globally
RUN npm install -g pm2

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy backend from builder stage
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend ./backend

# Copy frontend build from builder stage
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/build ./frontend/build

# Copy PM2 configuration
COPY --chown=nextjs:nodejs ecosystem.config.js ./

# Create logs directory
RUN mkdir -p logs && chown nextjs:nodejs logs

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]
