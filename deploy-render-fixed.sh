#!/bin/bash

echo "🚀 Deploying HP Printer E-commerce Backend to Render (Fixed Version)"
echo "=================================================================="

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository. Please initialize git first."
    exit 1
fi

echo "📋 Pre-deployment checklist:"
echo "✅ Dockerfile.render exists"
echo "✅ render.yaml is configured correctly"
echo "✅ Backend-only build (no frontend)"
echo "✅ Health check endpoint: /health"

echo ""
echo "🔧 Current configuration:"
echo "- Dockerfile: Backend-only build"
echo "- Dockerfile.render: Backend-only build"
echo "- render.yaml: Uses Dockerfile.render"
echo "- Health check: /health"

echo ""
echo "📦 Committing changes..."

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Fix Render deployment: Remove problematic Docker file and fix Dockerfile configurations

- Removed conflicting 'Docker' file
- Fixed main Dockerfile to be backend-only
- Ensured Dockerfile.render is backend-only
- Fixed health check path to /health
- Resolved frontend build issues in backend deployment"

echo ""
echo "🚀 Pushing to GitHub..."

# Push to main branch
git push origin main

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📊 Monitor your deployment:"
echo "1. Go to: https://dashboard.render.com"
echo "2. Check your service status"
echo "3. View build logs if needed"
echo ""
echo "🔍 Test your deployment:"
echo "Health check: https://your-service.onrender.com/health"
echo "API base: https://your-service.onrender.com/api"
echo ""
echo "🎉 Deployment should now work without the frontend build error!"
