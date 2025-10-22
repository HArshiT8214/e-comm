#!/bin/bash

# 🚀 Vercel Full-Stack Deployment Script
# This script deploys both frontend and backend to Vercel

set -e

echo "🚀 Starting Vercel Full-Stack Deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel:"
    vercel login
fi

echo "📦 Installing API dependencies..."
cd api
npm install
cd ..

echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "🔧 Setting up environment variables..."

# Create .env.local for Vercel
cat > .env.local << EOF
# Database Configuration (Use Vercel Postgres or external database)
POSTGRES_HOST=your-database-host
POSTGRES_USER=your-database-user
POSTGRES_PASSWORD=your-database-password
POSTGRES_DATABASE=your-database-name
POSTGRES_PORT=5432

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=https://your-app.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EOF

echo "⚠️  IMPORTANT: Please update .env.local with your actual values before deploying!"

echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update environment variables in Vercel dashboard"
echo "2. Set up Vercel Postgres database or configure external database"
echo "3. Test your API endpoints"
echo "4. Update frontend API URLs if needed"
echo ""
echo "🔗 Your app should be live at: https://your-app.vercel.app"
echo "🔗 API health check: https://your-app.vercel.app/api/health"
