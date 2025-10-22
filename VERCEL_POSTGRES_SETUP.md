# 🚀 Vercel Postgres Setup Guide

## Step 1: Create Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** tab
4. Click **Create Database** → **Postgres**
5. Name: `hp-printer-database`
6. Region: Choose closest to your users
7. Click **Create**

## Step 2: Get Connection Details

1. In your database dashboard, click **Connect**
2. Copy these values:
   - **Host**
   - **Database**
   - **Username**
   - **Password**
   - **Port** (usually 5432)

## Step 3: Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

```env
# Database Configuration
POSTGRES_HOST=your-host-from-vercel
POSTGRES_USER=your-username-from-vercel
POSTGRES_PASSWORD=your-password-from-vercel
POSTGRES_DATABASE=your-database-name-from-vercel
POSTGRES_PORT=5432

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=https://your-app.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Step 4: Update Database Schema

Your existing MySQL schema needs to be converted to PostgreSQL:

```sql
-- Convert MySQL to PostgreSQL syntax
-- Main changes:
-- 1. AUTO_INCREMENT → SERIAL
-- 2. TINYINT(1) → BOOLEAN
-- 3. ENUM → VARCHAR with CHECK constraints
-- 4. ENGINE=InnoDB → (remove, not needed in PostgreSQL)

-- Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'support')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Addresses table
CREATE TABLE addresses (
    address_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    line1 VARCHAR(255) NOT NULL,
    line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zipcode VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    stock_quantity INTEGER DEFAULT 0,
    image_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add more tables as needed...
```

## Step 5: Deploy and Test

```bash
# Deploy to Vercel
vercel --prod

# Test database connection
curl https://your-app.vercel.app/api/health
```

## Benefits of Vercel Postgres

✅ **Managed Database**: No server maintenance  
✅ **Automatic Backups**: Built-in backup system  
✅ **Scaling**: Auto-scales with your app  
✅ **Security**: Encrypted at rest and in transit  
✅ **Monitoring**: Built-in metrics and logs  
✅ **Free Tier**: 1GB storage, 1 billion row reads/month  

## Troubleshooting

### Connection Issues
- Verify all environment variables are set correctly
- Check that your database is in the same region as your functions
- Ensure SSL is enabled (Vercel handles this automatically)

### Schema Issues
- PostgreSQL is case-sensitive for unquoted identifiers
- Use `SERIAL` instead of `AUTO_INCREMENT`
- Use `BOOLEAN` instead of `TINYINT(1)`

### Performance Tips
- Use connection pooling (already configured in your code)
- Add indexes for frequently queried columns
- Monitor query performance in Vercel dashboard
