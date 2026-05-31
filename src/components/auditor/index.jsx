import React, { useState, useEffect, useCallback } from "react";
import { Building2, ClipboardCheck, ClipboardList, FileText, Check, Download, X } from "lucide-react";
import { C, BIMOK, BIMOK_ORDER, SEMOK_TO_BIMOK, AMEND_STATUS } from "../../lib/theme.js";
import { sum, won, rate } from "../../lib/format.js";
import { runChecks } from "../../lib/checks.js";
import { downloadXlsx } from "../../lib/xlsx.js";
import { api } from "../../api/index.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Shell } from "../common/Shell.jsx";
import { th, td, numCell, inp, Tag, Btn, Panel, Breadcrumb, PageHead, Kpi, TableWrap, InfoBar, DropZone, Toast, MiniBar, Status } from "../common/ui.jsx";
import { AmendDiff, BankManager } from "../company/index.jsx";

const statusColor = { 검토완료: C.green, 보완필요: C.red, 검토중: C.amber, 미검토: C.gray };

export function AuditorApp() {
  const { user } = useAuth();
  const [tab, setTab] = useState("list");
  const [companies, setCompanies] = useState([]);
  const [reports, setReports] = useState([]);
  const [amendments, setAmendments] = useState([]);
  const [selCompany, setSelCompany] = useState(null);
  const [selReview, setSelReview] = useState(null);
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
      const [cos, reps, amds] = await Promise.all([api.getMyAuditCompanies(), api.listAuditReports(), api.listAmendments()]);
      setCompanies(cos);
      setReports(reps);
      setAmendments(amds);
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
    { k: "review", label: "사업비 검토", icon: Building2 },
    { k: "amend", label: "협약변경 확인", icon: ClipboardCheck },
    { k: "write", label: "보고서 작성", icon: FileText },
  ];
  const cur = menu.find((m) => m.k === tab);

  // 배정된 기업의 협약변경만 필터
  const myCompanyIds = companies.map((c) => c.id);
  const myAmendments = amendments.filter((a) => myCompanyIds.includes(a.companyId || a.company_id));

  return (
    <Shell role="auditor" menu={menu} active={tab} onNav={(k) => { setTab(k); if (k !== "review") setSelReview(null); }} orgLabel={`회계사 · ${user.name}`} sub={user.email}>
      <Breadcrumb items={["회계사", cur.label]} />

      {/* 배정 과제 목록 */}
      {tab === "list" && <>
        <PageHead title="배정된 과제" />
        <div style={{ background: C.blueLt, border: `1px solid ${C.blue}33`, borderRadius: 4, padding: "10px 16px", marginBottom: 14, fontSize: 13 }}>
          배정된 기업의 집행내역을 조회하고, 검토 보고서를 제출할 수 있습니다.
        </div>
        <Panel title="검토 대상 기업" sub={`${companies.length}개 배정`} pad={false}>
          {companies.length === 0 ? <div style={{ padding: "24px 16px", textAlign: "center", color: C.sub }}>배정된 기업이 없습니다.</div> :
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
                      <Btn kind="default" sm onClick={() => { setSelReview(c.id); setTab("review"); }}>상세 검토</Btn>
                      {st !== "검토완료" && <Btn kind="primary" sm onClick={() => { setSelCompany(c); setTab("write"); }}><FileText size={12} /> 보고서</Btn>}
                    </div>
                  </td>
                </tr>;
              })}
            </tbody>
          </TableWrap>}
        </Panel>
      </>}

      {/* 사업비 검토 — 관리자 ReviewDetail과 유사 */}
      {tab === "review" && (selReview ? <AuditorReviewDetail coId={selReview} companies={companies} onClose={() => setSelReview(null)} /> : <>
        <PageHead title="사업비 검토" />
        <Panel title="기업 선택" sub="검토할 기업을 선택하세요" pad={false}>
          <TableWrap>
            <thead><tr>{["과제번호", "기업명", "사업비(원)", "집행률", ""].map((h, i) => <th key={h} style={th(i === 2 ? "right" : "left")}>{h}</th>)}</tr></thead>
            <tbody>
              {companies.map((c) => {
                const b = sum(c.budget || {}), e = sum(c.exec || {}), r = rate(e, b);
                return <tr key={c.id}>
                  <td style={{ ...td(), ...numCell, color: C.sub }}>{c.id}</td>
                  <td style={{ ...td(), fontWeight: 700 }}>{c.name}</td>
                  <td style={{ ...td("right"), ...numCell }}>{b.toLocaleString()}</td>
                  <td style={{ ...td(), ...numCell }}>{r}%</td>
                  <td style={td()}><Btn kind="default" sm onClick={() => setSelReview(c.id)}>검토</Btn></td>
                </tr>;
              })}
            </tbody>
          </TableWrap>
        </Panel>
      </>)}

      {/* 협약변경 확인 */}
      {tab === "amend" && <>
        <PageHead title="협약변경 확인" />
        <Panel title="배정 기업 협약변경 내역" sub={`${myAmendments.length}건`} pad={false}>
          {myAmendments.length === 0 ? <div style={{ padding: "24px 16px", textAlign: "center", color: C.sub }}>협약변경 내역이 없습니다.</div> :
          <TableWrap>
            <thead><tr>{["신청번호", "기업명", "변경유형", "신청일", "상태", "사유"].map((h) => <th key={h} style={th()}>{h}</th>)}</tr></thead>
            <tbody>
              {myAmendments.map((a) => (
                <tr key={a.id}>
                  <td style={{ ...td(), ...numCell, color: C.sub }}>{a.id}</td>
                  <td style={{ ...td(), fontWeight: 700 }}>{a.company || a.company_name}</td>
                  <td style={{ ...td(), fontWeight: 600 }}>{a.type}</td>
                  <td style={{ ...td(), ...numCell }}>{a.submittedAt || a.submitted_at}</td>
                  <td style={td()}><Tag text={a.status} color={AMEND_STATUS[a.status] || C.gray} /></td>
                  <td style={{ ...td(), color: C.sub }}>{a.reason || "-"}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>}
        </Panel>
      </>}

      {/* 보고서 작성 */}
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
                <select value={opinion} onChange={(e) => setOpinion(e.target.value)} style={inp}><option>적정</option><option>부적정</option><option>한정</option></select>
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

// 회계사용 상세 검토 화면 (관리자 ReviewDetail과 유사하지만 읽기 전용)
function AuditorReviewDetail({ coId, companies, onClose }) {
  const [ledger, setLedger] = useState([]);
  const [tree, setTree] = useState([]);
  const [reviewTab, setReviewTab] = useState("summary");

  const co = companies.find((c) => c.id === coId);

  useEffect(() => {
    if (coId) {
      api.getLedger(coId).then(setLedger).catch(() => {});
      api.getBudgetTree(coId).then(setTree).catch(() => {});
    }
  }, [coId]);

  if (!co) return <div style={{ padding: 40, color: C.sub }}>기업 정보를 불러오는 중…</div>;

  const ledgerRows = ledger.map((r) => ({ ...r, desc: r.desc || r.description }));
  const tabs = [
    { k: "summary", l: "예산 현황" },
    { k: "ledger", l: `집행현황 (${ledgerRows.length})` },
    { k: "bank", l: "통장 관리" },
  ];

  return <>
    <PageHead title={<span>사업비 검토 — {co.name} <span style={{ fontSize: 14, color: C.sub, fontWeight: 500 }}>{co.id}</span></span>} actions={
      <div style={{ display: "flex", gap: 7 }}>
        <Btn kind="default" sm onClick={() => {
          const getEx = (r) => r.exec_amt || r.exec || 0;
          downloadXlsx(`예산현황_${co.name}.xlsx`, [["비목", "세목", "세세목", "예산(원)", "집행(원)", "잔액(원)", "집행률(%)"], ...tree.map((r) => [r.bimok, r.semok, r.sse, r.budget, getEx(r), (r.budget || 0) - getEx(r), rate(getEx(r), r.budget)])]);
        }}><Download size={13} /> 예산현황</Btn>
        <Btn kind="default" sm onClick={() => {
          downloadXlsx(`집행현황_${co.name}.xlsx`, [["비목", "전표일자", "집행내역", "지급처", "세목", "집행액(원)", "증빙"], ...ledgerRows.map((r) => [SEMOK_TO_BIMOK[r.bimok] || r.bimok, r.date, r.desc, r.payee, r.bimok, r.amount, r.evidence_status || "미첨부"])]);
        }}><Download size={13} /> 집행현황</Btn>
        <Btn kind="default" sm onClick={async () => {
          const filesAll = ledgerRows.flatMap((r) => (r.evidenceFiles || []).map((f) => f));
          if (filesAll.length === 0) return alert("다운로드할 첨부파일이 없습니다.");
          const JSZip = (await import("jszip")).default;
          const { saveAs } = await import("file-saver");
          const zip = new JSZip();
          for (const f of filesAll) { try { const res = await fetch(`/uploads/${f.filename}`); if (res.ok) zip.file(f.original_name || f.filename, await res.blob()); } catch {} }
          saveAs(await zip.generateAsync({ type: "blob" }), `증빙_${co.name}.zip`);
        }}><Download size={13} /> 첨부파일</Btn>
        <Btn kind="default" sm onClick={onClose}><X size={13} /> 목록</Btn>
      </div>
    } />
    <InfoBar rows={[["과제명", co.task], ["회사명", co.consortium], ["연구책임자", co.pm], ["협약기간", co.period]]} />

    <div style={{ display: "flex", borderBottom: `2px solid ${C.line}`, marginBottom: 14 }}>
      {tabs.map((t) => (
        <button key={t.k} onClick={() => setReviewTab(t.k)} style={{ padding: "10px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: reviewTab === t.k ? "#fff" : "transparent", color: reviewTab === t.k ? C.blue : C.sub, borderBottom: reviewTab === t.k ? `2.5px solid ${C.blue}` : "2.5px solid transparent", marginBottom: -2 }}>{t.l}</button>
      ))}
    </div>

    {/* 예산 현황 */}
    {reviewTab === "summary" && (() => {
      const getEx = (r) => r.exec_amt || r.exec || 0;
      const groupsMap = tree.reduce((a, r) => { (a[r.bimok] = a[r.bimok] || []).push(r); return a; }, {});
      const groups = Object.entries(groupsMap).sort(([a], [b]) => { const ia = BIMOK_ORDER.indexOf(a), ib = BIMOK_ORDER.indexOf(b); return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib); }).reduce((a, [k, v]) => { a[k] = v; return a; }, {});
      const totB = tree.reduce((a, r) => a + (r.budget || 0), 0);
      const totE = tree.reduce((a, r) => a + getEx(r), 0);
      return <Panel title="예산 현황" sub="비목 > 세목 > 세세목" pad={false}>
        {tree.length === 0 ? <div style={{ padding: "24px 16px", textAlign: "center", color: C.sub }}>등록된 예산이 없습니다.</div> :
        <TableWrap>
          <thead><tr>{["비목", "세목", "세세목", "예산(원)", "집행(원)", "잔액(원)", "집행률"].map((h, i) => <th key={h} style={th(i >= 3 ? "right" : "left")}>{h}</th>)}</tr></thead>
          <tbody>
            {Object.entries(groups).map(([bimok, items]) => {
              const gb = items.reduce((a, x) => a + (x.budget || 0), 0), ge = items.reduce((a, x) => a + getEx(x), 0), grr = rate(ge, gb);
              return <React.Fragment key={bimok}>
                <tr style={{ background: C.blueLt }}>
                  <td style={{ ...td(), fontWeight: 800, color: C.blueDk }}>{bimok}</td><td style={td()} colSpan={2} />
                  <td style={{ ...td("right"), ...numCell, fontWeight: 800 }}>{gb.toLocaleString()}</td>
                  <td style={{ ...td("right"), ...numCell, fontWeight: 800 }}>{ge.toLocaleString()}</td>
                  <td style={{ ...td("right"), ...numCell, fontWeight: 800 }}>{(gb - ge).toLocaleString()}</td>
                  <td style={{ ...td("right"), ...numCell, fontWeight: 800 }}>{grr}%</td>
                </tr>
                {items.map((row, ri) => {
                  const ex = getEx(row), rem = (row.budget || 0) - ex, rr = rate(ex, row.budget), over = rr > 100;
                  return <tr key={ri}>
                    <td style={td()} /><td style={{ ...td(), fontWeight: 600 }}>{row.semok}</td><td style={td()}>{row.sse}</td>
                    <td style={{ ...td("right"), ...numCell }}>{(row.budget || 0).toLocaleString()}</td>
                    <td style={{ ...td("right"), ...numCell, fontWeight: 700, color: over ? C.red : C.text }}>{ex.toLocaleString()}</td>
                    <td style={{ ...td("right"), ...numCell, color: rem < 0 ? C.red : C.sub }}>{rem.toLocaleString()}</td>
                    <td style={{ ...td("right"), ...numCell }}><MiniBar v={rr} color={over ? C.red : rr > 85 ? C.amber : C.green} /> <b style={{ color: over ? C.red : C.text }}>{rr}%</b></td>
                  </tr>;
                })}
              </React.Fragment>;
            })}
            <tr style={{ background: C.navy }}>
              <td style={{ ...td(), fontWeight: 800, color: "#fff", textAlign: "center" }} colSpan={3}>합 계</td>
              <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: "#fff" }}>{totB.toLocaleString()}</td>
              <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: "#fff" }}>{totE.toLocaleString()}</td>
              <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: "#fff" }}>{(totB - totE).toLocaleString()}</td>
              <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: "#fff" }}>{rate(totE, totB)}%</td>
            </tr>
          </tbody>
        </TableWrap>}
      </Panel>;
    })()}

    {/* 집행현황 */}
    {reviewTab === "ledger" && (() => {
      const byBimokMap = {};
      for (const r of ledgerRows) { const parent = SEMOK_TO_BIMOK[r.bimok] || r.bimok || "기타"; (byBimokMap[parent] = byBimokMap[parent] || []).push(r); }
      Object.values(byBimokMap).forEach((items) => items.sort((a, b) => (a.date || "").localeCompare(b.date || "")));
      const byBimok = Object.entries(byBimokMap).sort(([a], [b]) => { const ia = BIMOK_ORDER.indexOf(a), ib = BIMOK_ORDER.indexOf(b); return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib); });
      return <Panel title="집행 원장" sub={`총 ${ledgerRows.length}건 · 비목별 그룹`} pad={false}>
        {ledgerRows.length === 0 ? <div style={{ padding: "24px 16px", textAlign: "center", color: C.sub }}>등록된 집행내역이 없습니다.</div> :
        <TableWrap>
          <thead><tr>{["전표일자", "집행내역", "지급처", "세목", "집행액(원)", "증빙"].map((h, i) => <th key={h} style={th(i === 4 ? "right" : "left")}>{h}</th>)}</tr></thead>
          <tbody>{byBimok.map(([bimok, items]) => {
            const bsum = items.reduce((a, r) => a + (r.amount || 0), 0);
            return <React.Fragment key={bimok}>
              <tr style={{ background: C.blueLt }}>
                <td style={{ ...td(), fontWeight: 800, color: C.blueDk }} colSpan={4}>{bimok}</td>
                <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: C.blueDk }}>{bsum.toLocaleString()}</td>
                <td style={td()} />
              </tr>
              {items.map((r) => (
                <tr key={r.id}>
                  <td style={{ ...td(), ...numCell, whiteSpace: "nowrap" }}>{r.date}</td>
                  <td style={{ ...td(), fontWeight: 600 }}>{r.desc}</td>
                  <td style={td()}>{r.payee}</td>
                  <td style={{ ...td(), color: C.sub }}>{r.bimok}</td>
                  <td style={{ ...td("right"), ...numCell, fontWeight: 700 }}>{(r.amount || 0).toLocaleString()}</td>
                  <td style={td()}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <Tag text={r.evidence_status || "미첨부"} color={r.evidence_status === "검토완료" ? C.blue : r.evidence_status === "첨부" ? C.green : C.red} />
                      {(r.evidenceFiles || []).map((ef, ei) => (
                        <a key={ei} href={`/uploads/${ef.filename}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: C.blue, textDecoration: "underline" }}>{ef.original_name || ef.originalName || "파일"}</a>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </React.Fragment>;
          })}</tbody>
        </TableWrap>}
      </Panel>;
    })()}

    {/* 통장 관리 */}
    {reviewTab === "bank" && <BankManager companyId={coId} />}
  </>;
}
