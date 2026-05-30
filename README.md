# 지원기업 사업비 정산 모니터링 시스템 (목업)

경북AI혁신본부 · ICT방송통신기금 회계규정 기반. Vite + React 프론트엔드 목업이며,
백엔드 연동을 전제로 API 추상화 레이어를 갖추고 있습니다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 프로덕션 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
```

## 두 가지 역할

- **기업 포털** — 회원가입/로그인 후 본인 과제만 조회. 초기등록(참여연구원·계좌) → 과제현황 / 예산현황 / 예산집행현황 / 참여연구원 / 협약변경 / 정산
- **전문기관 관리자** — 과제 발급(협약체결), 모니터링 대시보드, 집행점검, 협약변경 검토(승인/반려), 사용실적 검토, 정산확정·환수

상단 바에서 역할을 전환합니다. (데모용)

## 폴더 구조

```
src/
  main.jsx                앱 엔트리
  App.jsx                 상단바 + 역할 전환 + 라우팅
  styles/global.css       전역 스타일
  lib/
    theme.js              디자인 토큰(C), 비목/상태 상수
    format.js             금액·비율 포맷 (사업비는 천원 단위 정수)
    xlsx.js               엑셀 다운로드/업로드 (SheetJS)
    checks.js             자동 집행점검 규칙(비목 초과·참여율 초과)
  api/
    index.js              어댑터 스위치 (mock ↔ http) + REST 계약 문서
    mock.js               메모리 + seed 기반 mock 구현
    http.js               실제 백엔드 REST 어댑터 (시그니처 동일)
    client.js             fetch 래퍼
    seed.js               목업 시드 데이터
  context/
    AppContext.jsx        전역 상태 + API 호출 (companies, amendments)
  components/
    common/               Shell(LNB), ui(버튼·패널·표·KPI 등), ExcelBulk
    company/index.jsx     기업 포털 화면들
    admin/index.jsx       전문기관 관리자 화면들
```

## 백엔드 연동 방법

1. `.env` 에 `VITE_API_BASE=https://api.example.com` 설정
2. `src/api/index.js` 에서 `import * as real from "./http.js"` 활성화하고 `impl = real` 로 변경
3. `src/api/http.js` 의 엔드포인트가 백엔드 계약과 일치하는지 확인 (계약은 `index.js` 상단 주석 참조)

UI 컴포넌트는 `api.*` 함수만 호출하므로, mock → http 교체만으로 연동이 끝납니다.

## 데이터 단위 주의

- 사업비/예산/집행액은 **천원 단위 정수**로 저장합니다. (`won()` = ×1000 원 표기, `eok()` = 억원 환산)
- 예산현황(BudgetSheet)·집행현황(LedgerSheet)의 금액은 **원 단위**로 표시/입력합니다(별도 트리 데이터).

## 다음 작업(권장)

- 예산현황 ↔ 집행현황 연동: 집행 등록 시 비목별 집행액이 예산현황에 자동 반영
- 증빙 첨부 실제 업로드(멀티파트) + 전문기관 검토단계 증빙 대사
- 협약변경 첨부서류(변경계획서) 업로드, 변경 이력 타임라인
- 인증/권한: 기업 계정 ↔ 과제 매칭, 전문기관 관리자 권한 분리
