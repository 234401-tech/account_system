@echo off
chcp 65001 >nul
echo ========================================
echo   사업비 정산 모니터링 시스템 시작
echo ========================================
echo.

:: 프론트엔드 빌드 확인
if not exist "dist" (
    echo [1/3] 프론트엔드 빌드 중...
    call npm install
    call npm run build
) else (
    echo [1/3] 프론트엔드 빌드 완료 (dist 폴더 존재)
)

:: 백엔드 의존성
echo [2/3] 백엔드 의존성 확인...
cd server
if not exist "node_modules" (
    call npm install
)

:: DB 초기화 (최초만)
if not exist "data\app.db" (
    echo [3/3] DB 초기화 + 시드 데이터...
    node seed.js
) else (
    echo [3/3] DB 존재. 건너뜀
)

echo.
echo ========================================
echo   서버 시작 (포트 8080)
echo   http://localhost:8080
echo.
echo   마스터: admin@ptp.or.kr / admin1234
echo   기관관리자: admin@admin.kr / admin1234
echo   기업: test@test.kr / test1234
echo ========================================
echo.

node index.js
pause
