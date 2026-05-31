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
node migrate.js

:: Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do set LOCAL_IP=%%b
)

echo.
echo ========================================
echo   Server running on port 8090
echo.
echo   Local:   http://localhost:8090
echo   Network: http://%LOCAL_IP%:8090
echo ========================================
echo.

node index.js
pause
