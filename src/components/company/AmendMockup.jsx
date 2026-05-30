import React, { useState } from "react";
import { C, AMEND_STATUS } from "../../lib/theme.js";
import { th, td, numCell, inp, Tag, Btn, Panel, TableWrap } from "../common/ui.jsx";
import { Check, ChevronRight, FileText, Paperclip, Upload, X } from "lucide-react";

const mockAmends = [
  { id: "AM-2026-003", type: "참여연구원 변경", submittedAt: "2026-05-20", status: "검토중", reason: "신규 연구원 충원", reviewComment: "", reviewedAt: "", attachments: [] },
  { id: "AM-2026-002", type: "사업비 변경", submittedAt: "2026-04-15", status: "승인", reason: "GPU 서버 추가 도입", reviewComment: "적정 판단", reviewedAt: "2026-04-22", attachments: [{ name: "변경계획서_사업비.pdf" }, { name: "견적서_GPU.pdf" }] },
  { id: "AM-2026-001", type: "연구기간 변경", submittedAt: "2026-03-10", status: "반려", reason: "연구기간 1개월 연장", reviewComment: "사유 불충분", reviewedAt: "2026-03-18", attachments: [{ name: "연장사유서.hwp" }] },
];

const timelineEvents = [
  { date: "2026-03-10", action: "신청", type: "연구기간 변경", status: "반려", reason: "연구기간 1개월 연장", attachCount: 1 },
  { date: "2026-03-18", action: "반려", type: "연구기간 변경", comment: "사유 불충분" },
  { date: "2026-04-15", action: "신청", type: "사업비 변경", status: "승인", reason: "GPU 서버 추가 도입", attachCount: 2 },
  { date: "2026-04-22", action: "승인", type: "사업비 변경", comment: "적정 판단" },
  { date: "2026-05-20", action: "신청", type: "참여연구원 변경", status: "검토중", reason: "신규 연구원 충원", attachCount: 0 },
];

const dotColor = { 신청: C.blue, 승인: C.green, 반려: C.red, 검토중: C.amber };

