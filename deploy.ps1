#!/usr/bin/env pwsh
# Render Deployment Script for Nexus Trade (Windows/PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "========================================" 
Write-Host "Nexus Trade - Render Deployment Setup"
Write-Host "========================================" 
Write-Host ""

# Check if git is clean
Write-Host "[1] Checking git status..."
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "ERROR: Uncommitted changes detected"
    Write-Host "Run: git add -A; git commit -m 'message'"
    exit 1
}
Write-Host "[OK] Git status clean"

# Verify commits are pushed
Write-Host ""
Write-Host "[2] Checking if commits are pushed to GitHub..."
try {
    $local = git rev-parse main
    $remote = git rev-parse origin/main
    if ($local -ne $remote) {
        Write-Host "ERROR: Local commits not pushed"
        Write-Host "Run: git push origin main"
        exit 1
    }
    Write-Host "[OK] All commits pushed to GitHub"
} catch {
    Write-Host "ERROR: Could not verify remote"
    exit 1
}

# Check node environment
Write-Host ""
Write-Host "[3] Checking Node.js..."
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js $nodeVersion"
} catch {
    Write-Host "ERROR: Node.js not found"
    exit 1
}

# Verify backend dependencies
Write-Host ""
Write-Host "[4] Verifying backend dependencies..."
Push-Location backend
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm ci --silent
}
Write-Host "[OK] Backend dependencies ready"
Pop-Location

# Verify frontend dependencies
Write-Host ""
Write-Host "[5] Verifying frontend dependencies..."
Push-Location frontend
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm ci --silent
}
Write-Host "[OK] Frontend dependencies ready"
Pop-Location

Write-Host ""
Write-Host "========================================"
Write-Host "SUCCESS! Ready for deployment"
Write-Host "========================================"
Write-Host ""

Write-Host "NEXT STEPS:"
Write-Host ""
Write-Host "1. Go to https://render.com"
Write-Host "2. Sign in or create account"
Write-Host "3. Click 'Create Resource' - click 'Blueprint'"
Write-Host "4. Select repository: aaryapatel1807/nexus-trade"
Write-Host "5. Select branch: main"
Write-Host "6. Click 'Create from Blueprint'"
Write-Host ""
Write-Host "Render will deploy:"
Write-Host "  - PostgreSQL database"
Write-Host "  - Backend Node.js service"
Write-Host "  - Frontend React service"
Write-Host ""
Write-Host "Setup time: 5-10 minutes"
Write-Host ""
Write-Host "IMPORTANT - Before Blueprint Completes:"
Write-Host ""
Write-Host "Go to Render Dashboard -> Backend Service -> Environment"
Write-Host "Set these variables:"
Write-Host "  GEMINI_API_KEY = (your Google API key from https://aistudio.google.com/apikey)"
Write-Host "  FINNHUB_API_KEY = (optional, leave blank if not using)"
Write-Host ""
Write-Host "After deployment:"
Write-Host "  Backend:  https://nexus-trade-backend.onrender.com"
Write-Host "  Frontend: https://nexus-trade-frontend.onrender.com"
Write-Host ""
Write-Host "Full guide in: RENDER_DEPLOYMENT.md"
Write-Host ""
