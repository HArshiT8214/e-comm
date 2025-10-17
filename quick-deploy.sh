#!/bin/bash

# Quick Deployment Script for HP Printer E-commerce Platform
# Supports multiple deployment platforms

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

show_help() {
    echo "HP Printer E-commerce Platform - Quick Deploy"
    echo ""
    echo "Usage: $0 [PLATFORM] [OPTIONS]"
    echo ""
    echo "Platforms:"
    echo "  docker        Deploy using Docker Compose"
    echo "  heroku        Deploy to Heroku"
    echo "  vercel        Deploy frontend to Vercel"
    echo "  netlify       Deploy frontend to Netlify"
    echo "  digitalocean  Deploy to DigitalOcean App Platform"
    echo "  aws           Deploy to AWS (EC2 + RDS)"
    echo ""
    echo "Options:"
    echo "  --help, -h    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 docker                    # Deploy with Docker"
    echo "  $0 heroku                    # Deploy to Heroku"
    echo "  $0 vercel                    # Deploy frontend to Vercel"
}

deploy_docker() {
    print_status "Deploying with Docker Compose..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Create environment file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating environment file..."
        cp env.example .env
        print_warning "Please update .env file with your production values before continuing."
        read -p "Press Enter to continue after updating .env file..."
    fi
    
    # Create SSL directory
    mkdir -p ssl
    
    # Start services
    print_status "Starting Docker services..."
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check service status
    docker-compose ps
    
    print_success "Docker deployment completed!"
    print_status "Your application should be available at:"
    echo "- Frontend: http://localhost"
    echo "- Backend API: http://localhost/api"
    echo "- Database: localhost:3306"
}

deploy_heroku() {
    print_status "Deploying to Heroku..."
    
    # Check if Heroku CLI is installed
    if ! command -v heroku &> /dev/null; then
        print_error "Heroku CLI is not installed. Please install it first:"
        echo "https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    # Check if logged in to Heroku
    if ! heroku auth:whoami &> /dev/null; then
        print_status "Please log in to Heroku..."
        heroku login
    fi
    
    # Create Heroku app if it doesn't exist
    if [ -z "$HEROKU_APP_NAME" ]; then
        read -p "Enter Heroku app name: " HEROKU_APP_NAME
    fi
    
    # Create or use existing app
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
    
    # Create Procfile for backend
    echo "web: cd backend && npm start" > Procfile
    
    # Deploy
    print_status "Deploying to Heroku..."
    git add .
    git commit -m "Deploy to Heroku" || true
    git push heroku main
    
    print_success "Heroku deployment completed!"
    print_status "Your app is available at: https://$HEROKU_APP_NAME.herokuapp.com"
}

deploy_vercel() {
    print_status "Deploying frontend to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed. Please install it first:"
        echo "npm install -g vercel"
        exit 1
    fi
    
    # Build frontend
    print_status "Building frontend..."
    cd frontend
    npm run build
    
    # Deploy to Vercel
    print_status "Deploying to Vercel..."
    vercel --prod
    
    print_success "Vercel deployment completed!"
    print_status "Your frontend is deployed to Vercel"
}

deploy_netlify() {
    print_status "Deploying frontend to Netlify..."
    
    # Check if Netlify CLI is installed
    if ! command -v netlify &> /dev/null; then
        print_error "Netlify CLI is not installed. Please install it first:"
        echo "npm install -g netlify-cli"
        exit 1
    fi
    
    # Build frontend
    print_status "Building frontend..."
    cd frontend
    npm run build
    
    # Deploy to Netlify
    print_status "Deploying to Netlify..."
    netlify deploy --prod --dir=build
    
    print_success "Netlify deployment completed!"
    print_status "Your frontend is deployed to Netlify"
}

deploy_digitalocean() {
    print_status "Deploying to DigitalOcean App Platform..."
    
    print_status "Please follow these steps:"
    echo "1. Go to https://cloud.digitalocean.com/apps"
    echo "2. Click 'Create App'"
    echo "3. Connect your GitHub repository"
    echo "4. Configure the following:"
    echo "   - Frontend:"
    echo "     * Source Directory: frontend"
    echo "     * Build Command: npm run build"
    echo "     * Output Directory: build"
    echo "   - Backend:"
    echo "     * Source Directory: backend"
    echo "     * Run Command: npm start"
    echo "5. Add managed MySQL database"
    echo "6. Set environment variables"
    echo "7. Deploy"
    
    print_success "DigitalOcean deployment guide provided!"
}

deploy_aws() {
    print_status "Deploying to AWS..."
    
    print_status "AWS deployment requires manual setup. Please follow these steps:"
    echo "1. Launch EC2 instance (Ubuntu 20.04+)"
    echo "2. Set up RDS MySQL database"
    echo "3. Configure security groups"
    echo "4. Install dependencies on EC2"
    echo "5. Clone and deploy your application"
    echo "6. Set up Application Load Balancer"
    echo "7. Configure Route 53 for domain"
    
    print_warning "For detailed AWS deployment, see DEPLOYMENT.md"
    print_success "AWS deployment guide provided!"
}

# Main script logic
case "${1:-help}" in
    docker)
        deploy_docker
        ;;
    heroku)
        deploy_heroku
        ;;
    vercel)
        deploy_vercel
        ;;
    netlify)
        deploy_netlify
        ;;
    digitalocean)
        deploy_digitalocean
        ;;
    aws)
        deploy_aws
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown platform: $1"
        show_help
        exit 1
        ;;
esac
