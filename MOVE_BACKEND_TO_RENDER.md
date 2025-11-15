# 🚀 Move Backend from Vercel to Render

This guide will help you deploy your backend to Render while keeping your frontend on Vercel.

## ✅ Why Move to Render?

- **Simpler deployment** - Traditional Express server, no serverless complexity
- **Better for databases** - Easier PostgreSQL setup
- **More predictable** - No cold starts or routing issues
- **Free tier available** - Render offers free hosting

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in GitHub
3. **Database**: PostgreSQL (Render provides managed databases)

## 🎯 Step-by-Step Guide

### Step 1: Prepare Backend for Render

Your backend is already configured for Render! The `backend/src/index.js` has:
```javascript
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}
```

This means it will run as a traditional server on Render.

### Step 2: Deploy Backend to Render

#### Option A: Using Render Dashboard (Recommended)

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"Web Service"**
3. **Connect your GitHub repository** (if not already connected)
4. **Select your repository**: `e-comm` (or your repo name)
5. **Configure the service**:
   - **Name**: `hp-printer-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: Leave empty (or set to project root)
6. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRES_IN=7d
   DATABASE_URL=your-postgres-connection-string
   FRONTEND_URL=https://hp-printer-ecommerce.vercel.app
   ```
7. **Click "Create Web Service"**

#### Option B: Using render.yaml (Automated)

1. **Update `render.yaml`** with your settings
2. **Push to GitHub**
3. **In Render Dashboard**: "New +" → "Blueprint"
4. **Connect your repository**
5. **Render will auto-detect `render.yaml`**

### Step 3: Set Up Database on Render

1. **In Render Dashboard**: "New +" → "PostgreSQL"
2. **Configure**:
   - **Name**: `hp-printer-database`
   - **Database**: `hp_printer_shop`
   - **User**: `hp_user`
   - **Plan**: Free (or Starter for production)
3. **Copy the Internal Database URL** (for backend)
4. **Copy the External Database URL** (for local development)

### Step 4: Update Backend Environment Variables

In your Render backend service, add:

```env
NODE_ENV=production
PORT=10000
JWT_SECRET=your-strong-secret-key-here
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://user:password@host:port/database
FRONTEND_URL=https://hp-printer-ecommerce.vercel.app
CORS_ORIGIN=https://hp-printer-ecommerce.vercel.app
```

**Important**: 
- Use the **Internal Database URL** from Render (starts with `postgres://`)
- Set `FRONTEND_URL` to your Vercel frontend URL
- Generate a strong `JWT_SECRET`

### Step 5: Update Frontend to Use Render Backend

#### Update `frontend/src/services/api.js`

Change the BASE_URL:

```javascript
// Change from:
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

// To (use your Render backend URL):
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://hp-printer-backend.onrender.com/api';
```

#### Update Vercel Environment Variables

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add/Update**:
   ```
   REACT_APP_API_BASE_URL=https://hp-printer-backend.onrender.com/api
   ```
3. **Redeploy frontend**

### Step 6: Update vercel.json

Remove the API function configuration since backend is on Render:

```json
{
  "installCommand": "cd frontend && npm install",
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/build",
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "env": {
    "REACT_APP_API_BASE_URL": "https://hp-printer-backend.onrender.com/api",
    "REACT_APP_ENVIRONMENT": "production"
  }
}
```

**Changes**:
- Removed `functions` section (no serverless function needed)
- Removed API rewrite (not needed)
- Updated `REACT_APP_API_BASE_URL` to Render backend URL
- Simplified `installCommand` (only frontend now)

### Step 7: Update CORS in Backend

Make sure your backend allows requests from Vercel:

In `backend/src/index.js`, check CORS configuration:

```javascript
app.use(
  cors({
    origin: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "https://hp-printer-ecommerce.vercel.app",
    credentials: true,
  })
);
```

### Step 8: Deploy and Test

1. **Deploy backend to Render**:
   - Push code to GitHub
   - Render will auto-deploy
   - Check logs for any errors

2. **Test backend**:
   ```bash
   curl https://hp-printer-backend.onrender.com/api/health
   ```

3. **Update and redeploy frontend**:
   ```bash
   git add .
   git commit -m "Move backend to Render, update API URL"
   git push
   ```

4. **Test full stack**:
   - Visit your Vercel frontend
   - Check browser console for API calls
   - Verify products load correctly

## 🔧 Troubleshooting

### Backend Not Starting

**Check Render Logs**:
1. Go to Render Dashboard → Your Service → Logs
2. Look for errors in startup

**Common Issues**:
- Missing environment variables
- Database connection issues
- Port configuration (should be `10000` or use `PORT` env var)

### CORS Errors

**Symptoms**: Browser shows CORS errors

**Fix**:
1. Check `FRONTEND_URL` in Render environment variables
2. Verify CORS configuration in `backend/src/index.js`
3. Ensure frontend URL matches exactly (including `https://`)

### Database Connection Issues

**Symptoms**: Backend can't connect to database

**Fix**:
1. Use **Internal Database URL** (not external)
2. Check database is running in Render
3. Verify `DATABASE_URL` environment variable is set

### Frontend Can't Reach Backend

**Symptoms**: 404 or network errors

**Fix**:
1. Verify `REACT_APP_API_BASE_URL` in Vercel environment variables
2. Check backend URL is correct: `https://your-backend.onrender.com/api`
3. Ensure backend is deployed and running

## 📊 Architecture After Migration

```
┌─────────────────────────────────┐
│   Vercel (Frontend)             │
│   - React SPA                   │
│   - Static files                │
│   - API calls to Render         │
└──────────────┬──────────────────┘
               │ HTTPS
               │
               ▼
┌─────────────────────────────────┐
│   Render (Backend)               │
│   - Express API                  │
│   - Serverless functions         │
│   - Always running               │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│   Render (Database)              │
│   - PostgreSQL                  │
│   - Managed service             │
└─────────────────────────────────┘
```

## ✅ Benefits of This Setup

1. **Simpler Backend**: No serverless function complexity
2. **Better Performance**: No cold starts
3. **Easier Debugging**: Traditional server logs
4. **Database Integration**: Easier PostgreSQL setup
5. **Cost Effective**: Both platforms have free tiers

## 🎉 Next Steps

1. ✅ Deploy backend to Render
2. ✅ Set up database
3. ✅ Update frontend API URL
4. ✅ Update vercel.json
5. ✅ Test everything
6. ✅ Monitor both services

---

**Need Help?**
- Render Docs: https://render.com/docs
- Render Support: Available in dashboard
- Check logs in both Vercel and Render dashboards

