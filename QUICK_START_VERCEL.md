# 🚀 Quick Start - Vercel Deployment

## TL;DR - Get Your App Live in 5 Minutes

### 1. Deploy Backend (Heroku)
```bash
./deploy-backend-heroku.sh deploy
```

### 2. Deploy Frontend (Vercel)
```bash
./deploy-vercel.sh frontend-only
```

### 3. Update CORS
```bash
# Get your Vercel URL and update Heroku CORS
heroku config:set CORS_ORIGIN=https://your-app.vercel.app --app your-backend-app
```

## 📋 Prerequisites Checklist

- [ ] Node.js 16+ installed
- [ ] Git repository with your code
- [ ] Vercel account (free at vercel.com)
- [ ] Heroku account (free at heroku.com)

## 🎯 Step-by-Step Deployment

### Step 1: Setup (One-time)
```bash
# Make scripts executable
chmod +x *.sh

# Setup Vercel environment
./setup-vercel.sh
```

### Step 2: Deploy Backend
```bash
# Deploy backend to Heroku
./deploy-backend-heroku.sh deploy

# Note the backend URL (e.g., https://your-app.herokuapp.com)
```

### Step 3: Deploy Frontend
```bash
# Update frontend environment with backend URL
# Edit frontend/.env.production and set:
# REACT_APP_API_BASE_URL=https://your-backend-app.herokuapp.com/api

# Deploy frontend to Vercel
./deploy-vercel.sh frontend-only
```

### Step 4: Connect Frontend and Backend
```bash
# Get your Vercel URL (e.g., https://your-app.vercel.app)
# Update Heroku CORS to allow your Vercel domain
heroku config:set CORS_ORIGIN=https://your-app.vercel.app --app your-backend-app
```

## 🔧 Manual Deployment (Alternative)

### Backend to Heroku
```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create your-backend-app

# Add database
heroku addons:create cleardb:ignite

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)

# Deploy
git push heroku main
```

### Frontend to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd frontend
vercel --prod
```

## 🌐 Environment Variables

### Frontend (Vercel Dashboard)
```
REACT_APP_API_BASE_URL=https://your-backend-app.herokuapp.com/api
REACT_APP_ENVIRONMENT=production
```

### Backend (Heroku Dashboard)
```
NODE_ENV=production
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://your-app.vercel.app
```

## ✅ Post-Deployment Checklist

- [ ] Frontend loads at your Vercel URL
- [ ] Backend API responds at your Heroku URL
- [ ] User registration/login works
- [ ] Products display correctly
- [ ] Shopping cart functions
- [ ] Admin dashboard accessible

## 🆘 Common Issues

### Frontend shows "Network Error"
- Check if backend is running
- Verify API URL in environment variables
- Check CORS configuration

### Backend shows "CORS error"
- Update CORS_ORIGIN in Heroku with your Vercel URL
- Ensure both URLs use HTTPS

### Build fails on Vercel
- Check Node.js version compatibility
- Verify all dependencies are in package.json
- Check build logs in Vercel dashboard

## 📞 Need Help?

1. Check the full deployment guide: `VERCEL_DEPLOYMENT.md`
2. Review deployment checklist: `DEPLOYMENT_CHECKLIST.md`
3. Check logs: `vercel logs` or `heroku logs --tail`

---

**Your app should be live now! 🎉**

Frontend: https://your-app.vercel.app
Backend: https://your-backend-app.herokuapp.com
