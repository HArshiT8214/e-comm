# ⚡ Quick Migration: Backend to Render

## 🎯 Quick Steps (5 minutes)

### 1. Deploy Backend to Render

**Via Render Dashboard:**
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repo
4. Configure:
   - **Name**: `hp-printer-backend`
   - **Root Directory**: Leave empty
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=your-secret-key-here
   DATABASE_URL=your-postgres-url
   FRONTEND_URL=https://hp-printer-ecommerce.vercel.app
   ```
6. Click "Create Web Service"

### 2. Get Your Render Backend URL

After deployment, your backend URL will be:
```
https://hp-printer-backend.onrender.com
```

### 3. Update Frontend API Configuration

**Option A: Update `frontend/src/services/api.js`**

Change line 2:
```javascript
// FROM:
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

// TO:
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://hp-printer-backend.onrender.com/api';
```

**Option B: Set Vercel Environment Variable** (Recommended)

1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/Update:
   - **Key**: `REACT_APP_API_BASE_URL`
   - **Value**: `https://hp-printer-backend.onrender.com/api`
3. Redeploy frontend

### 4. Update vercel.json

Replace your current `vercel.json` with the simplified version:

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

**Key Changes:**
- ✅ Removed `functions` section (no serverless function)
- ✅ Removed API rewrite (not needed)
- ✅ Simplified `installCommand` (only frontend)
- ✅ Updated API URL to Render backend

### 5. Set Up Database on Render

1. Render Dashboard → "New +" → "PostgreSQL"
2. Configure:
   - **Name**: `hp-printer-database`
   - **Database**: `hp_printer_shop`
   - **Plan**: Free (or Starter)
3. Copy the **Internal Database URL**
4. Add to backend environment variables as `DATABASE_URL`

### 6. Deploy and Test

```bash
# Commit changes
git add .
git commit -m "Move backend to Render"
git push

# Test backend
curl https://hp-printer-backend.onrender.com/api/health

# Should return:
# {"success":true,"message":"HP Printer Shop API running",...}
```

## ✅ Checklist

- [ ] Backend deployed to Render
- [ ] Database set up on Render
- [ ] Environment variables configured in Render
- [ ] Frontend API URL updated
- [ ] `vercel.json` simplified (removed API function)
- [ ] Vercel environment variable set
- [ ] Backend health check works
- [ ] Frontend can reach backend
- [ ] Products load correctly

## 🔍 Testing

### Test Backend
```bash
curl https://hp-printer-backend.onrender.com/api/health
curl https://hp-printer-backend.onrender.com/api/products?page=1&limit=5
```

### Test Frontend
1. Visit your Vercel URL
2. Open browser DevTools → Network tab
3. Check API calls go to Render backend
4. Verify products load

## 🐛 Common Issues

### Backend Returns 404
- Check Render service is running
- Verify start command: `cd backend && npm start`
- Check Render logs for errors

### CORS Errors
- Set `FRONTEND_URL` in Render environment variables
- Ensure it matches your Vercel URL exactly

### Database Connection Failed
- Use Internal Database URL (not external)
- Check `DATABASE_URL` is set correctly
- Verify database is running

### Frontend Can't Reach Backend
- Verify `REACT_APP_API_BASE_URL` in Vercel
- Check backend URL is correct
- Ensure backend is deployed and running

## 📝 Files to Update

1. ✅ `vercel.json` - Remove API function, simplify
2. ✅ `frontend/src/services/api.js` - Update BASE_URL (optional if using env var)
3. ✅ Vercel Environment Variables - Add `REACT_APP_API_BASE_URL`
4. ✅ Render Environment Variables - Add all backend config

## 🎉 Benefits

- ✅ No more serverless function routing issues
- ✅ Simpler deployment
- ✅ Better database integration
- ✅ Traditional Express server (easier to debug)
- ✅ Free tier on both platforms

---

**That's it!** Your backend will be on Render, frontend on Vercel. 🚀

