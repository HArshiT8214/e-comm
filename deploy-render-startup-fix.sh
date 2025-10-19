#!/bin/bash

echo "🚀 Deploying with Startup Script Fix"
echo "===================================="

echo "✅ Applied fixes:"
echo "1. Removed problematic start-production.sh script"
echo "2. Simplified Docker startup to use direct node command"
echo "3. Removed PM2 dependency for simpler deployment"
echo "4. Direct startup: 'node backend/src/server.js'"

echo ""
echo "📋 Current Docker configuration:"
echo "- Uses 'node backend/src/server.js' directly"
echo "- No external script dependencies"
echo "- Simplified startup process"
echo "- Backend-only build"

echo ""
echo "🚀 Deploying to Render..."

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Fix startup script not found error

- Simplified Docker startup to use direct node command
- Removed dependency on start-production.sh script
- Changed CMD to: node backend/src/server.js
- Eliminates 'not found' errors and simplifies deployment
- Backend starts directly without external scripts"

echo ""
echo "📦 Pushing to GitHub..."

# Push to main branch
git push origin main

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "🔍 Monitor your deployment:"
echo "1. Go to: https://dashboard.render.com"
echo "2. Check your service status"
echo "3. View build logs"
echo ""
echo "🧪 Test your deployment:"
echo "Health check: https://your-service.onrender.com/health"
echo "API base: https://your-service.onrender.com/api"
echo ""
echo "🎉 This should resolve the startup script 'not found' error!"
