@echo off
chcp 65001 >nul
echo ========================================
echo   사업비 정산 모니터링 시스템 설치
echo ========================================
echo.

:: Node.js 설치 확인
where node >nul 2>nul
if errorlevel 1 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo.
    echo   다운로드: https://nodejs.org
    echo   Node.js 18 이상 LTS 버전을 설치하세요.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [확인] Node.js %NODE_VER% 설치됨

:: Git 설치 확인
where git >nul 2>nul
if errorlevel 1 (
    echo [오류] Git이 설치되어 있지 않습니다.
    echo.
    echo   다운로드: https://git-scm.com
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('git --version') do set GIT_VER=%%i
echo [확인] %GIT_VER% 설치됨
echo.

:: 프론트엔드 의존성 설치
echo [1/5] 프론트엔드 의존성 설치...
call npm install
if errorlevel 1 (
    echo [오류] npm install 실패
    pause
    exit /b 1
)

:: 프론트엔드 빌드
echo [2/5] 프론트엔드 빌드...
call npm run build
if errorlevel 1 (
    echo [오류] 빌드 실패
    pause
    exit /b 1
)

:: 백엔드 의존성 설치
echo [3/5] 백엔드 의존성 설치...
cd server
call npm install
if errorlevel 1 (
    echo [오류] 백엔드 npm install 실패
    pause
    exit /b 1
)

:: DB 초기화
echo [4/5] 데이터베이스 초기화...
if exist "data\app.db" (
    echo   기존 DB 발견. 초기화하시겠습니까?
    set /p RESET_DB="  DB 초기화 (y/n, 기본 n): "
    if /i "%RESET_DB%"=="y" (
        del data\app.db
        node seed.js
    ) else (
        echo   기존 DB 유지
    )
) else (
    node seed.js
)

cd ..

:: 완료
echo.
echo [5/5] 설치 완료!
echo.
echo ========================================
echo   설치가 완료되었습니다.
echo.
echo   서버 시작: start.bat 더블클릭
echo   코드 업데이트: update.bat 더블클릭
echo.
echo   접속 URL: http://localhost:8080
echo.
echo   계정 정보:
echo   - 마스터: admin@ptp.or.kr / admin1234
echo   - 기관관리자: admin@admin.kr / admin1234
echo   - 기업: test@test.kr / test1234
echo ========================================
pause
