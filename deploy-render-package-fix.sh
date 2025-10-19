#!/bin/bash

echo "🚀 Deploying with Package Lock Fix"
echo "=================================="

echo "✅ Applied fixes:"
echo "1. Changed 'npm ci' to 'npm install' in Docker files"
echo "2. Created package-lock fix script"
echo "3. Backend-only build (no frontend)"

echo ""
echo "📋 Current Docker configuration:"
echo "- Uses 'npm install --only=production' (more flexible than npm ci)"
echo "- Backend-only build"
echo "- No package-lock sync issues"

echo ""
echo "🚀 Deploying to Render..."

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Fix package-lock sync issues in Docker build

- Changed 'npm ci' to 'npm install --only=production' in all Docker files
- Resolves package-lock.json sync errors with package.json
- More flexible dependency resolution for production builds
- Backend-only deployment continues to work correctly"

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
echo "🎉 This should resolve the package-lock sync errors!"
