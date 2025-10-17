#!/bin/bash

# Render Backend Deployment Script for HP Printer E-commerce Platform
# This script deploys only the backend to Render

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

# Check if Render CLI is installed
check_render_cli() {
    if ! command -v render &> /dev/null; then
        print_error "Render CLI is not installed. Please install it first:"
        echo "npm install -g @render/cli"
        echo "or visit: https://render.com/docs/cli"
        exit 1
    fi
    print_success "Render CLI is installed"
}

# Check if logged in to Render
check_render_auth() {
    if ! render auth whoami &> /dev/null; then
        print_status "Please log in to Render..."
        render  login
    fi
    print_success "Logged in to Render"
}

# Create or use existing Render service
setup_render_service() {
    print_status "Setting up Render service..."
    
    # Check if render.yaml exists
    if [ ! -f "render.yaml" ]; then
        print_error "render.yaml not found. Please ensure it exists in the project root."
        exit 1
    fi
    
    print_success "render.yaml configuration found"
}

# Set up database
setup_database() {
    print_status "Setting up database configuration..."
    
    # Check if database schema exists
    if [ ! -f "db/schema.sql" ]; then
        print_warning "Database schema not found at db/schema.sql"
        print_status "You may need to create the database schema manually in Render dashboard"
    else
        print_success "Database schema found"
    fi
}

# Deploy to Render
deploy_to_render() {
    print_status "Deploying to Render..."
    
    # Add all files to git
    git add .
    
    # Commit changes
    git commit -m "Deploy backend to Render" || true
    
    # Push to repository (Render will auto-deploy)
    git push origin main
    
    print_success "Backend deployment initiated on Render!"
}

# Get service URL and update frontend config
update_frontend_config() {
    print_success "🎉 Backend deployment completed!"
    echo ""
    print_status "Next steps:"
    echo "1. Check your Render dashboard for the service URL"
    echo "2. Update your frontend environment variables:"
    echo "   REACT_APP_API_BASE_URL=https://your-backend-service.onrender.com/api"
    echo ""
    echo "3. Update CORS_ORIGIN in Render dashboard:"
    echo "   Go to your service settings and update CORS_ORIGIN to your frontend URL"
    echo ""
    echo "4. Deploy your frontend to Vercel or Netlify"
    echo ""
    print_warning "Don't forget to update the CORS_ORIGIN with your actual frontend URL!"
    print_status "You can find your service URL in the Render dashboard"
}

# Manual deployment instructions
show_manual_deployment() {
    print_status "Manual Deployment Instructions:"
    echo ""
    echo "1. Go to https://render.com and sign in"
    echo "2. Click 'New +' and select 'Web Service'"
    echo "3. Connect your GitHub repository"
    echo "4. Configure the service:"
    echo "   - Name: hp-printer-backend"
    echo "   - Environment: Node"
    echo "   - Build Command: cd backend && npm install"
    echo "   - Start Command: cd backend && npm start"
    echo "   - Plan: Starter (Free)"
    echo ""
    echo "5. Add Environment Variables:"
    echo "   - NODE_ENV: production"
    echo "   - PORT: 3001"
    echo "   - JWT_SECRET: (generate a secure secret)"
    echo "   - JWT_EXPIRES_IN: 7d"
    echo "   - CORS_ORIGIN: https://your-frontend.vercel.app"
    echo ""
    echo "6. Add Database:"
    echo "   - Click 'New +' and select 'PostgreSQL' or 'MySQL'"
    echo "   - Name: hp-printer-database"
    echo "   - Plan: Starter (Free)"
    echo ""
    echo "7. Update your service to use the database:"
    echo "   - Add DATABASE_URL environment variable"
    echo "   - Or add individual DB_* variables"
    echo ""
    echo "8. Deploy!"
}

# Main deployment function
deploy_backend() {
    print_status "Starting backend deployment to Render..."
    
    check_render_cli
    check_render_auth
    setup_render_service
    setup_database
    deploy_to_render
    update_frontend_config
}

# Show usage information
show_usage() {
    echo "HP Printer E-commerce - Render Backend Deployment"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  deploy          Deploy backend to Render"
    echo "  manual          Show manual deployment instructions"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy       # Deploy backend to Render"
    echo "  $0 manual       # Show manual deployment steps"
}

# Main script logic
case "${1:-deploy}" in
    deploy)
        deploy_backend
        ;;
    manual)
        show_manual_deployment
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
