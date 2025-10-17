# 🚀 HP Printer E-commerce Platform - Deployment Guide

This guide provides comprehensive instructions for deploying your HP Printer E-commerce platform to production.

> **Note**: This project now uses Render for backend deployment instead of Heroku. See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for detailed Render deployment instructions.

## 📋 Prerequisites

### System Requirements
- **Server**: Ubuntu 20.04+ or CentOS 8+ (recommended)
- **RAM**: Minimum 2GB, recommended 4GB+
- **Storage**: Minimum 20GB SSD
- **CPU**: 2+ cores recommended

### Software Requirements
- Node.js 16+ 
- MySQL 8.0+
- Nginx (for reverse proxy)
- PM2 (for process management)
- Git

## 🎯 Deployment Options

### Option 1: Traditional VPS Deployment (Recommended)

#### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL 8.0
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Install Nginx
sudo apt install nginx -y

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install git -y
```

#### Step 2: Clone and Setup Project
```bash
# Clone your repository
git clone <your-repo-url> /var/www/hp-printer-ecomm
cd /var/www/hp-printer-ecomm

# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh deploy
```

#### Step 3: Configure Nginx
```bash
# Copy the generated Nginx configuration
sudo cp /tmp/hp-printer-nginx.conf /etc/nginx/sites-available/hp-printer

# Enable the site
sudo ln -s /etc/nginx/sites-available/hp-printer /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 4: Setup SSL (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Option 2: Docker Deployment (Easier)

#### Step 1: Install Docker and Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Step 2: Deploy with Docker
```bash
# Clone repository
git clone <your-repo-url> /var/www/hp-printer-ecomm
cd /var/www/hp-printer-ecomm

# Create environment file
cp .env.example .env
# Edit .env with your production values

# Create SSL directory
mkdir -p ssl
# Copy your SSL certificates to ssl/ directory

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### Option 3: Cloud Platform Deployment

#### Render Deployment (Recommended)
```bash
# Quick deployment
./deploy-backend-render.sh deploy

# Manual deployment
# 1. Go to https://render.com
# 2. Connect your GitHub repository
# 3. Create a new Web Service
# 4. Configure build and start commands
# 5. Add environment variables
# 6. Deploy!
```

For detailed Render deployment instructions, see [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md).

#### DigitalOcean App Platform
1. Connect your GitHub repository
2. Configure build settings:
   - Frontend: `frontend` directory, build command: `npm run build`
   - Backend: `backend` directory, run command: `npm start`
3. Add managed MySQL database
4. Configure environment variables
5. Deploy

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=3001
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_secure_password
DB_NAME=hp_printer_shop_prod
JWT_SECRET=your_super_secure_jwt_secret
EMAIL_HOST=smtp.your-provider.com
EMAIL_USER=your_email@domain.com
EMAIL_PASS=your_email_password
```

#### Frontend (.env)
```env
REACT_APP_API_BASE_URL=https://api.yourdomain.com/api
REACT_APP_ENVIRONMENT=production
```

### Database Setup
```bash
# Create production database
mysql -u root -p -e "CREATE DATABASE hp_printer_shop_prod;"

# Import schema
mysql -u root -p hp_printer_shop_prod < db/schema.sql

# Seed with initial data
cd backend && npm run seed
```

## 🔒 Security Configuration

### Firewall Setup
```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow MySQL (only if needed externally)
sudo ufw allow 3306
```

### SSL/TLS Configuration
- Use Let's Encrypt for free SSL certificates
- Configure HSTS headers
- Use strong cipher suites
- Regular certificate renewal

### Database Security
- Use strong passwords
- Limit database access to application server only
- Regular backups
- Enable MySQL audit logging

## 📊 Monitoring and Maintenance

### PM2 Monitoring
```bash
# View application status
pm2 status

# View logs
pm2 logs hp-printer-backend

# Monitor resources
pm2 monit

# Restart application
pm2 restart hp-printer-backend
```

### Nginx Monitoring
```bash
# Check Nginx status
sudo systemctl status nginx

# View access logs
sudo tail -f /var/log/nginx/access.log

# View error logs
sudo tail -f /var/log/nginx/error.log
```

### Database Monitoring
```bash
# Check MySQL status
sudo systemctl status mysql

# Monitor database connections
mysql -u root -p -e "SHOW PROCESSLIST;"

# Check database size
mysql -u root -p -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables GROUP BY table_schema;"
```

## 🔄 Backup Strategy

### Database Backup
```bash
# Create backup script
cat > /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mysqldump -u root -p hp_printer_shop_prod > $BACKUP_DIR/hp_printer_shop_$DATE.sql
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-db.sh

# Add to crontab for daily backups
echo "0 2 * * * /usr/local/bin/backup-db.sh" | sudo crontab -
```

### Application Backup
```bash
# Backup application files
tar -czf /var/backups/hp-printer-app-$(date +%Y%m%d).tar.gz /var/www/hp-printer-ecomm
```

## 🚨 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check PM2 logs
pm2 logs hp-printer-backend

# Check if port is in use
sudo netstat -tlnp | grep :3001

# Restart PM2
pm2 restart all
```

#### Database Connection Issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Test database connection
mysql -u root -p -e "SELECT 1;"

# Check database exists
mysql -u root -p -e "SHOW DATABASES;"
```

#### Nginx Issues
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

## 📈 Performance Optimization

### Frontend Optimization
- Enable gzip compression
- Set proper cache headers
- Optimize images
- Use CDN for static assets

### Backend Optimization
- Use PM2 cluster mode
- Implement Redis caching
- Optimize database queries
- Add database indexes

### Database Optimization
- Regular ANALYZE and OPTIMIZE
- Monitor slow queries
- Tune MySQL configuration
- Use connection pooling

## 🔄 Updates and Maintenance

### Application Updates
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild frontend
cd frontend && npm run build

# Restart application
pm2 restart hp-printer-backend
```

### Security Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js dependencies
npm audit fix

# Update PM2
sudo npm update -g pm2
```

## 📞 Support

If you encounter any issues during deployment:

1. Check the logs: `pm2 logs hp-printer-backend`
2. Verify environment variables
3. Test database connectivity
4. Check Nginx configuration
5. Review firewall settings

For additional support, create an issue in the project repository or contact the development team.

---

**Happy Deploying! 🚀**
