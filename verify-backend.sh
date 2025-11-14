#!/bin/bash
# Backend Deployment Verification Script

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Backend Deployment Verification"
echo "=================================="
echo ""

# Get app URL from argument or prompt
if [ -z "$1" ]; then
    echo -e "${YELLOW}Enter your Vercel app URL (e.g., https://your-app.vercel.app):${NC}"
    read APP_URL
else
    APP_URL="$1"
fi

# Remove trailing slash
APP_URL="${APP_URL%/}"

# Validate URL format
if [ "$APP_URL" = "https://your-app.vercel.app" ] || [ -z "$APP_URL" ] || ! echo "$APP_URL" | grep -q "vercel.app"; then
    echo -e "${RED}❌ Invalid or placeholder URL detected!${NC}"
    echo ""
    echo "Please use your actual Vercel deployment URL."
    echo ""
    echo "To find your URL:"
    echo "  1. Go to: https://vercel.com/dashboard"
    echo "  2. Click on your project: 'hp-printer-ecommerce'"
    echo "  3. Copy the URL shown at the top"
    echo ""
    echo "Or run: ./get-vercel-url.sh"
    echo ""
    exit 1
fi

echo -e "${YELLOW}Testing backend at: $APP_URL${NC}"
echo ""

# Test 1: Health endpoint
echo "1️⃣  Testing /api/health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$APP_URL/api/health" 2>/dev/null)
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HEALTH_CODE" = "200" ] && echo "$HEALTH_BODY" | grep -q "success"; then
    echo -e "   ${GREEN}✅ Health endpoint working (HTTP $HEALTH_CODE)${NC}"
    echo "   Response: $(echo "$HEALTH_BODY" | head -c 100)..."
else
    echo -e "   ${RED}❌ Health endpoint failed (HTTP $HEALTH_CODE)${NC}"
    if [ "$HEALTH_CODE" = "404" ]; then
        echo -e "   ${RED}   → Backend function may not be deployed${NC}"
    fi
    echo "   Response: $HEALTH_BODY"
fi
echo ""

# Test 2: Products endpoint
echo "2️⃣  Testing /api/products endpoint..."
PRODUCTS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/products?page=1&limit=5" 2>/dev/null)

if [ "$PRODUCTS_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ Products endpoint working (HTTP $PRODUCTS_CODE)${NC}"
elif [ "$PRODUCTS_CODE" = "404" ]; then
    echo -e "   ${RED}❌ Products endpoint not found (HTTP $PRODUCTS_CODE)${NC}"
    echo -e "   ${RED}   → Backend routes may not be configured correctly${NC}"
else
    echo -e "   ${YELLOW}⚠️  Products endpoint returned HTTP $PRODUCTS_CODE${NC}"
fi
echo ""

# Test 3: Categories endpoint
echo "3️⃣  Testing /api/products/categories/list endpoint..."
CATEGORIES_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/products/categories/list" 2>/dev/null)

if [ "$CATEGORIES_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ Categories endpoint working (HTTP $CATEGORIES_CODE)${NC}"
elif [ "$CATEGORIES_CODE" = "404" ]; then
    echo -e "   ${RED}❌ Categories endpoint not found (HTTP $CATEGORIES_CODE)${NC}"
    echo -e "   ${RED}   → Check route configuration in backend${NC}"
else
    echo -e "   ${YELLOW}⚠️  Categories endpoint returned HTTP $CATEGORIES_CODE${NC}"
fi
echo ""

# Test 4: Check if response is HTML (indicates rewrite issue)
echo "4️⃣  Checking response format..."
TEST_RESPONSE=$(curl -s "$APP_URL/api/health" 2>/dev/null | head -c 50)
if echo "$TEST_RESPONSE" | grep -q "<!doctype html"; then
    echo -e "   ${RED}❌ API returning HTML instead of JSON${NC}"
    echo -e "   ${RED}   → Rewrite rules may be interfering with API routes${NC}"
else
    echo -e "   ${GREEN}✅ Response format correct (JSON)${NC}"
fi
echo ""

# Summary
echo "=================================="
echo "📊 Summary:"
echo ""

ALL_TESTS_PASSED=true

if [ "$HEALTH_CODE" != "200" ]; then
    ALL_TESTS_PASSED=false
    echo -e "${RED}❌ Health check failed${NC}"
fi

if [ "$PRODUCTS_CODE" != "200" ]; then
    ALL_TESTS_PASSED=false
    echo -e "${RED}❌ Products endpoint failed${NC}"
fi

if [ "$CATEGORIES_CODE" != "200" ]; then
    ALL_TESTS_PASSED=false
    echo -e "${RED}❌ Categories endpoint failed${NC}"
fi

if [ "$ALL_TESTS_PASSED" = true ]; then
    echo -e "${GREEN}✅ All tests passed! Backend is properly deployed.${NC}"
    echo ""
    echo "Next steps:"
    echo "  - Set environment variables in Vercel Dashboard"
    echo "  - Test full application functionality"
    echo "  - Monitor function logs for any issues"
else
    echo -e "${RED}❌ Some tests failed. Backend may not be properly deployed.${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "  1. Check Vercel Dashboard → Functions tab"
    echo "  2. Review deployment logs for errors"
    echo "  3. Verify vercel.json configuration"
    echo "  4. Ensure @vercel/node is installed in backend"
    echo "  5. See VERIFY_BACKEND_DEPLOYMENT.md for detailed help"
fi

echo ""

