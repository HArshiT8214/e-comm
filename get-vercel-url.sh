#!/bin/bash
# Script to help find your Vercel deployment URL

echo "🔍 Finding Your Vercel URL"
echo "=========================="
echo ""

# Method 1: Check if vercel CLI is available
if command -v vercel &> /dev/null; then
    echo "1️⃣  Checking Vercel CLI..."
    if vercel ls 2>/dev/null | head -3; then
        echo ""
        echo "✅ Found deployments via Vercel CLI"
        echo "   Run: vercel ls"
        exit 0
    fi
fi

# Method 2: Check git remote
echo "2️⃣  Checking Git remote..."
GIT_URL=$(git remote get-url origin 2>/dev/null)
if [ ! -z "$GIT_URL" ]; then
    echo "   Git remote: $GIT_URL"
    if echo "$GIT_URL" | grep -q "vercel"; then
        echo "   → This might be connected to Vercel"
    fi
fi

echo ""
echo "3️⃣  How to Find Your Vercel URL:"
echo ""
echo "   Option A: Vercel Dashboard"
echo "   1. Go to: https://vercel.com/dashboard"
echo "   2. Click on your project: 'hp-printer-ecommerce'"
echo "   3. The URL is shown at the top (e.g., https://hp-printer-ecommerce-xxx.vercel.app)"
echo ""
echo "   Option B: Check Deployment"
echo "   1. In Vercel Dashboard → Your Project → Deployments"
echo "   2. Click on the latest deployment"
echo "   3. The URL is in the address bar or shown on the page"
echo ""
echo "   Option C: Use Vercel CLI"
echo "   1. Run: vercel ls"
echo "   2. Or: vercel inspect"
echo ""
echo "   Your URL format should be:"
echo "   https://hp-printer-ecommerce-[random-id].vercel.app"
echo "   OR"
echo "   https://hp-printer-ecommerce-[your-username].vercel.app"
echo ""

