import React, { useState, useEffect, useRef } from "react";
import { Building2, Check, ClipboardCheck, ClipboardList, Coins, Download, FilePlus, LayoutGrid, ScanSearch, Upload, X } from "lucide-react";
import { C, BIMOK, BIMOK_ORDER, SEMOK_TO_BIMOK, AMEND_STATUS } from "../../lib/theme.js";
import { downloadXlsx, parseXlsx } from "../../lib/xlsx.js";
import { sum, won, eok, rate } from "../../lib/format.js";
import { runChecks } from "../../lib/checks.js";
import { useApp } from "../../context/AppContext.jsx";
import { Shell } from "../common/Shell.jsx";
import { th, td, numCell, inp, Tag, Status, Btn, Panel, Breadcrumb, PageHead, SearchBox, Field, Kpi, Toast, MiniBar, TableWrap, InfoBar } from "../common/ui.jsx";
import { AmendDiff, BankManager } from "../company/index.jsx";

const SEV = { high: C.red, mid: C.amber, low: C.gray };
const SEV_T = { high: "위험", mid: "주의", low: "확인" };

export function AdminApp() {
  const { amendments } = useApp();
  const [tab, setTab] = useState("dash");
  const [sel, setSel] = useState(null);
  const pendingAmend = amendments.filter((a) => a.status === "검토중").length;
  const menu = [
    { k: "dash", label: "모니터링 대시보드", icon: LayoutGrid },
    { k: "issue", label: "과제 발급(협약체결)", icon: FilePlus },
    { k: "tasks", label: "지원기업·과제", icon: Building2 },
    { k: "amend", label: "협약변경 검토", icon: ClipboardCheck, badge: pendingAmend },
    { k: "check", label: "집행점검", icon: ScanSearch },
    { k: "review", label: "사용실적 검토", icon: ClipboardList },
    { k: "recover", label: "정산확정·환수", icon: Coins },
  ];
  const pick = (c) => { setSel(c.id); setTab("review"); };
  const cur = menu.find((m) => m.k === tab);
  return (
    <Shell role="admin" menu={menu} active={tab} onNav={(k) => { setTab(k); if (k !== "review") setSel(null); }} orgLabel="정산 모니터링" sub="정산담당 · 관리자">
      <Breadcrumb items={["관리자", cur.label]} />
      {tab === "dash" && <AdminDash onPick={pick} />}
      {tab === "tasks" && <TaskList onPick={pick} />}
      {tab === "issue" && <IssueBoard />}
      {tab === "amend" && <AmendReview />}
      {tab === "check" && <CheckBoard onPick={pick} />}
      {tab === "review" && (sel ? <ReviewDetail coId={sel} onClose={() => { setTab("tasks"); setSel(null); }} /> : <TaskList onPick={pick} />)}
      {tab === "recover" && <RecoverBoard />}
    </Shell>
  );
}

