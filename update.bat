@echo off
chcp 65001 >nul
title Settlement Update
echo ========================================
echo   Updating from Git...
echo ========================================
echo.

echo [1/3] Git pull...
git pull origin main

echo [2/3] Rebuilding frontend...
call npm install
call npm run build

echo [3/3] Updating backend...
cd server
call npm install
cd ..

echo.
echo   Update complete!
echo   Run start.bat to restart server.
echo.
pause
