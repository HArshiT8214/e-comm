#!/bin/bash

echo "🚀 Starting HP Printer E-commerce Platform (Production)..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Start the backend with PM2
echo "📦 Starting backend server..."
cd backend
pm2 start ../ecosystem.config.js --env production

# Keep the container running
echo "✅ Application started successfully!"
echo "🔗 Backend API available at: http://localhost:3001"
echo "📊 Monitoring with PM2..."

# Show PM2 status
pm2 status

# Keep container alive
pm2 logs --lines 1000