export function AmendMockup() {
  const [view, setView] = useState("list");
  const [mockFiles, setMockFiles] = useState([]);

  return <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
    <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>협약변경 — 첨부/타임라인 목업</div>

    {/* 뷰 전환 */}
    <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
      <button onClick={() => setView("list")} style={{ padding: "10px 24px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 14, background: view === "list" ? C.blue : C.line, color: view === "list" ? "#fff" : C.text }}>신청내역 (첨부 포함)</button>
      <button onClick={() => setView("timeline")} style={{ padding: "10px 24px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 14, background: view === "timeline" ? C.blue : C.line, color: view === "timeline" ? "#fff" : C.text }}>변경이력 타임라인</button>
      <button onClick={() => setView("form")} style={{ padding: "10px 24px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 14, background: view === "form" ? C.blue : C.line, color: view === "form" ? "#fff" : C.text }}>신청 폼 (첨부)</button>
    </div>

    {/* 신청내역 + 첨부파일 표시 */}
    {view === "list" && <Panel title="협약변경 신청 내역" sub="첨부파일 포함" pad={false}>
      <TableWrap>
        <thead><tr>{["신청번호", "변경유형", "신청일", "상태", "첨부", "변경사유"].map((h) => <th key={h} style={th()}>{h}</th>)}</tr></thead>
        <tbody>
          {mockAmends.map((a) => (
            <React.Fragment key={a.id}>
              <tr>
                <td style={{ ...td(), ...numCell, color: C.sub }}>{a.id}</td>
                <td style={{ ...td(), fontWeight: 600 }}>{a.type}</td>
                <td style={{ ...td(), ...numCell }}>{a.submittedAt}</td>
                <td style={td()}><Tag text={a.status} color={AMEND_STATUS[a.status]} /></td>
                <td style={td()}>
                  {a.attachments.length > 0
                    ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: C.green, fontWeight: 700 }}><Paperclip size={12} /> {a.attachments.length}건</span>
                    : <span style={{ fontSize: 12, color: C.faint }}>없음</span>}
                </td>
                <td style={{ ...td(), color: C.sub }}>{a.reason}</td>
              </tr>
              {/* 첨부파일 상세 (승인된 건) */}
              {a.attachments.length > 0 && <tr>
                <td colSpan={6} style={{ padding: "8px 16px 12px", background: "#FAFBFC", borderBottom: `1px solid ${C.lineSoft}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 6 }}>첨부파일</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {a.attachments.map((f, i) => (
                      <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", border: `1px solid ${C.line}`, borderRadius: 4, fontSize: 12, cursor: "pointer", background: "#fff" }}>
                        <FileText size={13} color={C.blue} /> {f.name}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>}
            </React.Fragment>
          ))}
        </tbody>
      </TableWrap>
    </Panel>}

    {/* 타임라인 */}
    {view === "timeline" && <Panel title="협약변경 이력" sub="시간순 타임라인">
      <div style={{ position: "relative", paddingLeft: 28 }}>
        {/* 세로 선 */}
        <div style={{ position: "absolute", left: 9, top: 8, bottom: 8, width: 2, background: C.line }} />

        {timelineEvents.map((ev, i) => (
          <div key={i} style={{ position: "relative", marginBottom: i < timelineEvents.length - 1 ? 24 : 0 }}>
            {/* 점 */}
            <div style={{ position: "absolute", left: -28 + 4, top: 4, width: 12, height: 12, borderRadius: 999, background: dotColor[ev.action] || C.gray, border: "2px solid #fff", boxShadow: `0 0 0 2px ${dotColor[ev.action] || C.gray}33` }} />

            {/* 내용 */}
            <div style={{ border: `1px solid ${C.line}`, borderRadius: 6, padding: "12px 16px", background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: C.sub, fontVariantNumeric: "tabular-nums" }}>{ev.date}</span>
                  <Tag text={ev.action} color={dotColor[ev.action]} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{ev.type}</span>
                </div>
                {ev.attachCount > 0 && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.sub }}><Paperclip size={12} /> {ev.attachCount}건</span>}
              </div>
              {ev.reason && <div style={{ fontSize: 12.5, color: C.text }}>{ev.reason}</div>}
              {ev.comment && <div style={{ fontSize: 12.5, color: ev.action === "반려" ? C.red : C.green, fontWeight: 600 }}>
                {ev.action === "승인" ? "✓" : "✕"} {ev.comment}
              </div>}
            </div>
          </div>
        ))}
      </div>
    </Panel>}

    {/* 신청 폼 — 첨부파일 영역 */}
    {view === "form" && <>
      <Panel title="협약변경 신청" sub="변경계획서 등 첨부파일을 함께 제출">
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 4, overflow: "hidden", marginBottom: 16 }}>
          {[
            ["변경유형", <select style={inp}><option>사업비 변경</option><option>연구기간 변경</option><option>참여연구원 변경</option></select>],
            ["변경사유", <input placeholder="변경 사유를 입력하세요" style={{ ...inp, width: "100%", maxWidth: 400 }} />],
          ].map(([label, input], i) => (
            <div key={label} style={{ display: "grid", gridTemplateColumns: "110px 1fr", borderBottom: `1px solid ${C.lineSoft}` }}>
              <div style={{ background: "#F8F9FB", padding: "10px 14px", fontSize: 12.5, fontWeight: 700, color: C.text, borderRight: `1px solid ${C.lineSoft}` }}>{label}</div>
              <div style={{ padding: "8px 14px", display: "flex", alignItems: "center" }}>{input}</div>
            </div>
          ))}
        </div>

        {/* 첨부파일 영역 */}
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 4, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Paperclip size={15} color={C.blue} /> 첨부파일 (선택)</div>
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 12 }}>변경계획서, 견적서 등 관련 서류를 첨부하세요. PDF, HWP, DOCX, 이미지 파일을 지원합니다.</div>

          {/* 첨부된 파일 목록 */}
          {mockFiles.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {mockFiles.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", border: `1px solid ${C.line}`, borderRadius: 4, background: "#FAFBFC" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FileText size={14} color={C.blue} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{f}</span>
                </div>
                <button onClick={() => setMockFiles(mockFiles.filter((_, idx) => idx !== i))} style={{ border: "none", background: "none", cursor: "pointer", color: C.red }}><X size={14} /></button>
              </div>
            ))}
          </div>}

          <div style={{ display: "flex", gap: 8 }}>
            <Btn kind="default" sm onClick={() => setMockFiles([...mockFiles, `변경계획서_${mockFiles.length + 1}.pdf`])}><Upload size={13} /> 파일 첨부</Btn>
            <span style={{ fontSize: 12, color: C.sub, display: "flex", alignItems: "center" }}>최대 5개, 각 20MB 이하</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <Btn kind="primary"><FileText size={13} /> 협약변경 신청 제출</Btn>
        </div>
      </Panel>
    </>}
  </div>;
}
