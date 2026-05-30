@echo off
chcp 65001 >nul
title Settlement System Install
echo ========================================
echo   Settlement Monitoring System Install
echo ========================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not installed.
    echo   Download: https://nodejs.org
    pause
    exit /b 1
)

node -v
echo [OK] Node.js installed
echo.

echo [1/5] Installing frontend dependencies...
call npm install

echo [2/5] Building frontend...
call npm run build

echo [3/5] Installing backend dependencies...
cd server
call npm install

echo [4/5] Initializing database...
if not exist "data" mkdir data
if not exist "data\app.db" (
    node seed.js
) else (
    echo   DB already exists. Skipping.
)
cd ..

echo.
echo [5/5] Install complete!
echo.
echo ========================================
echo   Start server: start.bat
echo   Update code:  update.bat
echo.
echo   URL: http://localhost:8080
echo.
echo   Master: admin@ptp.or.kr / admin1234
echo   Admin:  admin@admin.kr / admin1234
echo   Company: test@test.kr / test1234
echo ========================================
pause
