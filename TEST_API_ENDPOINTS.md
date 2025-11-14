# 🧪 Testing Your Deployed Backend

Your backend is **confirmed deployed** on Vercel! ✅

## Quick Test Commands

Replace `YOUR_APP_URL` with your actual Vercel URL (e.g., `https://hp-printer-ecommerce-xxx.vercel.app`)

### 1. Health Check
```bash
curl https://YOUR_APP_URL/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "HP Printer Shop API running",
  "timestamp": "2024-..."
}
```

### 2. Products List
```bash
curl https://YOUR_APP_URL/api/products?page=1&limit=5
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {...}
  }
}
```

### 3. Categories
```bash
curl https://YOUR_APP_URL/api/products/categories/list
```

**Expected Response:**
```json
{
  "success": true,
  "data": [...]
}
```

## Using the Verification Script

```bash
./verify-backend.sh https://YOUR_APP_URL
```

## Browser Testing

1. Open your deployed app in browser
2. Open Developer Tools (F12)
3. Go to **Network** tab
4. Try to load the shop page or make an API call
5. Check:
   - **Status**: Should be 200 (green)
   - **Response**: Should be JSON, not HTML
   - **URL**: Should be `https://your-app.vercel.app/api/...`

## Common Issues & Solutions

### Issue: Still Getting 404

**If you see 404 errors:**

1. **Check the actual error**:
   - Is it "API endpoint not found" (from Express)? → Path routing issue
   - Is it a Vercel 404 page? → Function not being called

2. **Test directly in browser**:
   ```
   https://your-app.vercel.app/api/health
   ```
   - If you see HTML → Rewrite rule is interfering
   - If you see JSON → Working! ✅
   - If you see 404 → Function not receiving requests correctly

3. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Your Project → Functions
   - Click on `/api/index`
   - Check "Logs" tab for any errors

### Issue: Getting HTML Instead of JSON

This means the rewrite rule is catching API requests. The current configuration should handle this, but if it persists:

1. The function IS deployed (confirmed ✅)
2. The path handling should work (updated in `api/index.js`)
3. May need to check Vercel's routing priority

### Issue: Function Timeout

If requests timeout:
- Check database connection
- Verify environment variables are set
- Check function logs for errors

## Next Steps

1. **Test the endpoints** using the commands above
2. **Check browser console** for any errors
3. **Review function logs** in Vercel Dashboard
4. **Set environment variables** if not already set:
   - `DATABASE_URL` or `POSTGRES_URL`
   - `JWT_SECRET`
   - `FRONTEND_URL`

## Success Indicators

✅ Function appears in Vercel Dashboard (confirmed!)
✅ `/api/health` returns 200 with JSON
✅ `/api/products` returns product data
✅ No 404 errors in browser console
✅ Network tab shows successful API calls

---

**Your backend is deployed!** Now let's make sure it's responding correctly. 🚀

