# 🚀 Quick Vercel Postgres Setup

## Step 1: Create Vercel Postgres Database

1. **Go to Vercel Dashboard** → Your Project
2. **Click "Storage"** (left sidebar)
3. **Click "Create Database"**
4. **Select "Postgres"** (not MongoDB!)
5. **Name**: `hp-printer-database`
6. **Region**: Choose closest to your users
7. **Click "Create Database"**

## Step 2: Get Connection Details

1. **Click on your database**
2. **Click "Connect" tab**
3. **Copy these values**:
   - Host: `ep-cool-name-123456.us-east-1.postgres.vercel-storage.com`
   - Database: `verceldb`
   - Username: `default`
   - Password: `your-generated-password`
   - Port: `5432`

## Step 3: Set Environment Variables

**Vercel Dashboard** → **Project Settings** → **Environment Variables**:

```env
POSTGRES_HOST=ep-cool-name-123456.us-east-1.postgres.vercel-storage.com
POSTGRES_USER=default
POSTGRES_PASSWORD=your-generated-password
POSTGRES_DATABASE=verceldb
POSTGRES_PORT=5432
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-app.vercel.app
```

## Step 4: Create Database Schema

1. **Go to your database dashboard**
2. **Click "Console" tab**
3. **Copy and paste** the contents of `db/schema-postgres.sql`
4. **Click "Run"** to create tables

## Step 5: Deploy

```bash
# Deploy to Vercel
vercel --prod

# Test your API
curl https://your-app.vercel.app/api/health
```

## ✅ You're Done!

Your MySQL backend is now running on Vercel Postgres with minimal changes!

**Benefits:**
- ✅ Same SQL syntax (just minor differences)
- ✅ Managed database (no server maintenance)
- ✅ Automatic backups
- ✅ Built-in monitoring
- ✅ Free tier: 1GB storage, 1 billion reads/month
