# Backend-only Dockerfile for HP Printer E-commerce Platform
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend dependencies
RUN cd backend && npm ci --only=production

# Copy backend source code
COPY backend/ ./backend/

# Copy ecosystem config
COPY ecosystem.config.js ./

# Copy production start script
COPY start-production.sh ./

# Make start script executable
RUN chmod +x start-production.sh

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application
CMD ["./start-production.sh"]
