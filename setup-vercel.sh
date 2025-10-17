#!/bin/bash

# Vercel Setup Script for HP Printer E-commerce Platform
# This script prepares your project for Vercel deployment

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo "🚀 Setting up HP Printer E-commerce Platform for Vercel deployment..."

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Install Vercel CLI if not present
if ! command -v vercel &> /dev/null; then
    print_status "Installing Vercel CLI..."
    npm install -g vercel
    print_success "Vercel CLI installed"
else
    print_success "Vercel CLI already installed"
fi

# Setup frontend for Vercel
print_status "Setting up frontend for Vercel..."

cd frontend

# Create .env.production file
if [ ! -f ".env.production" ]; then
    print_status "Creating .env.production file..."
    cat > .env.production << 'EOF'
REACT_APP_API_BASE_URL=https://your-backend-api.herokuapp.com/api
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
EOF
    print_warning "Please update .env.production with your actual backend API URL"
fi

# Install dependencies
print_status "Installing frontend dependencies..."
npm install

# Test build
print_status "Testing frontend build..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Frontend build successful!"
else
    print_warning "Frontend build failed. Please check for errors."
    exit 1
fi

cd ..

print_success "✅ Vercel setup completed!"
echo ""
echo "Next steps:"
echo "1. Update frontend/.env.production with your backend API URL"
echo "2. Deploy to Vercel:"
echo "   cd frontend && vercel --prod"
echo ""
echo "Or use the automated script:"
echo "   ./deploy-vercel.sh frontend-only"
echo ""
echo "For full-stack deployment:"
echo "   ./deploy-vercel.sh full-stack"