function getNextGBId(companies) {
  const year = new Date().getFullYear();
  const nums = companies.map((c) => { const m = c.id.match(/GB-\d{4}-(\d+)/); return m ? parseInt(m[1]) : 0; }).filter((n) => n > 0);
  return `GB-${year}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
}

export function IssueBoard() {
  const { companies, issueProject, updateBudgetTree } = useApp();
  const fileRef = useRef(null);
  const [mode, setMode] = useState("single");
  const [bulk, setBulk] = useState([]);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", announce: "", task: "", pm: "", consortium: "", role: "주관", email: "", start: "2026-06-01", end: "2027-05-31", totalBudget: "" });
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 3500); return () => clearTimeout(t); } }, [toast]);

  const issued = companies.filter((c) => c.status === "초기등록");

  const tmplRows = [
    ["기업명", "사업명", "과제명", "연구책임자", "회사명", "구분", "협약시작일", "협약종료일", "담당자이메일", "총사업비(원)"],
    ["(주)뉴로메카", "2026년 지역특화 AI 실증사업", "포항 로봇·AI 실증 고도화", "김선모", "POSTECH", "주관", "2026-06-01", "2027-05-31", "test@biz.co.kr", 390000000],
    ["(주)에이아이파크", "2026년 지역특화 AI 실증사업", "초거대 AI 클라우드 팜", "이정안", "금오공대", "참여", "2026-06-01", "2027-05-31", "ai@biz.co.kr", 303000000],
  ];

  const onUpload = (raw) => {
    const parsed = raw.slice(1).filter((r) => r[0] && r[2]).map((r) => ({
      name: String(r[0] || ""), announce: String(r[1] || ""), task: String(r[2] || ""), pm: String(r[3] || ""),
      consortium: String(r[4] || ""), role: String(r[5] || "주관"), start: String(r[6] || "2026-06-01"), end: String(r[7] || "2027-05-31"),
      email: String(r[8] || ""), totalBudget: Number(String(r[9] || "0").replace(/[^0-9]/g, "")) || 0,
    }));
    if (parsed.length) setBulk(parsed);
  };

  const doIssue = async (item) => {
    const id = getNextGBId(companies);
    const budget = Object.fromEntries(BIMOK.map((b) => [b.key, 0]));
    budget[BIMOK[0].key] = item.totalBudget;
    await issueProject({
      id, name: item.name, announce: item.announce, task: item.task, pm: item.pm,
      period: `${item.start} ~ ${item.end}`, status: "초기등록",
      consortium: item.consortium, consortiumRole: item.role || "주관", budget, exec: Object.fromEntries(BIMOK.map((b) => [b.key, 0])),
      researchers: [], email: item.email, inviteEmail: item.email,
    });
    const treeRows = [{ bimok: "총사업비", semok: "총사업비", sse: "총사업비", gwamok: "총사업비", budget: item.totalBudget, exec_amt: 0 }];
    await updateBudgetTree(id, treeRows);
    return id;
  };

  const issueAll = async () => {
    setBusy(true);
    let count = 0;
    for (const item of bulk) { await doIssue(item); count++; }
    setToast(`${count}개 과제가 일괄 발급되었습니다.`);
    setBulk([]); setBusy(false);
  };

  const issueSingle = async () => {
    setBusy(true);
    const id = await doIssue({ ...f, totalBudget: Number(String(f.totalBudget).replace(/[^0-9]/g, "")) || 0 });
    setToast(`${id} 과제가 발급되었습니다.`);
    setF({ name: "", announce: "", task: "", pm: "", consortium: "", email: "", start: "2026-06-01", end: "2027-05-31", totalBudget: "" });
    setBusy(false);
  };

  const removeItem = (i) => setBulk(bulk.filter((_, idx) => idx !== i));
  const bulkTotal = bulk.reduce((a, b) => a + b.totalBudget, 0);
  const singleOk = f.name && f.task && f.pm && f.totalBudget && !busy;

  const lbl = { background: "#F8F9FB", padding: "10px 14px", fontSize: 12.5, fontWeight: 700, color: C.text, borderRight: `1px solid ${C.lineSoft}`, display: "flex", alignItems: "center" };
  const row = { display: "grid", gridTemplateColumns: "120px 1fr", borderBottom: `1px solid ${C.lineSoft}` };
  const cell = { padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 };
  const wide = { ...inp, width: "100%", maxWidth: 400 };

  return <>
    <PageHead title="과제 발급 (협약체결)" />

    {/* 등록 방식 탭 */}
    <div style={{ display: "flex", borderBottom: `2px solid ${C.line}`, marginBottom: 14 }}>
      <button onClick={() => setMode("single")} style={{ padding: "10px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: mode === "single" ? "#fff" : "transparent", color: mode === "single" ? C.blue : C.sub, borderBottom: mode === "single" ? `2.5px solid ${C.blue}` : "2.5px solid transparent", marginBottom: -2 }}>개별등록</button>
      <button onClick={() => setMode("bulk")} style={{ padding: "10px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: mode === "bulk" ? "#fff" : "transparent", color: mode === "bulk" ? C.blue : C.sub, borderBottom: mode === "bulk" ? `2.5px solid ${C.blue}` : "2.5px solid transparent", marginBottom: -2 }}>엑셀 일괄등록</button>
    </div>

    {/* 엑셀 일괄등록 */}
    {mode === "bulk" && <Panel title="엑셀 일괄등록" sub="양식 다운로드 → 작성 → 업로드" pad={false}
      extra={
        <div style={{ display: "flex", gap: 7 }}>
          <Btn kind="default" sm onClick={() => downloadXlsx("과제발급_양식.xlsx", tmplRows)}><Download size={13} /> 양식 다운로드</Btn>
          <Btn kind="primary" sm onClick={() => fileRef.current && fileRef.current.click()}><Upload size={13} /> 엑셀 업로드</Btn>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={(e) => { const fl = e.target.files && e.target.files[0]; if (fl) parseXlsx(fl, onUpload); e.target.value = ""; }} />
        </div>
      }>
      {bulk.length > 0 ? <>
        <div style={{ padding: "10px 16px", background: "#F8F9FB", borderBottom: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13 }}>업로드 미리보기 · <b>{bulk.length}개 기업</b> · 총 사업비 <b style={{ color: C.blueDk }}>{bulkTotal.toLocaleString()}원</b> ({(bulkTotal / 100000000).toFixed(2)}억원)</div>
          <div style={{ display: "flex", gap: 7 }}>
            <Btn kind="default" sm onClick={() => setBulk([])}>취소</Btn>
            <Btn kind="primary" sm disabled={busy} onClick={issueAll}><Check size={13} /> {busy ? "발급 중..." : `${bulk.length}개 일괄 발급`}</Btn>
          </div>
        </div>
        <TableWrap>
          <thead><tr>{["No", "기업명", "사업명", "과제명", "책임자", "회사명", "구분", "협약기간", "사업비(원)", ""].map((h, i) => <th key={h} style={th(i === 8 ? "right" : "left")}>{h}</th>)}</tr></thead>
          <tbody>
            {bulk.map((item, i) => (
              <tr key={i}>
                <td style={{ ...td(), color: C.sub }}>{i + 1}</td>
                <td style={{ ...td(), fontWeight: 700 }}>{item.name}</td>
                <td style={{ ...td(), color: C.sub }}>{item.announce}</td>
                <td style={td()}>{item.task}</td>
                <td style={td()}>{item.pm}</td>
                <td style={td()}>{item.consortium}</td>
                <td style={td()}><Tag text={item.role || "주관"} color={item.role === "참여" ? C.teal : C.blue} /></td>
                <td style={{ ...td(), ...numCell }}>{item.start} ~ {item.end}</td>
                <td style={{ ...td("right"), ...numCell, fontWeight: 700 }}>{item.totalBudget.toLocaleString()}</td>
                <td style={td()}><button onClick={() => removeItem(i)} style={{ border: "none", background: "none", cursor: "pointer", color: C.red }}><X size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </> : <div style={{ padding: "32px 16px", textAlign: "center", color: C.sub }}>
        <FilePlus size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
        <div style={{ fontSize: 13, fontWeight: 600 }}>엑셀 양식을 다운로드하여 기업 정보를 작성한 후 업로드하세요</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>기업명, 사업명, 과제명, 연구책임자, 회사명, 협약기간, 사업비를 한 번에 등록할 수 있습니다</div>
      </div>}
    </Panel>}

    {/* 개별등록 */}
    {mode === "single" && <>
      <Panel title="과제 개별등록" pad={false}>
        <div>
          <div style={row}><div style={lbl}>지원기업명</div><div style={cell}><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="예: (주)○○테크" style={wide} /></div></div>
          <div style={row}><div style={lbl}>사업명</div><div style={cell}><input value={f.announce} onChange={(e) => setF({ ...f, announce: e.target.value })} placeholder="예: 2026년 지역특화 AI 실증사업" style={wide} /></div></div>
          <div style={row}><div style={lbl}>과제명</div><div style={cell}><input value={f.task} onChange={(e) => setF({ ...f, task: e.target.value })} placeholder="과제명을 입력하세요" style={wide} /></div></div>
          <div style={row}><div style={lbl}>연구책임자</div><div style={cell}><input value={f.pm} onChange={(e) => setF({ ...f, pm: e.target.value })} placeholder="성명" style={{ ...inp, width: 160 }} /></div></div>
          <div style={row}><div style={lbl}>회사명</div><div style={cell}>
            <input value={f.consortium} onChange={(e) => setF({ ...f, consortium: e.target.value })} placeholder="예: (주)○○테크" style={{ ...inp, width: 200 }} />
            <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
              {["주관", "참여"].map((r) => {
                const on = f.role === r;
                return <button key={r} type="button" onClick={() => setF({ ...f, role: r })}
                  style={{ padding: "4px 12px", borderRadius: 4, border: `1.5px solid ${on ? C.blue : C.line}`, background: on ? C.blueLt : "#fff", color: on ? C.blue : C.sub, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  {r}
                </button>;
              })}
            </div>
          </div></div>
          <div style={row}><div style={lbl}>담당자 이메일</div><div style={cell}><input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="가입 시 자동 매칭됩니다" style={wide} /></div></div>
          <div style={row}><div style={lbl}>협약기간</div><div style={cell}><input type="date" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} style={inp} /> ~ <input type="date" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} style={inp} /></div></div>
          <div style={{ ...row, borderBottom: "none" }}><div style={lbl}>총사업비(원)</div><div style={cell}><input value={f.totalBudget ? Number(String(f.totalBudget).replace(/[^0-9]/g, "")).toLocaleString() : ""} onChange={(e) => setF({ ...f, totalBudget: e.target.value.replace(/[^0-9]/g, "") })} placeholder="0" style={{ ...inp, width: 200, textAlign: "right", ...numCell }} /></div></div>
        </div>
      </Panel>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn kind="primary" disabled={!singleOk} onClick={issueSingle}><FilePlus size={14} /> {busy ? "발급 중..." : "과제 발급"}</Btn>
      </div>
    </>}

    <Panel title="발급 완료 과제" sub="초기등록 대기 · 기업 등록 예정" pad={false}>
      <TableWrap>
        <thead><tr>{["과제번호", "기업명", "사업명 / 과제명", "회사명", "구분", "사업비(원)", "협약기간", "상태"].map((h, i) => <th key={h} style={th(i === 5 ? "right" : "left")}>{h}</th>)}</tr></thead>
        <tbody>
          {issued.length === 0 && <tr><td style={{ ...td(), textAlign: "center", color: C.sub }} colSpan={8}>초기등록 대기 중인 과제가 없습니다.</td></tr>}
          {issued.map((c) => {
            const bt = Object.values(c.budget).reduce((a, v) => a + v, 0);
            return <tr key={c.id}>
            <td style={{ ...td(), ...numCell, color: C.sub }}>{c.id}</td>
            <td style={{ ...td(), fontWeight: 700 }}>{c.name}</td>
            <td style={td()}><div style={{ fontWeight: 600 }}>{c.announce || ""}</div><div style={{ fontSize: 11.5, color: C.sub }}>{c.task}</div></td>
            <td style={td()}>{c.consortium}</td>
            <td style={td()}><Tag text={c.consortiumRole || "주관"} color={(c.consortiumRole || "주관") === "참여" ? C.teal : C.blue} /></td>
            <td style={{ ...td("right"), ...numCell, fontWeight: 700 }}>{bt.toLocaleString()}</td>
            <td style={{ ...td(), ...numCell }}>{c.period}</td>
            <td style={td()}><Status s={c.status} /></td>
          </tr>; })}
        </tbody>
      </TableWrap>
    </Panel>
    {toast && <Toast text={toast} />}
  </>;
}

export function AmendReview() {
  const { amendments, companies, decideAmendment } = useApp();
  const [filter, setFilter] = useState("검토중");
  const [open, setOpen] = useState(null);
  const [comment, setComment] = useState("");
  const list = amendments.filter((a) => filter === "전체" || a.status === filter);
  const decide = (a, decision) => { decideAmendment(a.id, decision, decision === "반려" ? (comment || "반려 사유 미입력") : (comment || "검토 완료")); setOpen(null); setComment(""); };

  return <>
    <PageHead title="협약변경 검토" actions={<Btn kind="default" sm><Download size={13} /> 목록 다운로드</Btn>} />
    <SearchBox>
      <Field label="처리상태"><select value={filter} onChange={(e) => setFilter(e.target.value)} style={inp}>{["검토중", "승인", "반려", "전체"].map((f) => <option key={f}>{f}</option>)}</select></Field>
    </SearchBox>
    <Panel title="협약변경 신청 목록" sub={`총 ${list.length}건`} pad={false}>
      <TableWrap>
        <thead><tr>{["신청번호", "기업명", "변경유형", "신청일", "상태", "검토"].map((h) => <th key={h} style={th()}>{h}</th>)}</tr></thead>
        <tbody>
          {list.length === 0 && <tr><td style={{ ...td(), textAlign: "center", color: C.sub }} colSpan={6}>해당 상태의 신청이 없습니다.</td></tr>}
          {list.map((a) => <React.Fragment key={a.id}>
            <tr>
              <td style={{ ...td(), ...numCell, color: C.sub }}>{a.id}</td>
              <td style={{ ...td(), fontWeight: 700 }}>{a.company}</td>
              <td style={{ ...td(), fontWeight: 600 }}>{a.type}</td>
              <td style={{ ...td(), ...numCell }}>{a.submittedAt}</td>
              <td style={td()}><Tag text={a.status} color={AMEND_STATUS[a.status]} /></td>
              <td style={td()}><Btn kind="default" sm onClick={() => { setOpen(open === a.id ? null : a.id); setComment(""); }}>{open === a.id ? "닫기" : "검토"}</Btn></td>
            </tr>
            {open === a.id && <tr><td colSpan={6} style={{ padding: 16, background: "#FAFBFC", borderBottom: `1px solid ${C.lineSoft}` }}>
              <div style={{ fontSize: 12.5, marginBottom: 10 }}><b>변경사유</b> · {a.reason}</div>
              <AmendDiff a={a} />
              {a.type === "사업비 변경" && a.status === "검토중" && <ImpactNote a={a} co={companies.find((c) => c.id === a.companyId)} />}
              {a.status === "검토중" ? <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="검토의견 (반려 시 사유 필수)" style={{ ...inp, flex: 1, minWidth: 220 }} />
                <Btn kind="ok" onClick={() => decide(a, "승인")}><Check size={14} /> 승인</Btn>
                <Btn kind="danger" onClick={() => decide(a, "반려")}><X size={14} /> 반려</Btn>
              </div> : <div style={{ marginTop: 10, fontSize: 12.5, color: AMEND_STATUS[a.status], fontWeight: 700 }}>{a.status === "승인" ? "✓ 승인 완료 — 기업 과제에 반영됨" : `✕ 반려 — ${a.reviewComment}`}</div>}
            </td></tr>}
          </React.Fragment>)}
        </tbody>
      </TableWrap>
    </Panel>
  </>;
}

// 승인 시 영향 안내 (초과 해소 여부 등)
export function ImpactNote({ a, co }) {
  if (!co) return null;
  const beforeOver = BIMOK.filter((b) => (co.exec[b.key] || 0) > (a.before[b.key] || 0)).map((b) => b.key);
  const afterOver = BIMOK.filter((b) => (co.exec[b.key] || 0) > (a.after[b.key] || 0)).map((b) => b.key);
  const resolved = beforeOver.filter((k) => !afterOver.includes(k));
  const newOver = afterOver.filter((k) => !beforeOver.includes(k));
  return <div style={{ marginTop: 10, padding: "10px 12px", background: C.blueLt, border: `1px solid ${C.blue}33`, borderRadius: 3, fontSize: 12.5, color: C.text }}>
    <b style={{ color: C.blueDk }}>승인 시 영향</b>
    {resolved.length > 0 && <span style={{ color: C.green, marginLeft: 8 }}>초과집행 해소: {resolved.join(", ")}</span>}
    {newOver.length > 0 && <span style={{ color: C.red, marginLeft: 8 }}>신규 초과 발생: {newOver.join(", ")}</span>}
    {resolved.length === 0 && newOver.length === 0 && <span style={{ color: C.sub, marginLeft: 8 }}>집행 초과 변동 없음 · 비목 재배분</span>}
  </div>;
}

export function AdminDash({ onPick }) {
  const { companies } = useApp();
  const tB = companies.reduce((a, c) => a + sum(c.budget), 0), tE = companies.reduce((a, c) => a + sum(c.exec), 0);
  const all = companies.flatMap((c) => runChecks(c).map((f) => ({ ...f, c })));
  const high = all.filter((c) => c.sev === "high");
  return <>
    <PageHead title="모니터링 대시보드" actions={<Btn kind="default" sm><Download size={13} /> 현황 다운로드</Btn>} />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
      <Kpi label="지원기업 / 과제" value={companies.length} unit="개사" accent={C.blue} />
      <Kpi label="총 사업비" value={eok(tB)} unit="억원" accent={C.gray} />
      <Kpi label="집행률" value={rate(tE, tB)} unit="%" sub={`${eok(tE)}억원 집행`} accent={C.green} />
      <Kpi label="점검 적발(위험)" value={high.length} unit="건" sub={`전체 ${all.length}건`} accent={C.red} />
    </div>
    <Panel title="비목별 예산 대비 집행" sub="(단위: 원)" pad={false}>
      <TableWrap>
        <thead><tr>{["비목", "예산(원)", "집행(원)", "집행률", "예산 대비 집행"].map((h, i) => <th key={h} style={th(i >= 1 && i <= 3 ? "right" : "left")}>{h}</th>)}</tr></thead>
        <tbody>{BIMOK.map((bm) => {
          const b = companies.reduce((a, c) => a + (c.budget[bm.key] || 0), 0), e = companies.reduce((a, c) => a + (c.exec[bm.key] || 0), 0), r = rate(e, b);
          return <tr key={bm.key}><td style={{ ...td(), fontWeight: 600 }}>{bm.key}</td>
            <td style={{ ...td("right"), ...numCell }}>{b.toLocaleString()}</td>
            <td style={{ ...td("right"), ...numCell, fontWeight: 700 }}>{e.toLocaleString()}</td>
            <td style={{ ...td("right"), ...numCell, fontWeight: 700, color: r > 100 ? C.red : C.text }}>{r}%</td>
            <td style={td()}><div style={{ width: "100%", height: 8, background: C.lineSoft, borderRadius: 2 }}><div style={{ width: `${Math.min(r, 100)}%`, height: "100%", background: r > 100 ? C.red : C.blue, borderRadius: 2 }} /></div></td></tr>;
        })}</tbody>
      </TableWrap>
    </Panel>
    <Panel title="자동 집행점검 적발" sub="집행내역·규정 기반 점검" pad={false}>
      <TableWrap>
        <thead><tr>{["심각도", "기업", "점검 규칙", "내역", "처리"].map((h) => <th key={h} style={th()}>{h}</th>)}</tr></thead>
        <tbody>{all.map((a, i) => <tr key={i}><td style={td()}><Tag text={SEV_T[a.sev]} color={SEV[a.sev]} /></td><td style={{ ...td(), fontWeight: 700 }}>{a.c.name}</td><td style={td()}>{a.rule}</td><td style={{ ...td(), color: C.sub }}>{a.detail}{a.txn ? ` · ${a.txn}` : ""}</td><td style={td()}><Btn kind="default" sm onClick={() => onPick(a.c)}>검토</Btn></td></tr>)}</tbody>
      </TableWrap>
    </Panel>
  </>;
}

export function TaskList({ onPick }) {
  const { companies } = useApp();
  const [q, setQ] = useState(""), [filter, setFilter] = useState("전체");
  const list = companies.filter((c) => (filter === "전체" || c.status === filter) && (c.name.includes(q) || c.task.includes(q) || c.id.includes(q)));
  return <>
    <PageHead title="지원기업·과제" actions={<Btn kind="default" sm><Download size={13} /> 엑셀 다운로드</Btn>} />
    <SearchBox>
      <Field label="검색어"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="기업·과제·과제번호" style={{ ...inp, width: 200 }} /></Field>
      <Field label="정산단계"><select value={filter} onChange={(e) => setFilter(e.target.value)} style={inp}>{["전체", "초기등록", "집행중", "집행마감", "검토중", "보완요청", "정산확정", "환수발생"].map((f) => <option key={f}>{f}</option>)}</select></Field>
    </SearchBox>
    <Panel title="과제 목록" sub={`총 ${list.length}건`} pad={false}>
      <TableWrap>
        <thead><tr>{["과제번호", "기업명 / 과제", "주관", "사업비(억)", "집행률", "점검", "정산단계", "관리"].map((h, i) => <th key={h} style={th(i === 3 || i === 4 ? "right" : "left")}>{h}</th>)}</tr></thead>
        <tbody>{list.map((c) => {
          const b = sum(c.budget), e = sum(c.exec), r = rate(e, b), rc = r > 100 ? C.red : r > 85 ? C.amber : C.green;
          const ck = runChecks(c), hi = ck.filter((x) => x.sev === "high").length;
          return <tr key={c.id}>
            <td style={{ ...td(), ...numCell, color: C.sub }}>{c.id}</td>
            <td style={td()}><div style={{ fontWeight: 700 }}>{c.name}</div><div style={{ fontSize: 11.5, color: C.sub }}>{c.task}</div></td>
            <td style={td()}>{c.consortium}</td>
            <td style={{ ...td("right"), ...numCell, fontWeight: 700 }}>{eok(b)}</td>
            <td style={{ ...td("right"), ...numCell }}><MiniBar v={r} color={rc} /> <b style={{ color: rc }}>{r}%</b></td>
            <td style={td()}>{hi ? <Tag text={`위험 ${hi}`} color={C.red} /> : ck.length ? <Tag text={`주의 ${ck.length}`} color={C.amber} /> : <Tag text="양호" color={C.green} />}</td>
            <td style={td()}><Status s={c.status} /></td>
            <td style={td()}><Btn kind="default" sm onClick={() => onPick(c)}>검토</Btn></td>
          </tr>;
        })}</tbody>
      </TableWrap>
    </Panel>
  </>;
}

export function CheckBoard({ onPick }) {
  const { companies } = useApp();
  const all = companies.flatMap((c) => runChecks(c).map((f) => ({ ...f, c })));
  const byRule = all.reduce((a, x) => { (a[x.rule] = a[x.rule] || []).push(x); return a; }, {});
  return <>
    <PageHead title="집행점검" actions={<Btn kind="default" sm><Download size={13} /> 점검결과 다운로드</Btn>} />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 14 }}>{Object.entries(byRule).map(([rule, items]) => <Kpi key={rule} label={rule} value={items.length} unit="건" sub={SEV_T[items[0].sev]} accent={SEV[items[0].sev]} />)}</div>
    <Panel title="적발 상세" sub="집행내역 + 규정 자동 점검" pad={false}>
      <TableWrap>
        <thead><tr>{["심각도", "기업", "점검 규칙", "적발 내역", "거래번호", "처리"].map((h) => <th key={h} style={th()}>{h}</th>)}</tr></thead>
        <tbody>{all.sort((a, b) => (a.sev === "high" ? -1 : 1)).map((a, i) => <tr key={i}><td style={td()}><Tag text={SEV_T[a.sev]} color={SEV[a.sev]} /></td><td style={{ ...td(), fontWeight: 700 }}>{a.c.name}</td><td style={td()}>{a.rule}</td><td style={{ ...td(), color: C.sub }}>{a.detail}</td><td style={{ ...td(), ...numCell, color: C.sub }}>{a.txn || "-"}</td><td style={td()}><Btn kind="default" sm onClick={() => onPick(a.c)}>검토</Btn></td></tr>)}</tbody>
      </TableWrap>
    </Panel>
  </>;
}

export function ReviewDetail({ coId, onClose }) {
  const { companies, ledgers, loadLedger, budgetTrees, loadBudgetTree } = useApp();
  const co = companies.find((c) => c.id === coId);
  const checks = runChecks(co);
  const [tab, setTab] = useState("summary");
  const [evFilter, setEvFilter] = useState("전체");

  useEffect(() => { if (coId) { loadLedger(coId); loadBudgetTree(coId); } }, [coId]);

  const ledger = (ledgers[coId] || []).map((r) => ({ ...r, desc: r.desc || r.description }));
  const tree = budgetTrees[coId] || [];
  const attached = ledger.filter((r) => r.evidence_status === "첨부" || r.evidence_status === "검토완료").length;
  const notAttached = ledger.filter((r) => r.evidence_status === "미첨부").length;
  const reviewed = ledger.filter((r) => r.evidence_status === "검토완료").length;

  const reviewTabs = [
    { k: "summary", l: "비목별 요약" },
    { k: "ledger", l: `집행현황 (${ledger.length})` },
    { k: "evidence", l: `증빙 검토 (미첨부 ${notAttached})` },
    { k: "bank", l: "통장 관리" },
  ];

  const filteredLedger = evFilter === "전체" ? ledger : ledger.filter((r) => r.evidence_status === evFilter);

  const markReviewed = async (txnId) => {
    await (await import("../../api/index.js")).api.reviewEvidence(txnId);
    loadLedger(coId);
  };

  return <>
    <PageHead title={<span>사용실적 검토 — {co.name} <span style={{ fontSize: 14, color: C.sub, fontWeight: 500 }}>{co.id}</span></span>} actions={<Btn kind="default" sm onClick={onClose}><X size={13} /> 목록</Btn>} />
    <InfoBar rows={[["과제명", co.task], ["주관", co.consortium], ["연구책임자", co.pm], ["협약기간", co.period]]} />

    {checks.length > 0 && <Panel title="자동 집행점검 결과" sub={`${checks.length}건`} pad={false}>
      <TableWrap><thead><tr>{["심각도", "점검 규칙", "적발 내역"].map((h) => <th key={h} style={th()}>{h}</th>)}</tr></thead>
        <tbody>{checks.map((f, i) => <tr key={i}><td style={td()}><Tag text={SEV_T[f.sev]} color={SEV[f.sev]} /></td><td style={{ ...td(), fontWeight: 600 }}>{f.rule}</td><td style={{ ...td(), color: C.sub }}>{f.detail}</td></tr>)}</tbody>
      </TableWrap></Panel>}

    {/* 탭 */}
    <div style={{ display: "flex", borderBottom: `2px solid ${C.line}`, marginBottom: 14 }}>
      {reviewTabs.map((t) => (
        <button key={t.k} onClick={() => setTab(t.k)} style={{ padding: "10px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: tab === t.k ? "#fff" : "transparent", color: tab === t.k ? C.blue : C.sub, borderBottom: tab === t.k ? `2.5px solid ${C.blue}` : "2.5px solid transparent", marginBottom: -2 }}>{t.l}</button>
      ))}
    </div>

    {/* 비목별 요약 — budgetTree 기반 */}
    {tab === "summary" && (() => {
      const getEx = (r) => r.exec_amt || r.exec || 0;
      const groupsMap = tree.reduce((a, r) => { (a[r.bimok] = a[r.bimok] || []).push(r); return a; }, {});
      const groups = Object.entries(groupsMap).sort(([a], [b]) => { const ia = BIMOK_ORDER.indexOf(a), ib = BIMOK_ORDER.indexOf(b); return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib); }).reduce((a, [k, v]) => { a[k] = v; return a; }, {});
      const totB = tree.reduce((a, r) => a + (r.budget || 0), 0);
      const totE = tree.reduce((a, r) => a + getEx(r), 0);
      return <>
        <Panel title="예산 현황" sub="비목 > 세목 > 세세목" pad={false}>
          {tree.length === 0 ? <div style={{ padding: "24px 16px", textAlign: "center", color: C.sub }}>등록된 예산 트리가 없습니다.</div> :
          <TableWrap>
            <thead><tr>{["비목", "세목", "세세목", "예산(원)", "집행(원)", "잔액(원)", "집행률"].map((h, i) => <th key={h} style={th(i >= 3 ? "right" : "left")}>{h}</th>)}</tr></thead>
            <tbody>
              {Object.entries(groups).map(([bimok, items]) => {
                const gb = items.reduce((a, x) => a + (x.budget || 0), 0), ge = items.reduce((a, x) => a + getEx(x), 0), grr = rate(ge, gb);
                return <React.Fragment key={bimok}>
                  <tr style={{ background: C.blueLt }}>
                    <td style={{ ...td(), fontWeight: 800, color: C.blueDk }}>{bimok}</td><td style={td()} colSpan={2} />
                    <td style={{ ...td("right"), ...numCell, fontWeight: 800 }}>{gb.toLocaleString()}</td>
                    <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: ge > gb ? C.red : C.text }}>{ge.toLocaleString()}</td>
                    <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: gb - ge < 0 ? C.red : C.text }}>{(gb - ge).toLocaleString()}</td>
                    <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: grr > 100 ? C.red : C.text }}>{grr}%</td>
                  </tr>
                  {items.map((row, ri) => {
                    const ex = getEx(row), rem = (row.budget || 0) - ex, rr = rate(ex, row.budget), over = rr > 100;
                    return <tr key={ri}>
                      <td style={td()} />
                      <td style={{ ...td(), fontWeight: 600 }}>{row.semok}</td>
                      <td style={td()}>{row.sse}</td>
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
        </Panel>
      </>;
    })()}

    {/* 집행현황 */}
    {tab === "ledger" && (() => {
      const byBimokMap = {};
      for (const r of ledger) { const parent = SEMOK_TO_BIMOK[r.bimok] || r.bimok || "기타"; (byBimokMap[parent] = byBimokMap[parent] || []).push(r); }
      Object.values(byBimokMap).forEach((items) => items.sort((a, b) => (a.date || "").localeCompare(b.date || "")));
      const byBimok = Object.entries(byBimokMap).sort(([a], [b]) => { const ia = BIMOK_ORDER.indexOf(a), ib = BIMOK_ORDER.indexOf(b); return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib); });
      return <>
        <Panel title="집행 원장" sub={`총 ${ledger.length}건 · 비목별 그룹`} pad={false}>
          {ledger.length === 0 ? <div style={{ padding: "24px 16px", textAlign: "center", color: C.sub }}>등록된 집행내역이 없습니다.</div> :
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
                    <td style={td()}><Tag text={r.evidence_status || "미첨부"} color={r.evidence_status === "검토완료" ? C.blue : r.evidence_status === "첨부" ? C.green : C.red} /></td>
                  </tr>
                ))}
              </React.Fragment>;
            })}</tbody>
          </TableWrap>}
        </Panel>
      </>;
    })()}

    {/* 증빙 검토 */}
    {tab === "evidence" && <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
        <Kpi label="전체 전표" value={ledger.length} unit="건" accent={C.gray} />
        <Kpi label="증빙 첨부" value={attached} unit="건" accent={C.green} />
        <Kpi label="미첨부" value={notAttached} unit="건" accent={notAttached > 0 ? C.red : C.gray} />
        <Kpi label="검토완료" value={reviewed} unit="건" accent={C.blue} />
      </div>
      <Panel title="증빙 상태별 검토" pad={false} extra={
        <select value={evFilter} onChange={(e) => setEvFilter(e.target.value)} style={{ ...inp, padding: "5px 10px", fontSize: 12.5 }}>
          {["전체", "미첨부", "첨부", "검토완료"].map((f) => <option key={f}>{f}</option>)}
        </select>
      }>
        {filteredLedger.length === 0 ? <div style={{ padding: "24px 16px", textAlign: "center", color: C.sub }}>해당 상태의 전표가 없습니다.</div> :
        <TableWrap>
          <thead><tr>{["전표일자", "집행내역", "집행액(원)", "비목", "증빙상태", "처리"].map((h, i) => <th key={h} style={th(i === 2 ? "right" : "left")}>{h}</th>)}</tr></thead>
          <tbody>{filteredLedger.map((r) => (
            <tr key={r.id}>
              <td style={{ ...td(), ...numCell, whiteSpace: "nowrap" }}>{r.date}</td>
              <td style={{ ...td(), fontWeight: 600 }}>{r.desc}</td>
              <td style={{ ...td("right"), ...numCell, fontWeight: 700 }}>{(r.amount || 0).toLocaleString()}</td>
              <td style={td()}>{r.bimok}</td>
              <td style={td()}><Tag text={r.evidence_status || "미첨부"} color={r.evidence_status === "검토완료" ? C.blue : r.evidence_status === "첨부" ? C.green : C.red} /></td>
              <td style={td()}>{r.evidence_status === "첨부" ? <Btn kind="ok" sm onClick={() => markReviewed(r.id)}><Check size={12} /> 검토완료</Btn> : r.evidence_status === "검토완료" ? <span style={{ fontSize: 12, color: C.blue, fontWeight: 700 }}>✓ 완료</span> : <span style={{ fontSize: 12, color: C.red }}>미첨부</span>}</td>
            </tr>
          ))}</tbody>
        </TableWrap>}
      </Panel>
    </>}

    {/* 통장 관리 */}
    {tab === "bank" && <BankManager companyId={coId} />}

    <div style={{ display: "flex", gap: 7, marginTop: 14 }}><Btn kind="primary">정산 확정</Btn><Btn kind="warn">보완 요청 (메일)</Btn>{checks.some((f) => f.sev === "high") && <Btn kind="danger">환수 산정</Btn>}</div>
  </>;
}

export function RecoverBoard() {
  const { companies } = useApp();
  const rec = companies.filter((c) => c.status === "환수발생");
  return <>
    <PageHead title="정산확정·환수" />
    <Panel title="환수 대상 과제" sub="비목 초과집행 등 부당집행 적발건" pad={false}>
      <TableWrap>
        <thead><tr>{["과제번호", "기업명", "적발 사유", "환수 산정액(원)", "처리"].map((h, i) => <th key={h} style={th(i === 3 ? "right" : "left")}>{h}</th>)}</tr></thead>
        <tbody>
          {rec.length === 0 && <tr><td style={{ ...td(), color: C.sub, textAlign: "center" }} colSpan={5}>환수 대상 과제가 없습니다.</td></tr>}
          {rec.map((c) => {
            const reasons = [...new Set(runChecks(c).filter((f) => f.sev === "high").map((f) => f.rule))];
            const amt = BIMOK.reduce((a, b) => a + Math.max(0, (c.exec[b.key] || 0) - (c.budget[b.key] || 0)), 0);
            return <tr key={c.id}><td style={{ ...td(), ...numCell, color: C.sub }}>{c.id}</td><td style={{ ...td(), fontWeight: 700 }}>{c.name}</td><td style={{ ...td(), color: C.sub }}>{reasons.join(", ") || "-"}</td><td style={{ ...td("right"), ...numCell, fontWeight: 800, color: C.red }}>{won(amt)}</td><td style={td()}><div style={{ display: "flex", gap: 6 }}><Btn kind="danger" sm>환수 통지</Btn><Btn kind="default" sm>소명 확인</Btn></div></td></tr>;
          })}
        </tbody>
      </TableWrap>
    </Panel>
  </>;
}

/* ═══════════ 셸 ═══════════ */
