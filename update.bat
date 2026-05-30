@echo off
chcp 65001 >nul
echo ========================================
echo   운영 서버 업데이트 (Git Pull)
echo ========================================
echo.

:: Git Pull
echo [1/4] 최신 코드 받는 중...
git pull origin main
if errorlevel 1 (
    echo [오류] Git Pull 실패. 충돌이 있는지 확인하세요.
    pause
    exit /b 1
)

:: 프론트엔드 재빌드
echo [2/4] 프론트엔드 재빌드...
call npm install
call npm run build

:: 백엔드 의존성
echo [3/4] 백엔드 의존성 업데이트...
cd server
call npm install
cd ..

echo.
echo ========================================
echo [4/4] 업데이트 완료!
echo.
echo   서버를 재시작하려면 start.bat 실행
echo   (현재 실행 중인 서버는 Ctrl+C로 종료 후)
echo ========================================
pause
