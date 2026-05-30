@echo off
chcp 65001 >nul
title Settlement Server
echo ========================================
echo   Settlement Monitoring System
echo ========================================
echo.

if not exist "dist" (
    echo Building frontend...
    call npm install
    call npm run build
)

cd server
if not exist "node_modules" call npm install
if not exist "data" mkdir data
if not exist "data\app.db" node seed.js

echo.
echo   Server starting on port 8080...
echo   http://localhost:8080
echo.
echo   Master: admin@ptp.or.kr / admin1234
echo   Admin:  admin@admin.kr / admin1234
echo   Company: test@test.kr / test1234
echo.

node index.js
pause
