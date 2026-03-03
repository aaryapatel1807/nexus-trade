#!/bin/bash
# Render Deployment Script for Nexus Trade
# This script automates the Render.com deployment process

set -e

echo "🚀 Nexus Trade - Render Deployment Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is clean
echo "📋 Checking git status..."
if ! git diff --quiet; then
    echo -e "${RED}❌ Error: Uncommitted changes detected${NC}"
    echo "   Run: git add -A && git commit -m 'message'"
    exit 1
fi
echo -e "${GREEN}✅ Git status clean${NC}"

# Verify commits are pushed
echo ""
echo "📤 Checking if commits are pushed to GitHub..."
if git rev-parse --verify origin/main >/dev/null 2>&1; then
    LOCAL=$(git rev-parse main)
    REMOTE=$(git rev-parse origin/main)
    if [ "$LOCAL" != "$REMOTE" ]; then
        echo "   Run: git push origin main"
        exit 1
    fi
    echo -e "${GREEN}✅ All commits pushed to GitHub${NC}"
else
    echo -e "${RED}❌ Could not verify remote${NC}"
    exit 1
fi

# Check node environment
echo ""
echo "🔍 Checking Node.js environment..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION}${NC}"

# Verify backend dependencies
echo ""
echo "📦 Verifying backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm ci --silent
fi
echo -e "${GREEN}✅ Backend dependencies ready${NC}"
cd ..

# Verify frontend dependencies
echo ""
echo "📦 Verifying frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm ci --silent
fi
echo -e "${GREEN}✅ Frontend dependencies ready${NC}"
cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✨ All Pre-Deployment Checks Passed!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📖 Next Steps:"
echo "   1. Go to https://render.com"
echo "   2. Sign in or create account"
echo "   3. Click 'Create Resource' → 'Blueprint'"
echo "   4. Select your GitHub repository (aaryapatel1807/nexus-trade)"
echo "   5. Select branch: main"
echo "   6. Click 'Create from Blueprint'"
echo ""
echo "⚙️  Blueprint Configuration:"
echo "   • Will read render.yaml automatically"
echo "   • Will create PostgreSQL database"
echo "   • Will deploy backend service"
echo "   • Will deploy frontend service"
echo "   • Total setup time: ~5-10 minutes"
echo ""
echo "🔐 Before Blueprint Deploys:"
echo "   In Render Dashboard → Backend Service → Environment:"
echo "   • GEMINI_API_KEY = (paste your actual Google API key)"
echo "   • FINNHUB_API_KEY = (optional, can leave blank)"
echo ""
echo "✅ Once deployed:"
echo "   • Backend: https://nexus-trade-backend.onrender.com"
echo "   • Frontend: https://nexus-trade-frontend.onrender.com"
echo ""
echo "📝 Full guide: See RENDER_DEPLOYMENT.md"
echo ""
