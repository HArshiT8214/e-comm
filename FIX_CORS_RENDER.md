# 🔧 Fix CORS Error for Render Backend

## Problem
CORS error: Backend only allows `https://hp-printer-ecommerce.vercel.app` but frontend is using preview URL `https://hp-printer-ecommerce-oq0yh6dh0-harshits-projects-27f3aa60.vercel.app`

## ✅ Solution Applied

I've updated the CORS configuration in `backend/src/index.js` to:
1. ✅ Allow production URL: `https://hp-printer-ecommerce.vercel.app`
2. ✅ Allow all Vercel preview deployments matching patterns:
   - `https://hp-printer-ecommerce*.vercel.app`
   - `https://*-harshits-projects-*.vercel.app`
3. ✅ Allow localhost in development

## 🚀 Next Steps

### Step 1: Deploy Updated Backend to Render

1. **Commit the changes**:
   ```bash
   git add backend/src/index.js
   git commit -m "Fix: Update CORS to allow Vercel preview deployments"
   git push
   ```

2. **Render will auto-deploy** (if auto-deploy is enabled)
   - Or manually trigger deployment in Render Dashboard

3. **Wait for deployment to complete**
   - Check Render Dashboard → Your Service → Logs
   - Should see "Backend running on port 10000"

### Step 2: Verify CORS is Working

Test the backend:
```bash
# Test from your preview URL origin
curl -H "Origin: https://hp-printer-ecommerce-oq0yh6dh0-harshits-projects-27f3aa60.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://hp-printer-backend.onrender.com/api/health

# Should return CORS headers
```

### Step 3: Test in Browser

1. Visit your Vercel preview URL
2. Open browser DevTools → Network tab
3. Check API requests - should no longer show CORS errors
4. Products should load correctly

## 🔍 How It Works

The updated CORS configuration:
- Uses a function to check origins dynamically
- Matches against multiple patterns (strings and regex)
- Allows all Vercel preview deployments automatically
- Still secure (only allows specific patterns)

## 📝 API Path Note

**Important**: Your frontend is calling:
```
https://hp-printer-backend.onrender.com/products
```

But your backend routes are at `/products` (not `/api/products`).

**If your frontend API service is adding `/api` prefix**, make sure:
- Either remove `/api` from BASE_URL, OR
- Add `/api` prefix to all backend routes

**Current setup** (based on your routes):
- Backend routes: `/products`, `/auth`, `/cart`, etc.
- Frontend should call: `https://hp-printer-backend.onrender.com/products`

**If you want `/api` prefix**:
- Update backend routes to use `/api` prefix
- Or update frontend BASE_URL to not include `/api`

## ✅ Expected Result

After deploying:
- ✅ No CORS errors in browser console
- ✅ API requests succeed
- ✅ Products load correctly
- ✅ All endpoints work from any Vercel URL (production or preview)

## 🐛 If Still Having Issues

1. **Check Render Logs**:
   - Look for CORS-related errors
   - Verify backend started successfully

2. **Verify Environment Variables**:
   - `FRONTEND_URL` should be set (optional, patterns handle it)
   - `NODE_ENV=production`

3. **Test CORS directly**:
   ```bash
   curl -v -H "Origin: https://your-preview-url.vercel.app" \
        https://hp-printer-backend.onrender.com/api/health
   ```

4. **Check Browser Console**:
   - Look for specific CORS error messages
   - Verify the origin in the error matches your URL

---

**The CORS fix is ready!** Just deploy the updated backend to Render. 🚀

