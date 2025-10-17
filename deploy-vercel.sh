#!/bin/bash

# Vercel Deployment Script for HP Printer E-commerce Platform
# This script deploys the frontend to Vercel and provides backend deployment options

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Vercel CLI is installed
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed. Please install it first:"
        echo "npm install -g vercel"
        exit 1
    fi
    print_success "Vercel CLI is installed"
}

# Install Vercel CLI if not present
install_vercel_cli() {
    print_status "Installing Vercel CLI..."
    npm install -g vercel
    print_success "Vercel CLI installed successfully"
}

# Setup frontend for Vercel deployment
setup_frontend() {
    print_status "Setting up frontend for Vercel deployment..."
    
    cd frontend
    
    # Create production environment file
    if [ ! -f .env.production ]; then
        print_status "Creating production environment file..."
        cat > .env.production << EOF
REACT_APP_API_BASE_URL=https://your-backend-api.herokuapp.com/api
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
EOF
        print_warning "Please update .env.production with your actual backend API URL"
    fi
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Build frontend
    print_status "Building frontend..."
    npm run build
    
    cd ..
    print_success "Frontend setup completed"
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    cd frontend
    
    # Check if already logged in to Vercel
    if ! vercel whoami &> /dev/null; then
        print_status "Please log in to Vercel..."
        vercel login
    fi
    
    # Deploy to Vercel
    print_status "Deploying frontend to Vercel..."
    vercel --prod
    
    cd ..
    print_success "Frontend deployed to Vercel successfully!"
}

# Setup backend deployment options
setup_backend_options() {
    print_status "Backend deployment options:"
    echo ""
    echo "Since Vercel is for frontend only, you need to deploy your backend separately:"
    echo ""
    echo "1. 🚀 Heroku (Recommended for beginners)"
    echo "   - Easy setup with git push"
    echo "   - Free tier available"
    echo "   - Automatic deployments"
    echo ""
    echo "2. 🐳 Railway"
    echo "   - Modern platform"
    echo "   - Good free tier"
    echo "   - Easy database setup"
    echo ""
    echo "3. 🌊 Render"
    echo "   - Good alternative to Heroku"
    echo "   - Free tier available"
    echo "   - Easy setup"
    echo ""
    echo "4. ☁️ DigitalOcean App Platform"
    echo "   - More control"
    echo "   - Good performance"
    echo "   - Pay-as-you-go"
    echo ""
    echo "5. 🐳 Docker (Any VPS)"
    echo "   - Full control"
    echo "   - Use the docker-compose.yml file"
    echo ""
}

# Deploy backend to Heroku
deploy_backend_heroku() {
    print_status "Deploying backend to Heroku..."
    
    # Check if Heroku CLI is installed
    if ! command -v heroku &> /dev/null; then
        print_error "Heroku CLI is not installed. Please install it first:"
        echo "https://devcenter.heroku.com/articles/heroku-cli"
        return 1
    fi
    
    # Check if logged in to Heroku
    if ! heroku auth:whoami &> /dev/null; then
        print_status "Please log in to Heroku..."
        heroku login
    fi
    
    # Create Heroku app for backend
    read -p "Enter Heroku app name for backend (e.g., hp-printer-backend): " HEROKU_APP_NAME
    
    if ! heroku apps:info $HEROKU_APP_NAME &> /dev/null; then
        print_status "Creating Heroku app: $HEROKU_APP_NAME"
        heroku create $HEROKU_APP_NAME
    else
        print_status "Using existing Heroku app: $HEROKU_APP_NAME"
    fi
    
    # Add MySQL addon
    print_status "Adding MySQL addon..."
    heroku addons:create cleardb:ignite --app $HEROKU_APP_NAME
    
    # Set environment variables
    print_status "Setting environment variables..."
    heroku config:set NODE_ENV=production --app $HEROKU_APP_NAME
    heroku config:set JWT_SECRET=$(openssl rand -base64 32) --app $HEROKU_APP_NAME
    heroku config:set CORS_ORIGIN=https://your-vercel-app.vercel.app --app $HEROKU_APP_NAME
    
    # Create Procfile for backend
    echo "web: cd backend && npm start" > Procfile
    
    # Deploy backend
    print_status "Deploying backend to Heroku..."
    git add .
    git commit -m "Deploy backend to Heroku" || true
    git push heroku main
    
    # Get backend URL
    BACKEND_URL=$(heroku apps:info $HEROKU_APP_NAME --json | jq -r '.app.web_url')
    
    print_success "Backend deployed to Heroku successfully!"
    print_status "Backend URL: $BACKEND_URL"
    
    # Update frontend environment
    print_status "Updating frontend environment with backend URL..."
    cd frontend
    sed -i.bak "s|https://your-backend-api.herokuapp.com|$BACKEND_URL|g" .env.production
    cd ..
    
    print_warning "Please update your Vercel environment variables with the new backend URL"
}

# Main deployment function
deploy_full_stack() {
    print_status "Starting full-stack deployment to Vercel + Heroku..."
    
    check_vercel_cli
    setup_frontend
    deploy_backend_heroku
    deploy_to_vercel
    
    print_success "🎉 Full-stack deployment completed!"
    print_status "Next steps:"
    echo "1. Update Vercel environment variables with your backend URL"
    echo "2. Test your application thoroughly"
    echo "3. Configure custom domain if needed"
}

# Show usage information
show_usage() {
    echo "HP Printer E-commerce - Vercel Deployment"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  frontend-only    Deploy only frontend to Vercel"
    echo "  backend-only     Deploy only backend to Heroku"
    echo "  full-stack       Deploy both frontend and backend"
    echo "  setup            Setup environment and dependencies"
    echo "  help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 frontend-only    # Deploy frontend to Vercel"
    echo "  $0 full-stack       # Deploy both frontend and backend"
    echo "  $0 setup            # Setup environment only"
}

# Main script logic
case "${1:-help}" in
    frontend-only)
        check_vercel_cli
        setup_frontend
        deploy_to_vercel
        ;;
    backend-only)
        deploy_backend_heroku
        ;;
    full-stack)
        deploy_full_stack
        ;;
    setup)
        check_vercel_cli
        setup_frontend
        setup_backend_options
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac
