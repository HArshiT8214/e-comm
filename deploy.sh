#!/bin/bash

# HP Printer E-commerce Platform Deployment Script
# This script automates the deployment process

set -e  # Exit on any error

echo "🚀 Starting HP Printer E-commerce Platform Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check required commands
check_requirements() {
    print_status "Checking system requirements..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command -v mysql &> /dev/null; then
        print_error "MySQL is not installed. Please install MySQL 8.0+ first."
        exit 1
    fi
    
    if ! command -v nginx &> /dev/null; then
        print_warning "Nginx is not installed. You'll need to install it for production."
    fi
    
    if ! command -v pm2 &> /dev/null; then
        print_warning "PM2 is not installed. Installing PM2 globally..."
        npm install -g pm2
    fi
    
    print_success "System requirements check completed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    
    # Backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    npm ci --production
    cd ..
    
    # Frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend
    npm ci
    cd ..
    
    print_success "Dependencies installed successfully"
}

# Build frontend
build_frontend() {
    print_status "Building frontend for production..."
    
    cd frontend
    
    # Copy production environment file
    if [ -f "../production-config/frontend.env" ]; then
        cp ../production-config/frontend.env .env
        print_status "Using production environment configuration"
    else
        print_warning "Production environment file not found. Using default configuration."
    fi
    
    # Build the React app
    npm run build
    
    cd ..
    
    print_success "Frontend built successfully"
}

# Setup database
setup_database() {
    print_status "Setting up production database..."
    
    # Check if database exists
    if mysql -u root -p -e "USE hp_printer_shop_prod;" 2>/dev/null; then
        print_warning "Database hp_printer_shop_prod already exists"
        read -p "Do you want to recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            mysql -u root -p -e "DROP DATABASE IF EXISTS hp_printer_shop_prod;"
        else
            print_status "Using existing database"
            return
        fi
    fi
    
    # Create database and import schema
    mysql -u root -p < db/schema.sql
    
    # Update database name in schema for production
    mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS hp_printer_shop_prod;"
    mysql -u root -p hp_printer_shop_prod < db/schema.sql
    
    # Seed the database
    print_status "Seeding production database..."
    cd backend
    if [ -f "../production-config/backend.env" ]; then
        cp ../production-config/backend.env .env
    fi
    npm run seed
    cd ..
    
    print_success "Database setup completed"
}

# Configure PM2
setup_pm2() {
    print_status "Configuring PM2 for production..."
    
    # Create logs directory
    mkdir -p logs
    
    # Copy production environment
    if [ -f "production-config/backend.env" ]; then
        cp production-config/backend.env backend/.env
    fi
    
    # Start application with PM2
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup
    
    print_success "PM2 configuration completed"
}

# Setup Nginx
setup_nginx() {
    print_status "Setting up Nginx configuration..."
    
    # Create Nginx configuration
    cat > /tmp/hp-printer-nginx.conf << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (you'll need to obtain SSL certificates)
    # ssl_certificate /path/to/your/certificate.crt;
    # ssl_certificate_key /path/to/your/private.key;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Frontend (React app)
    location / {
        root /path/to/your/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
EOF
    
    print_status "Nginx configuration created at /tmp/hp-printer-nginx.conf"
    print_warning "Please review and customize the Nginx configuration before using it"
    print_warning "You'll need to obtain SSL certificates and update the paths"
}

# Main deployment function
deploy() {
    print_status "Starting deployment process..."
    
    check_requirements
    install_dependencies
    build_frontend
    setup_database
    setup_pm2
    setup_nginx
    
    print_success "🎉 Deployment completed successfully!"
    print_status "Next steps:"
    echo "1. Review and customize the Nginx configuration"
    echo "2. Obtain SSL certificates for your domain"
    echo "3. Update DNS records to point to your server"
    echo "4. Test the application thoroughly"
    echo "5. Monitor logs: pm2 logs hp-printer-backend"
}

# Show usage information
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  deploy          Full deployment process"
    echo "  build           Build frontend only"
    echo "  database        Setup database only"
    echo "  pm2             Setup PM2 only"
    echo "  nginx           Setup Nginx only"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy       # Full deployment"
    echo "  $0 build        # Build frontend only"
    echo "  $0 database     # Setup database only"
}

# Main script logic
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    build)
        check_requirements
        install_dependencies
        build_frontend
        ;;
    database)
        setup_database
        ;;
    pm2)
        setup_pm2
        ;;
    nginx)
        setup_nginx
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
