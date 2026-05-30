#!/bin/bash
# 사내 서버 배포 스크립트
# 사용법: bash deploy.sh

echo "=== 사업비 정산 모니터링 시스템 배포 ==="

# 1. 프론트엔드 빌드
echo "[1/4] 프론트엔드 빌드..."
npm install
npm run build

# 2. 백엔드 의존성 설치
echo "[2/4] 백엔드 의존성 설치..."
cd server
npm install

# 3. DB 초기화 (최초 배포 시만)
if [ ! -f "data/app.db" ]; then
  echo "[3/4] DB 초기화 + 시드 데이터 삽입..."
  node seed.js
else
  echo "[3/4] DB 이미 존재. 건너뜀 (초기화 필요 시: cd server && rm data/app.db && node seed.js)"
fi

# 4. 서버 시작
echo "[4/4] 서버 시작 (포트 8080)..."
echo ""
echo "  접속 URL: http://$(hostname -I | awk '{print $1}'):8080"
echo ""
echo "  계정 정보:"
echo "  - 마스터: admin@ptp.or.kr / admin1234"
echo "  - 기관관리자: admin@admin.kr / admin1234"
echo "  - 기업: test@test.kr / test1234"
echo ""
node index.js
