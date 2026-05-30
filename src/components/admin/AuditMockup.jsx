import React, { useState } from "react";
import { C } from "../../lib/theme.js";
import { th, td, numCell, inp, Tag, Btn, Panel, TableWrap, Kpi, DropZone } from "../common/ui.jsx";
import { Check, FileText, Download, Eye, UserPlus, X, Settings } from "lucide-react";

const mockAuditors = [
  { id: "AUD-001", name: "김회계사", email: "kim@audit.kr", assigned: ["C-2026-001", "C-2026-002", "C-2026-003"] },
  { id: "AUD-002", name: "박회계사", email: "park@audit.kr", assigned: ["C-2026-004", "C-2026-005"] },
];

const mockCompanies = [
  { id: "C-2026-001", name: "뉴로메카" },
  { id: "C-2026-002", name: "에이아이파크" },
  { id: "C-2026-003", name: "비전테크놀로지" },
  { id: "C-2026-004", name: "코어엣지" },
  { id: "C-2026-005", name: "데이터브릿지" },
  { id: "C-2026-006", name: "스마트팩토리랩" },
  { id: "C-2026-007", name: "그린에이아이" },
];

const mockAudits = [
  { id: "AU-2026-001", companyId: "C-2026-001", company: "뉴로메카", auditor: "김회계사", date: "2026-05-28", status: "검토완료", opinion: "적정", summary: "집행 내역 적정. 비목 초과 없음.", files: [{ name: "뉴로메카_검토보고서.pdf" }, { name: "뉴로메카_증빙대사표.xlsx" }] },
  { id: "AU-2026-002", companyId: "C-2026-002", company: "에이아이파크", auditor: "김회계사", date: "2026-05-25", status: "보완필요", opinion: "부적정", summary: "연구시설·장비비 초과집행. 소명 필요.", files: [{ name: "에이아이파크_검토보고서.pdf" }] },
  { id: "AU-2026-003", companyId: "C-2026-003", company: "비전테크놀로지", auditor: "김회계사", date: "", status: "미검토", opinion: "", summary: "", files: [] },
];

const statusColor = { 검토완료: C.green, 보완필요: C.red, 검토중: C.amber, 미검토: C.gray };

