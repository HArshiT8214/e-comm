# 🚀 Deployment Checklist - HP Printer E-commerce Platform

## Pre-Deployment Checklist

### ✅ Server Requirements
- [ ] Server with Ubuntu 20.04+ or CentOS 8+
- [ ] Minimum 2GB RAM (4GB+ recommended)
- [ ] 20GB+ SSD storage
- [ ] 2+ CPU cores
- [ ] Static IP address
- [ ] Domain name configured

### ✅ Software Installation
- [ ] Node.js 16+ installed
- [ ] MySQL 8.0+ installed and running
- [ ] Nginx installed
- [ ] PM2 installed globally
- [ ] Git installed
- [ ] SSL certificates obtained (Let's Encrypt recommended)

### ✅ Security Setup
- [ ] Firewall configured (UFW)
- [ ] SSH key authentication enabled
- [ ] Root login disabled
- [ ] Strong passwords set
- [ ] Database secured
- [ ] SSL/TLS configured

## Deployment Options

### Option 1: Traditional VPS Deployment
```bash
# Quick deployment
./deploy.sh deploy

# Manual steps
1. Update system packages
2. Install required software
3. Clone repository
4. Configure environment variables
5. Setup database
6. Build and start application
7. Configure Nginx
8. Setup SSL certificates
```

### Option 2: Docker Deployment
```bash
# Quick deployment
./quick-deploy.sh docker

# Manual steps
1. Install Docker and Docker Compose
2. Configure environment variables
3. Start services with docker-compose
4. Setup SSL certificates
```

### Option 3: Cloud Platform Deployment
```bash
# Render (Backend)
./deploy-backend-render.sh deploy

# Vercel (Frontend only)
./quick-deploy.sh vercel

# Netlify (Frontend only)
./quick-deploy.sh netlify

# DigitalOcean App Platform
./quick-deploy.sh digitalocean
```

## Post-Deployment Checklist

### ✅ Application Testing
- [ ] Frontend loads correctly
- [ ] Backend API responds
- [ ] Database connection working
- [ ] User registration/login works
- [ ] Product catalog displays
- [ ] Shopping cart functions
- [ ] Order placement works
- [ ] Admin dashboard accessible

### ✅ Performance Testing
- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] Database queries optimized
- [ ] Static assets cached
- [ ] Gzip compression enabled

### ✅ Security Testing
- [ ] HTTPS redirect working
- [ ] Security headers present
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] SQL injection protection
- [ ] XSS protection enabled

### ✅ Monitoring Setup
- [ ] PM2 monitoring configured
- [ ] Nginx logs accessible
- [ ] Database monitoring setup
- [ ] Error tracking configured
- [ ] Uptime monitoring enabled

### ✅ Backup Strategy
- [ ] Database backup script created
- [ ] Automated daily backups
- [ ] Application backup configured
- [ ] Backup retention policy set
- [ ] Recovery procedure tested

## Environment Variables Checklist

### Backend (.env)
- [ ] NODE_ENV=production
- [ ] PORT=3001
- [ ] DB_HOST=your_database_host
- [ ] DB_USER=your_database_user
- [ ] DB_PASSWORD=secure_password
- [ ] DB_NAME=hp_printer_shop_prod
- [ ] JWT_SECRET=secure_jwt_secret
- [ ] EMAIL_HOST=smtp_provider
- [ ] EMAIL_USER=your_email
- [ ] EMAIL_PASS=email_password
- [ ] CORS_ORIGIN=your_domain

### Frontend (.env)
- [ ] REACT_APP_API_BASE_URL=https://api.yourdomain.com/api
- [ ] REACT_APP_ENVIRONMENT=production
- [ ] GENERATE_SOURCEMAP=false

## DNS Configuration
- [ ] A record pointing to server IP
- [ ] CNAME for www subdomain
- [ ] SSL certificate covers both domains
- [ ] DNS propagation completed

## Final Verification
- [ ] Website accessible via domain
- [ ] All features working in production
- [ ] Mobile responsiveness tested
- [ ] Cross-browser compatibility verified
- [ ] Performance metrics acceptable
- [ ] Security scan passed
- [ ] Backup system working

## Maintenance Schedule
- [ ] Weekly security updates
- [ ] Monthly dependency updates
- [ ] Quarterly security audit
- [ ] Regular backup verification
- [ ] Performance monitoring
- [ ] Log rotation configured

---

## 🆘 Troubleshooting Quick Reference

### Application Won't Start
```bash
pm2 logs hp-printer-backend
pm2 restart hp-printer-backend
```

### Database Issues
```bash
sudo systemctl status mysql
mysql -u root -p -e "SHOW PROCESSLIST;"
```

### Nginx Issues
```bash
sudo nginx -t
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/error.log
```

### SSL Issues
```bash
sudo certbot renew --dry-run
sudo systemctl status certbot.timer
```

---

**Deployment Complete! 🎉**

Your HP Printer E-commerce platform is now live and ready for customers!
