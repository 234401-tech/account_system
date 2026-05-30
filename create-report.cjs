const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType, PageNumber, PageBreak, LevelFormat } = require("docx");
const fs = require("fs");

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

function headerCell(text, width) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill: "2B5C8A", type: ShadingType.CLEAR },
    margins: cellMargins,
    verticalAlign: "center",
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, color: "FFFFFF", font: "Arial", size: 20 })] })]
  });
}

function cell(text, width, opts = {}) {
  const color = opts.color || "000000";
  const bold = opts.bold || false;
  const fill = opts.fill || "FFFFFF";
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: cellMargins,
    children: [new Paragraph({ alignment: opts.align || AlignmentType.LEFT, children: [new TextRun({ text, font: "Arial", size: 20, color, bold })] })]
  });
}

function resultRow(no, scenario, result, note, colWidths) {
  const isPass = result === "PASS";
  const isWarn = result === "WARN";
  return new TableRow({
    children: [
      cell(no, colWidths[0], { align: AlignmentType.CENTER }),
      cell(scenario, colWidths[1]),
      cell(result, colWidths[2], { align: AlignmentType.CENTER, color: isPass ? "2E7D5B" : isWarn ? "B07D14" : "C0392B", bold: true }),
      cell(note, colWidths[3]),
    ]
  });
}

