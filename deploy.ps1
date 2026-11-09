# PowerShell Production Deployment Script
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   MGR IEI STUDENT CHAPTER PLATFORM — PRODUCTION DEPLOYMENT" -ForegroundColor Cyan
Write-Host "   Dr. M.G.R. Educational and Research Institute (NAAC A+ Accredited)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Run tests
Write-Host "[Step 1/3] Running automated verification test suite..." -ForegroundColor Yellow
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Integration tests failed. Deployment aborted." -ForegroundColor Red
    exit 1
}

# Step 2: Build bundle
Write-Host ""
Write-Host "[Step 2/3] Building production bundle..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Production build failed. Deployment aborted." -ForegroundColor Red
    exit 1
}

# Step 3: Firebase deploy
Write-Host ""
Write-Host "[Step 3/3] Deploying to Firebase Hosting, Firestore Rules and Storage Rules..." -ForegroundColor Yellow
firebase deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Firebase deployment failed. Run 'firebase login' to authenticate." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "   DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "   Live URL:        https://sachin-crackers-smartpos-81c6a.web.app" -ForegroundColor Green
Write-Host "   Alternative URL: https://sachin-crackers-smartpos-81c6a.firebaseapp.com" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
