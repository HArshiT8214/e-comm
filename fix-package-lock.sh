#!/bin/bash

echo "🔧 Fixing package-lock.json sync issues"
echo "======================================"

# Go to backend directory
cd backend

echo "📦 Current package.json versions:"
echo "- express: $(grep '"express"' package.json)"
echo "- bcryptjs: $(grep '"bcryptjs"' package.json)"
echo "- dotenv: $(grep '"dotenv"' package.json)"

echo ""
echo "🗑️  Removing old package-lock.json..."
rm -f package-lock.json

echo ""
echo "📦 Regenerating package-lock.json..."
npm install

echo ""
echo "✅ New package-lock.json generated!"
echo ""
echo "📋 Updated versions:"
echo "- express: $(grep '"express"' package-lock.json | head -1)"
echo "- bcryptjs: $(grep '"bcryptjs"' package-lock.json | head -1)"

echo ""
echo "🚀 Ready for deployment!"