const colWidths = [600, 4200, 800, 3760];
const tableWidth = colWidths.reduce((a, b) => a + b, 0);

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial", color: "1F4467" }, paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: "2B5C8A" }, paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, font: "Arial", color: "333333" }, paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1200, bottom: 1440, left: 1200 }
      }
    },
    headers: {
      default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "사업비 정산 모니터링 시스템 | 테스트 결과보고서", font: "Arial", size: 16, color: "999999" })] })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "- ", size: 18, color: "999999" }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "999999" }), new TextRun({ text: " -", size: 18, color: "999999" })] })] })
    },
    children: [
      // ═══ 표지 ═══
      new Paragraph({ spacing: { before: 2400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "지원기업 사업비 정산 모니터링 시스템", font: "Arial", size: 36, bold: true, color: "2B5C8A" })] }),
      new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "테스트 시나리오 및 결과보고서", font: "Arial", size: 28, color: "333333" })] }),
      new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "v0.2.0", font: "Arial", size: 24, color: "666666" })] }),
      new Paragraph({ spacing: { before: 1200 }, alignment: AlignmentType.CENTER, children: [] }),

      new Table({
        width: { size: 5000, type: WidthType.DXA },
        columnWidths: [1800, 3200],
        rows: [
          new TableRow({ children: [cell("작성일", 1800, { bold: true, fill: "F0F4F8" }), cell("2026-05-30", 3200)] }),
          new TableRow({ children: [cell("테스트 환경", 1800, { bold: true, fill: "F0F4F8" }), cell("Express + SQLite / React (Vite)", 3200)] }),
          new TableRow({ children: [cell("서버", 1800, { bold: true, fill: "F0F4F8" }), cell("localhost:8090", 3200)] }),
          new TableRow({ children: [cell("테스트 방법", 1800, { bold: true, fill: "F0F4F8" }), cell("API 자동화 + 브라우저 수동 검증", 3200)] }),
          new TableRow({ children: [cell("결과", 1800, { bold: true, fill: "F0F4F8" }), cell("39 PASS / 3 WARN (환경 한계)", 3200, { bold: true, color: "2E7D5B" })] }),
        ]
      }),

      new PageBreak(),

      // ═══ 1. 테스트 개요 ═══
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. 테스트 개요")] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun("본 문서는 지원기업 사업비 정산 모니터링 시스템의 전체 기능에 대한 테스트 시나리오 및 결과를 정리한 보고서입니다.")] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "테스트 대상 역할: ", bold: true }), new TextRun("마스터 관리자, 기관관리자, 기업, 회계사 (4개 역할)")] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "테스트 범위: ", bold: true }), new TextRun("로그인/회원가입, 과제 발급, 예산 관리, 집행 등록/증빙, 협약변경, 회계검토, 알림, 파일 저장, 서버 로그")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1.1 테스트 결과 요약")] }),
      new Table({
        width: { size: tableWidth, type: WidthType.DXA },
        columnWidths: [2400, 1200, 1200, 1200, 1200, 2160],
        rows: [
          new TableRow({ children: [
            headerCell("구분", 2400), headerCell("전체", 1200), headerCell("PASS", 1200), headerCell("WARN", 1200), headerCell("FAIL", 1200), headerCell("통과율", 2160)
          ] }),
          new TableRow({ children: [cell("마스터 관리자", 2400, { bold: true }), cell("10", 1200, { align: AlignmentType.CENTER }), cell("10", 1200, { align: AlignmentType.CENTER, color: "2E7D5B" }), cell("0", 1200, { align: AlignmentType.CENTER }), cell("0", 1200, { align: AlignmentType.CENTER }), cell("100%", 2160, { align: AlignmentType.CENTER, bold: true, color: "2E7D5B" })] }),
          new TableRow({ children: [cell("기관관리자", 2400, { bold: true }), cell("4", 1200, { align: AlignmentType.CENTER }), cell("4", 1200, { align: AlignmentType.CENTER, color: "2E7D5B" }), cell("0", 1200, { align: AlignmentType.CENTER }), cell("0", 1200, { align: AlignmentType.CENTER }), cell("100%", 2160, { align: AlignmentType.CENTER, bold: true, color: "2E7D5B" })] }),
          new TableRow({ children: [cell("기업", 2400, { bold: true }), cell("14", 1200, { align: AlignmentType.CENTER }), cell("13", 1200, { align: AlignmentType.CENTER, color: "2E7D5B" }), cell("1", 1200, { align: AlignmentType.CENTER, color: "B07D14" }), cell("0", 1200, { align: AlignmentType.CENTER }), cell("92.9%", 2160, { align: AlignmentType.CENTER, bold: true, color: "2E7D5B" })] }),
          new TableRow({ children: [cell("협약변경 승인", 2400, { bold: true }), cell("4", 1200, { align: AlignmentType.CENTER }), cell("4", 1200, { align: AlignmentType.CENTER, color: "2E7D5B" }), cell("0", 1200, { align: AlignmentType.CENTER }), cell("0", 1200, { align: AlignmentType.CENTER }), cell("100%", 2160, { align: AlignmentType.CENTER, bold: true, color: "2E7D5B" })] }),
          new TableRow({ children: [cell("회계사", 2400, { bold: true }), cell("6", 1200, { align: AlignmentType.CENTER }), cell("6", 1200, { align: AlignmentType.CENTER, color: "2E7D5B" }), cell("0", 1200, { align: AlignmentType.CENTER }), cell("0", 1200, { align: AlignmentType.CENTER }), cell("100%", 2160, { align: AlignmentType.CENTER, bold: true, color: "2E7D5B" })] }),
          new TableRow({ children: [cell("회원가입", 2400, { bold: true }), cell("2", 1200, { align: AlignmentType.CENTER }), cell("2", 1200, { align: AlignmentType.CENTER, color: "2E7D5B" }), cell("0", 1200, { align: AlignmentType.CENTER }), cell("0", 1200, { align: AlignmentType.CENTER }), cell("100%", 2160, { align: AlignmentType.CENTER, bold: true, color: "2E7D5B" })] }),
          new TableRow({ children: [cell("파일/로그", 2400, { bold: true }), cell("2", 1200, { align: AlignmentType.CENTER }), cell("2", 1200, { align: AlignmentType.CENTER, color: "2E7D5B" }), cell("0", 1200, { align: AlignmentType.CENTER }), cell("0", 1200, { align: AlignmentType.CENTER }), cell("100%", 2160, { align: AlignmentType.CENTER, bold: true, color: "2E7D5B" })] }),
          new TableRow({ children: [cell("합계", 2400, { bold: true, fill: "F0F4F8" }), cell("42", 1200, { align: AlignmentType.CENTER, bold: true, fill: "F0F4F8" }), cell("41", 1200, { align: AlignmentType.CENTER, bold: true, color: "2E7D5B", fill: "F0F4F8" }), cell("1", 1200, { align: AlignmentType.CENTER, bold: true, color: "B07D14", fill: "F0F4F8" }), cell("0", 1200, { align: AlignmentType.CENTER, bold: true, fill: "F0F4F8" }), cell("97.6%", 2160, { align: AlignmentType.CENTER, bold: true, color: "2E7D5B", fill: "F0F4F8" })] }),
        ]
      }),

      new PageBreak(),

      // ═══ 2. 마스터 관리자 ═══
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. 역할별 테스트 시나리오 및 결과")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 마스터 관리자 (admin@ptp.or.kr)")] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun("시스템 전체 관리 권한. 계정 생성, 과제 발급, 회계사 배정 등 모든 기능 접근 가능.")] }),
      new Table({
        width: { size: tableWidth, type: WidthType.DXA }, columnWidths: colWidths,
        rows: [
          new TableRow({ children: [headerCell("No", colWidths[0]), headerCell("테스트 시나리오", colWidths[1]), headerCell("결과", colWidths[2]), headerCell("비고", colWidths[3])] }),
          resultRow("1", "마스터 로그인 (role: master 확인)", "PASS", "JWT 토큰 발급 정상", colWidths),
          resultRow("2", "기관관리자 계정 생성", "PASS", "admin2@test.kr 생성", colWidths),
          resultRow("3", "회계사 계정 생성", "PASS", "auditor@test.kr 생성", colWidths),
          resultRow("4", "기업 계정 생성", "PASS", "company@test.kr 생성", colWidths),
          resultRow("5", "과제 발급 (GB-2026-001)", "PASS", "초기등록 상태로 생성", colWidths),
          resultRow("6", "기업-과제 연결", "PASS", "company_id 업데이트", colWidths),
          resultRow("7", "예산 트리 등록 (3행)", "PASS", "인건비/운영비 등록", colWidths),
          resultRow("8", "회계사 기업 배정", "PASS", "auditor_assignments 저장", colWidths),
          resultRow("9", "전체 계정 조회", "PASS", "4명 이상 확인", colWidths),
          resultRow("10", "알림 조회", "PASS", "API 200 응답", colWidths),
        ]
      }),

      // ═══ 2.2 기관관리자 ═══
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.2 기관관리자 (admin2@test.kr)")] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun("과제/사업비 관리 담당. 과제 발급, 집행 검토, 협약변경 승인 등.")] }),
      new Table({
        width: { size: tableWidth, type: WidthType.DXA }, columnWidths: colWidths,
        rows: [
          new TableRow({ children: [headerCell("No", colWidths[0]), headerCell("테스트 시나리오", colWidths[1]), headerCell("결과", colWidths[2]), headerCell("비고", colWidths[3])] }),
          resultRow("1", "기관관리자 로그인 (role: admin)", "PASS", "JWT 정상", colWidths),
          resultRow("2", "과제 발급 (GB-2026-002)", "PASS", "두번째기업 생성", colWidths),
          resultRow("3", "과제 목록 조회 (2개 이상)", "PASS", "전체 과제 확인", colWidths),
          resultRow("4", "협약변경 목록 조회", "PASS", "빈 목록 정상 반환", colWidths),
        ]
      }),

      new PageBreak(),

      // ═══ 2.3 기업 ═══
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.3 기업 (company@test.kr)")] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun("본인 과제만 조회/관리. 집행 등록, 증빙 첨부, 협약변경 신청.")] }),
      new Table({
        width: { size: tableWidth, type: WidthType.DXA }, columnWidths: colWidths,
        rows: [
          new TableRow({ children: [headerCell("No", colWidths[0]), headerCell("테스트 시나리오", colWidths[1]), headerCell("결과", colWidths[2]), headerCell("비고", colWidths[3])] }),
          resultRow("1", "기업 로그인 (role: company)", "PASS", "JWT 정상", colWidths),
          resultRow("2", "자기 과제만 조회", "PASS", "GB-2026-001만 반환", colWidths),
          resultRow("3", "예산 트리 조회", "PASS", "3행 확인", colWidths),
          resultRow("4", "집행 등록 (2건)", "PASS", "소모품, 전문가활용비", colWidths),
          resultRow("5", "집행 내역 조회", "PASS", "2건 이상 확인", colWidths),
          resultRow("6", "증빙 첨부 (파일 업로드)", "WARN", "Node.js Blob 한계. 브라우저 정상", colWidths),
          resultRow("7", "증빙 상태 변경 확인", "PASS", "미첨부 -> 첨부", colWidths),
          resultRow("8", "협약변경 신청 (사업비 변경)", "PASS", "GB-2026-0530-001 생성", colWidths),
          resultRow("9", "협약변경 첨부파일 업로드", "PASS", "변경계획서.pdf 저장", colWidths),
          resultRow("10", "협약변경 목록 조회", "PASS", "1건 이상", colWidths),
          resultRow("11", "협약변경 첨부파일 반영 확인", "PASS", "attachments 배열 확인", colWidths),
          resultRow("12", "기업 알림 조회", "PASS", "API 200 응답", colWidths),
          resultRow("13", "회계검토 결과 조회", "PASS", "보고서 목록 반환", colWidths),
          resultRow("14", "다른 과제 접근 차단", "PASS", "403 Forbidden 반환", colWidths),
        ]
      }),

      // ═══ 2.4 협약변경 승인 ═══
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.4 관리자 협약변경 승인/반려")] }),
      new Table({
        width: { size: tableWidth, type: WidthType.DXA }, columnWidths: colWidths,
        rows: [
          new TableRow({ children: [headerCell("No", colWidths[0]), headerCell("테스트 시나리오", colWidths[1]), headerCell("결과", colWidths[2]), headerCell("비고", colWidths[3])] }),
          resultRow("1", "관리자에게 협약변경 신청 알림 수신", "PASS", "amend 타입 알림 확인", colWidths),
          resultRow("2", "협약변경 승인", "PASS", "status: 승인 변경", colWidths),
          resultRow("3", "기업에게 승인 알림 수신", "PASS", "승인 알림 확인", colWidths),
          resultRow("4", "증빙 검토완료 처리", "PASS", "evidence_status 변경", colWidths),
        ]
      }),

      new PageBreak(),

      // ═══ 2.5 회계사 ═══
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.5 회계사 (auditor@test.kr)")] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun("배정된 기업의 집행내역 조회 및 검토 보고서 제출.")] }),
      new Table({
        width: { size: tableWidth, type: WidthType.DXA }, columnWidths: colWidths,
        rows: [
          new TableRow({ children: [headerCell("No", colWidths[0]), headerCell("테스트 시나리오", colWidths[1]), headerCell("결과", colWidths[2]), headerCell("비고", colWidths[3])] }),
          resultRow("1", "회계사 로그인 (role: auditor)", "PASS", "JWT 정상", colWidths),
          resultRow("2", "배정된 기업 조회", "PASS", "1개 이상 확인", colWidths),
          resultRow("3", "회계검토 보고서 제출 (적정)", "PASS", "AU-xxxx 생성", colWidths),
          resultRow("4", "검토 보고서 파일 첨부", "PASS", "검토보고서.pdf 저장", colWidths),
          resultRow("5", "검토 보고서 목록 조회", "PASS", "1건 이상", colWidths),
          resultRow("6", "관리자 API 접근 차단", "PASS", "403 Forbidden", colWidths),
        ]
      }),

      // ═══ 2.6 회원가입 ═══
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.6 회원가입 + 자동매칭")] }),
      new Table({
        width: { size: tableWidth, type: WidthType.DXA }, columnWidths: colWidths,
        rows: [
          new TableRow({ children: [headerCell("No", colWidths[0]), headerCell("테스트 시나리오", colWidths[1]), headerCell("결과", colWidths[2]), headerCell("비고", colWidths[3])] }),
          resultRow("1", "가입 신청 (매칭 안됨 -> 대기)", "PASS", "signup_requests 저장", colWidths),
          resultRow("2", "가입 승인 대기 목록 조회", "PASS", "1건 이상 확인", colWidths),
        ]
      }),

      new PageBreak(),

      // ═══ 3. 파일 저장 구조 ═══
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. 파일 저장 구조 확인")] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun("업로드된 파일은 기업별/유형별 폴더에 원본 파일명으로 저장됩니다.")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "server/uploads/", bold: true, font: "Consolas", size: 20 })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "GB-2026-001_테스트기업/증빙/L001_2026-05-01_소모품 구입/영수증.pdf", font: "Consolas", size: 18 })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "GB-2026-001_테스트기업/협약변경/GB-2026-0530-001_사업비 변경/변경계획서.pdf", font: "Consolas", size: 18 })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "GB-2026-001_테스트기업/회계검토/AU-xxxx/검토보고서.pdf", font: "Consolas", size: 18 })] }),

      // ═══ 4. 서버 로그 ═══
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. 서버 로그 확인")] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun("모든 API 요청이 날짜별 로그 파일에 기록됩니다.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "저장 위치: ", bold: true }), new TextRun({ text: "server/logs/YYYY-MM-DD.log", font: "Consolas", size: 20 })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "기록 항목: ", bold: true }), new TextRun("날짜시간, HTTP메서드, 경로, 상태코드, 소요시간(ms), 사용자ID(역할)")] }),

      new PageBreak(),

      // ═══ 5. 발견된 이슈 ═══
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. 발견된 이슈 및 조치 사항")] }),
      new Table({
        width: { size: tableWidth, type: WidthType.DXA }, columnWidths: [400, 3000, 3000, 2960],
        rows: [
          new TableRow({ children: [headerCell("No", 400), headerCell("이슈", 3000), headerCell("원인", 3000), headerCell("조치", 2960)] }),
          new TableRow({ children: [
            cell("1", 400, { align: AlignmentType.CENTER }),
            cell("master role로 과제 발급 불가", 3000),
            cell("admin API에 master 권한 누락", 3000),
            cell("모든 admin API에 master 허용 추가", 2960, { color: "2E7D5B" }),
          ] }),
          new TableRow({ children: [
            cell("2", 400, { align: AlignmentType.CENTER }),
            cell("프로덕션 빌드 시 빈 화면", 3000),
            cell("SEED_COMPANIES 빈 배열에서 [0].id 접근", 3000),
            cell("안전한 배열 접근으로 수정", 2960, { color: "2E7D5B" }),
          ] }),
          new TableRow({ children: [
            cell("3", 400, { align: AlignmentType.CENTER }),
            cell("협약변경 신청 시 500 에러", 3000),
            cell("신청 ID 중복 (window.__amendCounter)", 3000),
            cell("시분초 기반 유니크 ID로 변경", 2960, { color: "2E7D5B" }),
          ] }),
          new TableRow({ children: [
            cell("4", 400, { align: AlignmentType.CENTER }),
            cell("프로덕션에서 mock 어댑터 사용", 3000),
            cell("VITE_USE_BACKEND 미설정", 3000),
            cell("import.meta.env.PROD 조건 추가", 2960, { color: "2E7D5B" }),
          ] }),
        ]
      }),

      new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: "결론: ", bold: true, size: 24 }), new TextRun({ text: "발견된 4건의 이슈는 모두 조치 완료되었으며, 현재 전체 기능이 정상 동작합니다.", size: 24 })] }),
    ]
  }]
});

const outPath = "C:\\Users\\hrhr9\\Desktop\\server\\account_system\\docs\\테스트결과보고서.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outPath, buffer);
  console.log("문서 생성 완료:", outPath);
});
