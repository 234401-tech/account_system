import React, { useState, useEffect } from "react";
import { ClipboardList, Eye, FileText, Check } from "lucide-react";
import { C } from "../../lib/theme.js";
import { sum, rate } from "../../lib/format.js";
import { api } from "../../api/index.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Shell } from "../common/Shell.jsx";
import { th, td, numCell, inp, Tag, Btn, Panel, Breadcrumb, PageHead, Kpi, TableWrap, InfoBar, DropZone, Toast } from "../common/ui.jsx";

const statusColor = { 검토완료: C.green, 보완필요: C.red, 검토중: C.amber, 미검토: C.gray };

export function AuditorApp() {
  const { user } = useAuth();
  const [tab, setTab] = useState("list");
  const [companies, setCompanies] = useState([]);
  const [reports, setReports] = useState([]);
  const [selCompany, setSelCompany] = useState(null);
  const [toast, setToast] = useState("");

  // 보고서 작성 폼
  const [opinion, setOpinion] = useState("적정");
  const [summary, setSummary] = useState("");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 3000); return () => clearTimeout(t); } }, [toast]);

  const loadData = async () => {
    try {
      const [cos, reps] = await Promise.all([api.getMyAuditCompanies(), api.listAuditReports()]);
      setCompanies(cos);
      setReports(reps);
    } catch (e) { console.error(e); }
  };

  const getReport = (companyId) => reports.find((r) => r.company_id === companyId || r.companyId === companyId);

  const submitReport = async () => {
    if (!selCompany) return;
    setBusy(true);
    try {
      const result = await api.createAuditReport({ companyId: selCompany.id, opinion, summary });
      const reportId = result.id;
      for (const f of files) {
        try { await api.uploadAuditFile(reportId, f.file); } catch (e) { console.error(e); }
      }
      setToast("검토 보고서가 제출되었습니다.");
      setFiles([]); setSummary(""); setSelCompany(null); setTab("list");
      await loadData();
    } catch (e) { console.error(e); setToast("제출 실패: " + e.message); }
    setBusy(false);
  };

  const menu = [
    { k: "list", label: "배정 과제", icon: ClipboardList },
    { k: "write", label: "보고서 작성", icon: FileText },
  ];
  const cur = menu.find((m) => m.k === tab);

  return (
    <Shell role="auditor" menu={menu} active={tab} onNav={setTab} orgLabel={`회계사 · ${user.name}`} sub={user.email}>
      <Breadcrumb items={["회계사", cur.label]} />

      {tab === "list" && <>
        <PageHead title="배정된 과제" />
        <div style={{ background: C.blueLt, border: `1px solid ${C.blue}33`, borderRadius: 4, padding: "10px 16px", marginBottom: 14, fontSize: 13 }}>
          배정된 기업의 집행내역을 조회하고, 검토 보고서를 제출할 수 있습니다.
        </div>
        <Panel title="검토 대상 기업" sub={`${companies.length}개 배정`} pad={false}>
          {companies.length === 0 ? <div style={{ padding: "24px 16px", textAlign: "center", color: C.sub }}>배정된 기업이 없습니다. 관리자에게 문의하세요.</div> :
          <TableWrap>
            <thead><tr>{["과제번호", "기업명", "사업비(원)", "집행률", "검토상태", "관리"].map((h, i) => <th key={h} style={th(i === 2 ? "right" : "left")}>{h}</th>)}</tr></thead>
            <tbody>
              {companies.map((c) => {
                const b = sum(c.budget || {}), e = sum(c.exec || {}), r = rate(e, b);
                const report = getReport(c.id);
                const st = report?.status || "미검토";
                return <tr key={c.id}>
                  <td style={{ ...td(), ...numCell, color: C.sub }}>{c.id}</td>
                  <td style={{ ...td(), fontWeight: 700 }}>{c.name}</td>
                  <td style={{ ...td("right"), ...numCell }}>{b.toLocaleString()}</td>
                  <td style={{ ...td(), ...numCell }}>{r}%</td>
                  <td style={td()}><Tag text={st} color={statusColor[st]} /></td>
                  <td style={td()}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {st !== "검토완료" && <Btn kind="primary" sm onClick={() => { setSelCompany(c); setTab("write"); }}><FileText size={12} /> 보고서 작성</Btn>}
                      {st === "검토완료" && <Tag text="완료" color={C.green} />}
                    </div>
                  </td>
                </tr>;
              })}
            </tbody>
          </TableWrap>}
        </Panel>
      </>}

      {tab === "write" && <>
        <PageHead title="검토 보고서 작성" />
        <Panel title="보고서 작성" sub={selCompany ? `${selCompany.name} (${selCompany.id})` : "대상 기업을 선택하세요"}>
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", borderBottom: `1px solid ${C.lineSoft}` }}>
              <div style={{ background: "#F8F9FB", padding: "10px 14px", fontSize: 12.5, fontWeight: 700, borderRight: `1px solid ${C.lineSoft}` }}>대상 기업</div>
              <div style={{ padding: "8px 14px" }}>
                <select value={selCompany?.id || ""} onChange={(e) => setSelCompany(companies.find((c) => c.id === e.target.value))} style={{ ...inp, minWidth: 250 }}>
                  <option value="">기업 선택</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", borderBottom: `1px solid ${C.lineSoft}` }}>
              <div style={{ background: "#F8F9FB", padding: "10px 14px", fontSize: 12.5, fontWeight: 700, borderRight: `1px solid ${C.lineSoft}` }}>검토 의견</div>
              <div style={{ padding: "8px 14px" }}>
                <select value={opinion} onChange={(e) => setOpinion(e.target.value)} style={inp}>
                  <option>적정</option><option>부적정</option><option>한정</option>
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "110px 1fr" }}>
              <div style={{ background: "#F8F9FB", padding: "10px 14px", fontSize: 12.5, fontWeight: 700, borderRight: `1px solid ${C.lineSoft}`, display: "flex", alignItems: "flex-start" }}>검토 요약</div>
              <div style={{ padding: "8px 14px" }}>
                <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="검토 요약을 입력하세요" rows={4} style={{ ...inp, width: "100%", maxWidth: 500, resize: "vertical" }} />
              </div>
            </div>
          </div>
          <DropZone files={files} setFiles={setFiles} label="검토 보고서 첨부" hint="검토보고서, 증빙대사표 등을 첨부하세요." />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 7 }}>
            <Btn kind="default" onClick={() => { setTab("list"); setSelCompany(null); }}>취소</Btn>
            <Btn kind="primary" disabled={!selCompany || busy} onClick={submitReport}><Check size={13} /> {busy ? "제출 중..." : "보고서 제출"}</Btn>
          </div>
        </Panel>
      </>}

      {toast && <Toast text={toast} />}
    </Shell>
  );
}