export function AuditMockup() {
  const [view, setView] = useState("admin");
  const [adminTab, setAdminTab] = useState("status");
  const [files, setFiles] = useState([]);
  const [open, setOpen] = useState(null);
  const [assignOpen, setAssignOpen] = useState(null);

  return <div style={{ padding: 20, maxWidth: 1000, margin: "0 auto" }}>
    <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>회계검토 기능 — 목업</div>

    <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
      {[["admin", "관리자 화면"], ["auditor", "회계사 화면"], ["company", "기업 화면"]].map(([k, l]) => (
        <button key={k} onClick={() => setView(k)} style={{ padding: "10px 24px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13, background: view === k ? C.blue : C.line, color: view === k ? "#fff" : C.text }}>{l}</button>
      ))}
    </div>

    {/* ═══ 관리자 화면 ═══ */}
    {view === "admin" && <>
      <div style={{ display: "flex", borderBottom: `2px solid ${C.line}`, marginBottom: 14 }}>
        {[["status", "검토 현황"], ["auditors", "회계사 관리"], ["assign", "기업 배정"]].map(([k, l]) => (
          <button key={k} onClick={() => setAdminTab(k)} style={{ padding: "10px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: adminTab === k ? "#fff" : "transparent", color: adminTab === k ? C.blue : C.sub, borderBottom: adminTab === k ? `2.5px solid ${C.blue}` : "2.5px solid transparent", marginBottom: -2 }}>{l}</button>
        ))}
      </div>

      {/* 검토 현황 */}
      {adminTab === "status" && <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
          <Kpi label="전체 과제" value={7} unit="개" accent={C.gray} />
          <Kpi label="검토완료" value={1} unit="개" accent={C.green} />
          <Kpi label="보완필요" value={1} unit="개" accent={C.red} />
          <Kpi label="미검토" value={5} unit="개" accent={C.amber} />
        </div>
        <Panel title="회계검토 현황" pad={false}>
          <TableWrap>
            <thead><tr>{["기업명", "담당 회계사", "검토일", "의견", "상태", "보고서", ""].map((h) => <th key={h} style={th()}>{h}</th>)}</tr></thead>
            <tbody>
              {mockAudits.map((a) => <React.Fragment key={a.id}>
                <tr>
                  <td style={{ ...td(), fontWeight: 700 }}>{a.company}</td>
                  <td style={td()}>{a.auditor}</td>
                  <td style={{ ...td(), ...numCell }}>{a.date || "-"}</td>
                  <td style={td()}>{a.opinion ? <Tag text={a.opinion} color={a.opinion === "적정" ? C.green : C.red} /> : <span style={{ color: C.faint }}>-</span>}</td>
                  <td style={td()}><Tag text={a.status} color={statusColor[a.status]} /></td>
                  <td style={td()}>{a.files.length > 0 ? <span style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>{a.files.length}건</span> : <span style={{ fontSize: 12, color: C.faint }}>없음</span>}</td>
                  <td style={td()}><Btn kind="default" sm onClick={() => setOpen(open === a.id ? null : a.id)}>{open === a.id ? "닫기" : "상세"}</Btn></td>
                </tr>
                {open === a.id && <tr><td colSpan={7} style={{ padding: 16, background: "#FAFBFC", borderBottom: `1px solid ${C.lineSoft}` }}>
                  {a.summary && <div style={{ fontSize: 13, marginBottom: 10 }}><b>검토 요약:</b> {a.summary}</div>}
                  {a.files.length > 0 && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {a.files.map((f, i) => (
                      <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", border: `1px solid ${C.line}`, borderRadius: 4, fontSize: 12.5, background: "#fff" }}>
                        <FileText size={14} color={C.blue} /> {f.name} <Download size={12} color={C.sub} style={{ cursor: "pointer" }} />
                      </div>
                    ))}
                  </div>}
                  {a.files.length === 0 && <div style={{ color: C.sub, fontSize: 13 }}>보고서 미제출</div>}
                </td></tr>}
              </React.Fragment>)}
            </tbody>
          </TableWrap>
        </Panel>
      </>}

      {/* 회계사 관리 */}
      {adminTab === "auditors" && <>
        <Panel title="등록된 회계사" sub="회계사 계정 관리" pad={false}
          extra={<Btn kind="primary" sm><UserPlus size={13} /> 회계사 등록</Btn>}>
          <TableWrap>
            <thead><tr>{["이름", "이메일", "배정 기업수", "배정 기업", "관리"].map((h) => <th key={h} style={th()}>{h}</th>)}</tr></thead>
            <tbody>
              {mockAuditors.map((a) => (
                <tr key={a.id}>
                  <td style={{ ...td(), fontWeight: 700 }}>{a.name}</td>
                  <td style={{ ...td(), color: C.sub }}>{a.email}</td>
                  <td style={{ ...td(), ...numCell }}>{a.assigned.length}개</td>
                  <td style={td()}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {a.assigned.map((cid) => {
                        const co = mockCompanies.find((c) => c.id === cid);
                        return <Tag key={cid} text={co ? co.name : cid} color={C.blue} />;
                      })}
                    </div>
                  </td>
                  <td style={td()}><Btn kind="default" sm><Settings size={12} /> 수정</Btn></td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Panel>

        {/* 회계사 등록 폼 */}
        <Panel title="회계사 등록" sub="새 회계사 계정을 생성합니다">
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 4, overflow: "hidden" }}>
            {[
              ["이름", <input placeholder="홍길동" style={{ ...inp, width: 200 }} />],
              ["이메일", <input placeholder="auditor@email.com" style={{ ...inp, width: 300 }} />],
              ["비밀번호", <input type="password" placeholder="초기 비밀번호" style={{ ...inp, width: 200 }} />],
            ].map(([label, input], i) => (
              <div key={label} style={{ display: "grid", gridTemplateColumns: "110px 1fr", borderBottom: `1px solid ${C.lineSoft}` }}>
                <div style={{ background: "#F8F9FB", padding: "10px 14px", fontSize: 12.5, fontWeight: 700, color: C.text, borderRight: `1px solid ${C.lineSoft}` }}>{label}</div>
                <div style={{ padding: "8px 14px", display: "flex", alignItems: "center" }}>{input}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
            <Btn kind="primary"><UserPlus size={13} /> 등록</Btn>
          </div>
        </Panel>
      </>}

      {/* 기업 배정 */}
      {adminTab === "assign" && <>
        <Panel title="기업 배정" sub="회계사에게 검토할 기업을 배정합니다" pad={false}>
          <TableWrap>
            <thead><tr>{["기업명", "과제번호", "담당 회계사", "배정"].map((h) => <th key={h} style={th()}>{h}</th>)}</tr></thead>
            <tbody>
              {mockCompanies.map((co) => {
                const auditor = mockAuditors.find((a) => a.assigned.includes(co.id));
                return <tr key={co.id}>
                  <td style={{ ...td(), fontWeight: 700 }}>{co.name}</td>
                  <td style={{ ...td(), ...numCell, color: C.sub }}>{co.id}</td>
                  <td style={td()}>{auditor
                    ? <Tag text={auditor.name} color={C.blue} />
                    : <span style={{ fontSize: 12, color: C.faint }}>미배정</span>}</td>
                  <td style={td()}>
                    <select style={{ ...inp, padding: "5px 8px", fontSize: 12 }} defaultValue={auditor?.id || ""}>
                      <option value="">미배정</option>
                      {mockAuditors.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.email})</option>)}
                    </select>
                  </td>
                </tr>;
              })}
            </tbody>
          </TableWrap>
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px" }}>
            <Btn kind="primary"><Check size={13} /> 배정 저장</Btn>
          </div>
        </Panel>
      </>}
    </>}

    {/* ═══ 회계사 화면 ═══ */}
    {view === "auditor" && <>
      <div style={{ background: C.blueLt, border: `1px solid ${C.blue}33`, borderRadius: 4, padding: "12px 16px", marginBottom: 14, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span><b>김회계사</b>님, 배정된 기업 <b>3개</b>를 검토할 수 있습니다.</span>
        <Tag text="회계사" color={C.blue} />
      </div>
      <Panel title="배정된 과제" sub="검토 대상 기업 목록" pad={false}>
        <TableWrap>
          <thead><tr>{["과제번호", "기업명", "사업비(원)", "검토상태", "관리"].map((h, i) => <th key={h} style={th(i === 2 ? "right" : "left")}>{h}</th>)}</tr></thead>
          <tbody>
            {mockAudits.map((a) => (
              <tr key={a.id}>
                <td style={{ ...td(), ...numCell, color: C.sub }}>{a.companyId}</td>
                <td style={{ ...td(), fontWeight: 700 }}>{a.company}</td>
                <td style={{ ...td("right"), ...numCell }}>390,000,000</td>
                <td style={td()}><Tag text={a.status} color={statusColor[a.status]} /></td>
                <td style={td()}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn kind="default" sm><Eye size={12} /> 집행조회</Btn>
                    {a.status !== "검토완료" && <Btn kind="primary" sm><FileText size={12} /> 보고서 작성</Btn>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>

      <Panel title="검토 보고서 작성" sub="비전테크놀로지 (C-2026-003)">
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
          {[
            ["대상 기업", <select style={{ ...inp, minWidth: 200 }}><option>비전테크놀로지 (C-2026-003)</option><option>뉴로메카 (C-2026-001)</option><option>에이아이파크 (C-2026-002)</option></select>],
            ["검토 의견", <select style={inp}><option>적정</option><option>부적정</option><option>한정</option></select>],
            ["검토 요약", <textarea placeholder="검토 요약을 입력하세요" rows={3} style={{ ...inp, width: "100%", maxWidth: 500, resize: "vertical" }} />],
          ].map(([label, input]) => (
            <div key={label} style={{ display: "grid", gridTemplateColumns: "110px 1fr", borderBottom: `1px solid ${C.lineSoft}` }}>
              <div style={{ background: "#F8F9FB", padding: "10px 14px", fontSize: 12.5, fontWeight: 700, color: C.text, borderRight: `1px solid ${C.lineSoft}`, display: "flex", alignItems: "flex-start" }}>{label}</div>
              <div style={{ padding: "8px 14px" }}>{input}</div>
            </div>
          ))}
        </div>
        <DropZone files={files} setFiles={setFiles} label="검토 보고서 첨부" hint="검토보고서, 증빙대사표 등을 첨부하세요." />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <Btn kind="primary"><Check size={13} /> 보고서 제출</Btn>
        </div>
      </Panel>
    </>}

    {/* ═══ 기업 화면 ═══ */}
    {view === "company" && <>
      <Panel title="회계검토 결과" sub="회계사 검토 보고서 열람">
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: C.greenLt, border: `1px solid ${C.green}55`, borderRadius: 4, marginBottom: 14, fontSize: 13, fontWeight: 700, color: C.green }}>
          <Check size={15} /> 검토 완료 — 적정 의견
        </div>
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
          {[
            ["담당 회계사", "김회계사"],
            ["검토일", "2026-05-28"],
            ["검토 의견", "적정"],
            ["검토 요약", "집행 내역 적정. 비목 초과 없음."],
          ].map(([label, val], i, arr) => (
            <div key={label} style={{ display: "grid", gridTemplateColumns: "110px 1fr", borderBottom: i < arr.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
              <div style={{ background: "#F8F9FB", padding: "10px 14px", fontSize: 12.5, fontWeight: 700, color: C.text, borderRight: `1px solid ${C.lineSoft}` }}>{label}</div>
              <div style={{ padding: "10px 14px", fontSize: 13, color: label === "검토 의견" ? C.green : C.text, fontWeight: label === "검토 의견" ? 700 : 400 }}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.sub, marginBottom: 8 }}>보고서 파일</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[{ name: "뉴로메카_검토보고서.pdf" }, { name: "뉴로메카_증빙대사표.xlsx" }].map((f, i) => (
            <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 14px", border: `1px solid ${C.line}`, borderRadius: 4, fontSize: 13, background: "#fff", cursor: "pointer" }}>
              <FileText size={14} color={C.blue} /> {f.name} <Download size={13} color={C.sub} />
            </div>
          ))}
        </div>
      </Panel>
    </>}
  </div>;
}
