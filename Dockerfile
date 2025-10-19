# Multi-stage build for HP Printer E-commerce Platform
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci --only=production

# Backend build stage
FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Frontend build stage
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Production stage
FROM node:18-alpine AS production

# Install PM2 globally
RUN npm install -g pm2

# Set working directory
WORKDIR /app

# Copy backend files
COPY --from=backend-builder /app/backend ./backend

# Copy frontend build
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Copy other necessary files
COPY ecosystem.config.js ./
COPY start-production.sh ./

# Make start script executable
RUN chmod +x start-production.sh

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application
CMD ["./start-production.sh"]
