@echo off
setlocal
echo ======================================================================
echo    MGR IEI STUDENT CHAPTER PLATFORM — PRODUCTION DEPLOYMENT
echo    Dr. M.G.R. Educational and Research Institute (NAAC A+ Accredited)
echo ======================================================================
echo.

echo [Step 1/3] Running automated verification test suite...
call npm test
if %errorlevel% neq 0 (
    echo [ERROR] Verification test suite failed. Aborting deployment.
    pause
    exit /b %errorlevel%
)

echo.
echo [Step 2/3] Building production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed. Aborting deployment.
    pause
    exit /b %errorlevel%
)

echo.
echo [Step 3/3] Deploying to Firebase Hosting, Firestore Rules and Storage Rules...
call firebase deploy
if %errorlevel% neq 0 (
    echo [ERROR] Firebase deployment failed. Make sure you are logged in via 'firebase login'.
    pause
    exit /b %errorlevel%
)

echo.
echo ======================================================================
echo    DEPLOYMENT SUCCESSFUL!
echo    Live Production URL: https://sachin-crackers-smartpos-81c6a.web.app
echo    Alternative URL:     https://sachin-crackers-smartpos-81c6a.firebaseapp.com
echo ======================================================================
echo.
pause
