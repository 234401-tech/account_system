import React, { useState, useEffect, useRef } from "react";
import { BookText, Building2, Calendar, Check, ChevronRight, ClipboardList, CreditCard, Download, FileText, Home, Image, Info, LayoutGrid, Lock, LogOut, Paperclip, PlusCircle, Receipt, RotateCw, ScanSearch, Send, Trash2, Upload, UserPlus, Users, X } from "lucide-react";
import { C, BIMOK, BIMOK_ORDER, SEMOK_TO_BIMOK, PERIOD, AMEND_STATUS } from "../../lib/theme.js";
import { sum, won, eok, rate } from "../../lib/format.js";
import { runChecks } from "../../lib/checks.js";
import { downloadXlsx, parseXlsx } from "../../lib/xlsx.js";
import { useApp } from "../../context/AppContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../api/index.js";
import { Shell } from "../common/Shell.jsx";
import { ExcelBulk } from "../common/ExcelBulk.jsx";
import { th, td, numCell, inp, Tag, Status, Btn, Panel, Breadcrumb, PageHead, SearchBox, Field, Kpi, Toast, MiniBar, TableWrap, InfoBar, DropZone } from "../common/ui.jsx";

export function AmendDiff({ a: rawA }) {
  // detail JSON이 있으면 펼쳐서 합침 (http 어댑터 대응)
  const detail = rawA.detail ? (typeof rawA.detail === "string" ? JSON.parse(rawA.detail) : rawA.detail) : {};
  const a = { ...detail, ...rawA };
  if (a.type === "사업비 변경") {
    if (!a.before || !a.after) return <div style={{ padding: 14, fontSize: 13, color: C.sub }}>변경 상세 데이터가 없습니다.</div>;
    const tb = sum(a.before), ta = sum(a.after);
    return <TableWrap>
      <thead><tr>{["비목", "변경 전(원)", "변경 후(원)", "증감(원)"].map((h, i) => <th key={h} style={th(i ? "right" : "left")}>{h}</th>)}</tr></thead>
      <tbody>
        {BIMOK.map((bm) => {
          const bf = a.before[bm.key] || 0, af = a.after[bm.key] || 0, d = af - bf;
          return <tr key={bm.key} style={{ background: d ? (d > 0 ? C.greenLt : C.redLt) : "transparent" }}>
            <td style={{ ...td(), fontWeight: 600 }}>{bm.key}</td>
            <td style={{ ...td("right"), ...numCell }}>{won(bf)}</td>
            <td style={{ ...td("right"), ...numCell, fontWeight: d ? 700 : 400 }}>{won(af)}</td>
            <td style={{ ...td("right"), ...numCell, fontWeight: 700, color: d > 0 ? C.green : d < 0 ? C.red : C.sub }}>{d === 0 ? "-" : `${d > 0 ? "+" : ""}${won(d)}`}</td>
          </tr>;
        })}
        <tr style={{ background: "#F8F9FB" }}>
          <td style={{ ...td(), fontWeight: 800 }}>합계</td>
          <td style={{ ...td("right"), ...numCell, fontWeight: 800 }}>{won(tb)}</td>
          <td style={{ ...td("right"), ...numCell, fontWeight: 800 }}>{won(ta)}</td>
          <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: ta - tb > 0 ? C.green : ta - tb < 0 ? C.red : C.sub }}>{ta - tb === 0 ? "총액 동일" : `${ta - tb > 0 ? "+" : ""}${won(ta - tb)}`}</td>
        </tr>
      </tbody>
    </TableWrap>;
  }
  if (a.type === "연구기간 변경") {
    return <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: `1px solid ${C.line}`, borderTop: `2px solid ${C.blue}`, borderRadius: 2, fontSize: 13.5 }}>
      <span style={{ color: C.sub }}>{a.periodBefore}</span><ChevronRight size={16} color={C.blue} /><b style={{ color: C.blueDk }}>{a.periodAfter}</b>
    </div>;
  }
  if (a.type === "참여연구원 변경" || a.type === "신규인력 추가" || a.type === "참여율 변경") {
    const bef = a.researchersBefore || [], aft = a.researchersAfter || [];
    const ids = [...new Set([...bef.map((r) => r.id), ...aft.map((r) => r.id)])];
    const rows = ids.map((id) => {
      const b = bef.find((r) => r.id === id), af = aft.find((r) => r.id === id);
      let kind = "유지", color = C.sub, r = af || b;
      if (b && !af) { kind = "제외"; color = C.red; r = b; }
      else if (!b && af) { kind = "추가"; color = C.green; }
      else if (b && af && (b.rate !== af.rate || b.role !== af.role || b.salary !== af.salary)) { kind = "변경"; color = C.amber; }
      return { kind, color, r, b, af };
    }).sort((x, y) => ({ 추가: 0, 변경: 1, 제외: 2, 유지: 3 }[x.kind] - { 추가: 0, 변경: 1, 제외: 2, 유지: 3 }[y.kind]));
    const sb = bef.filter((r) => r.salary).reduce((s, r) => s + r.rate, 0), sa = aft.filter((r) => r.salary).reduce((s, r) => s + r.rate, 0);
    return <TableWrap>
      <thead><tr>{["구분", "성명", "역할 / 직급", "참여율(전→후)", "인건비", "참여기간"].map((h, i) => <th key={h} style={th(i === 3 ? "right" : "left")}>{h}</th>)}</tr></thead>
      <tbody>
        {rows.map(({ kind, color, r, b, af }) => (
          <tr key={r.id} style={{ background: kind === "추가" ? C.greenLt : kind === "제외" ? C.redLt : kind === "변경" ? C.amberLt : "transparent" }}>
            <td style={td()}><Tag text={kind} color={color} /></td>
            <td style={{ ...td(), fontWeight: 600, textDecoration: kind === "제외" ? "line-through" : "none" }}>{r.name}</td>
            <td style={td()}>{r.role} · {r.position}</td>
            <td style={{ ...td("right"), ...numCell, fontWeight: 700 }}>{kind === "변경" && b ? `${b.rate}% → ${af.rate}%` : `${r.rate}%`}</td>
            <td style={td()}>{r.salary ? "현금" : "현물"}</td>
            <td style={{ ...td(), ...numCell, color: C.sub }}>{r.period}</td>
          </tr>
        ))}
        <tr style={{ background: "#F8F9FB" }}>
          <td style={{ ...td(), fontWeight: 800 }} colSpan={3}>현금계상 참여율 합</td>
          <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: sa !== sb ? C.amber : C.sub }}>{sb}% → {sa}%</td>
          <td style={td()} colSpan={2} />
        </tr>
      </tbody>
    </TableWrap>;
  }
  return <div style={{ padding: 14, border: `1px solid ${C.line}`, borderRadius: 2, fontSize: 13 }}>{a.detailText}</div>;
}

/* ═══════════ 과제 현황 (홈) ═══════════ */
function HomeTab({ co, cid, checks, pendingAmend, onAmendClick }) {
  const { budgetTrees, loadBudgetTree } = useApp();

  useEffect(() => { if (cid) loadBudgetTree(cid); }, [cid, loadBudgetTree]);

  const tree = budgetTrees[cid] || [];

  // budgetTree 비목별 집계
  const bimokGroups = {};
  for (const row of tree) {
    if (!bimokGroups[row.bimok]) bimokGroups[row.bimok] = { budget: 0, exec: 0 };
    bimokGroups[row.bimok].budget += row.budget || 0;
    bimokGroups[row.bimok].exec += (row.exec_amt || row.exec || 0);
  }
  const bimokList = Object.entries(bimokGroups);
  const totB = bimokList.reduce((a, [, v]) => a + v.budget, 0);
  const totE = bimokList.reduce((a, [, v]) => a + v.exec, 0);
  const totR = rate(totE, totB);

  // budgetTree가 없으면 co.budget/co.exec 사용 (폴백)
  const useFallback = bimokList.length === 0;
  const fb = useFallback ? sum(co.budget) : 0;
  const fe = useFallback ? sum(co.exec) : 0;
  const fr = useFallback ? rate(fe, fb) : 0;
  const dispB = useFallback ? fb : totB;
  const dispE = useFallback ? fe : totE;
  const dispR = useFallback ? fr : totR;

  return <>
    {pendingAmend > 0 && <div style={{ background: C.amberLt, border: `1px solid ${C.amber}40`, borderRadius: 3, padding: "10px 16px", marginBottom: 14, fontSize: 12.5, color: C.text }}>
      협약변경 신청 <b>{pendingAmend}건</b>이 검토 중입니다. 승인 시 사업비·기간이 자동 반영됩니다. <button onClick={onAmendClick} style={{ background: "none", border: "none", color: C.blue, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>협약변경 보기</button>
    </div>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
      <Kpi label="총 사업비" value={useFallback ? `${eok(fb)}` : (totB / 100000000).toFixed(2)} unit="억원" sub={`${useFallback ? won(fb) : totB.toLocaleString()}원`} accent={C.blue} />
      <Kpi label="집행액" value={useFallback ? `${eok(fe)}` : (totE / 100000000).toFixed(2)} unit="억원" sub={`집행률 ${dispR}%`} accent={C.green} />
      <Kpi label="집행 잔액" value={useFallback ? `${eok(fb - fe)}` : ((totB - totE) / 100000000).toFixed(2)} unit="억원" sub={`${useFallback ? won(fb - fe) : (totB - totE).toLocaleString()}원`} accent={C.gray} />
      <Kpi label="점검 지적" value={`${checks.length}`} unit="건" sub={`위험 ${checks.filter((c) => c.sev === "high").length}건`} accent={checks.length ? C.red : C.green} />
    </div>
    <Panel title="비목별 집행 현황" pad={false}>
      <TableWrap>
        <thead><tr>{["비목", "예산(원)", "집행(원)", "잔액(원)", "집행률", "비고"].map((h, i) => <th key={h} style={th(i >= 1 && i <= 4 ? "right" : "left")}>{h}</th>)}</tr></thead>
        <tbody>
          {useFallback
            ? BIMOK.map((bm) => {
                const bb = co.budget[bm.key] || 0, ee = co.exec[bm.key] || 0, rr = rate(ee, bb), over = ee > bb;
                return <tr key={bm.key}>
                  <td style={{ ...td(), fontWeight: 600 }}>{bm.key}</td>
                  <td style={{ ...td("right"), ...numCell }}>{won(bb)}</td>
                  <td style={{ ...td("right"), ...numCell, fontWeight: 700, color: over ? C.red : C.text }}>{won(ee)}</td>
                  <td style={{ ...td("right"), ...numCell, color: bb - ee < 0 ? C.red : C.sub }}>{won(bb - ee)}</td>
                  <td style={{ ...td("right"), ...numCell }}><MiniBar v={rr} color={over ? C.red : rr > 85 ? C.amber : C.green} /> <b style={{ color: over ? C.red : C.text }}>{rr}%</b></td>
                  <td style={td()}>{over ? <Tag text="초과" color={C.red} /> : ""}</td>
                </tr>;
              })
            : bimokList.map(([bimok, v]) => {
                const rr = rate(v.exec, v.budget), over = v.exec > v.budget;
                return <tr key={bimok}>
                  <td style={{ ...td(), fontWeight: 600 }}>{bimok}</td>
                  <td style={{ ...td("right"), ...numCell }}>{v.budget.toLocaleString()}</td>
                  <td style={{ ...td("right"), ...numCell, fontWeight: 700, color: over ? C.red : C.text }}>{v.exec.toLocaleString()}</td>
                  <td style={{ ...td("right"), ...numCell, color: v.budget - v.exec < 0 ? C.red : C.sub }}>{(v.budget - v.exec).toLocaleString()}</td>
                  <td style={{ ...td("right"), ...numCell }}><MiniBar v={rr} color={over ? C.red : rr > 85 ? C.amber : C.green} /> <b style={{ color: over ? C.red : C.text }}>{rr}%</b></td>
                  <td style={td()}>{over ? <Tag text="초과" color={C.red} /> : ""}</td>
                </tr>;
              })
          }
          <tr style={{ background: "#F8F9FB" }}>
            <td style={{ ...td(), fontWeight: 800 }}>합계</td>
            <td style={{ ...td("right"), ...numCell, fontWeight: 800 }}>{useFallback ? won(fb) : totB.toLocaleString()}</td>
            <td style={{ ...td("right"), ...numCell, fontWeight: 800 }}>{useFallback ? won(fe) : totE.toLocaleString()}</td>
            <td style={{ ...td("right"), ...numCell, fontWeight: 800 }}>{useFallback ? won(fb - fe) : (totB - totE).toLocaleString()}</td>
            <td style={{ ...td("right"), ...numCell, fontWeight: 800 }}>{dispR}%</td><td style={td()} />
          </tr>
        </tbody>
      </TableWrap>
    </Panel>
  </>;
}

/* ═══════════ 기업 포털 ═══════════ */
export function CompanyPortal({ companyId }) {
  const { companies, amendments, submitAmendment, completeRegistration, loading } = useApp();
  const { user, logout } = useAuth();
  const cid = companyId;
  const [tab, setTab] = useState("home");
  const [toast, setToast] = useState("");
  const co = companies.find((c) => c.id === cid);
  useEffect(() => { setTab("home"); }, [cid]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 2800); return () => clearTimeout(t); } }, [toast]);

  // 데이터 로딩 중
  if (loading) return <div style={{ padding: 40, color: C.sub, fontFamily: "Pretendard, sans-serif" }}>과제 정보를 불러오는 중…</div>;

  // 연결된 과제가 없음 (관리자가 미연결로 설정)
  if (!cid || !co) return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Pretendard, sans-serif", background: "#F5F7FA" }}>
      <div style={{ maxWidth: 480, width: "90%", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 8, padding: "30px 36px", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 14 }}>📭</div>
        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>연결된 과제가 없습니다</div>
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, marginBottom: 20 }}>
          관리자가 아직 과제를 연결하지 않았습니다.<br/>
          관리자에게 과제 연결을 요청해 주세요.
        </div>
        <div style={{ fontSize: 12, color: C.sub, padding: "10px 14px", background: "#F8F9FB", borderRadius: 4, marginBottom: 16 }}>
          <b>계정 정보:</b> {user?.name} ({user?.email})
        </div>
        <Btn kind="default" onClick={logout}><LogOut size={13} /> 로그아웃</Btn>
      </div>
    </div>
  );
  const b = sum(co.budget), e = sum(co.exec), r = rate(e, b);
  const checks = runChecks(co);
  const myAmends = amendments.filter((a) => a.companyId === cid);
  const pendingAmend = myAmends.filter((a) => a.status === "검토중").length;
  const needsReg = co.status === "초기등록";
  const menu = [
    { k: "home", label: "과제 현황", icon: Home },
    { k: "people", label: "참여연구원 관리", icon: Users },
    { k: "bank", label: "통장 관리", icon: CreditCard },
    { k: "budget", label: "예산 현황", icon: LayoutGrid },
    { k: "ledger", label: "예산 집행 현황", icon: ClipboardList },
    { k: "amend", label: "협약변경", icon: FileText, badge: pendingAmend },
    { k: "audit", label: "회계검토 결과", icon: ClipboardList },
    { k: "settle", label: "정산·사용실적보고", icon: Send },
    { k: "rule", label: "연구비 사용기준", icon: BookText },
  ];
  const cur = menu.find((m) => m.k === tab);

  return (
    <Shell role="company" menu={menu} active={tab} onNav={setTab} orgLabel={co.name} sub={`${co.id} · ${cid.toLowerCase()}@biz.co.kr`}>
      <Breadcrumb items={["기업 포털", cur.label]} />
      <PageHead title={cur.label} actions={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Status s={co.status} />
          <span style={{ fontSize: 12, color: C.sub }}>{co.name} 담당자</span>
        </div>
      } />
      <InfoBar rows={[["과제번호", co.id], ["과제명", co.task], ["회사명", co.consortium], ["연구책임자", co.pm], ["협약기간", co.period]]} />

      {needsReg && (
        <div style={{ background: C.tealLt, border: `1px solid ${C.teal}55`, borderRadius: 3, padding: "12px 16px", marginBottom: 14 }}>
          <div style={{ fontWeight: 800, color: C.teal, fontSize: 13 }}>협약이 체결되어 과제가 발급되었습니다. <span style={{ color: C.text }}>집행을 시작하려면 초기 등록을 완료해 주세요.</span></div>
        </div>
      )}

      {co.status === "보완요청" && tab === "home" && (
        <div style={{ background: C.redLt, border: `1px solid ${C.red}40`, borderRadius: 3, padding: "12px 16px", marginBottom: 14 }}>
          <div style={{ fontWeight: 800, color: C.red, fontSize: 13, marginBottom: 6 }}>[보완요청] 소명·증빙 보완 후 사용실적보고서 재제출 요망</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: C.text, lineHeight: 1.8 }}>{checks.filter((c) => c.sev === "high").map((c, i) => <li key={i}>{c.rule} — {c.detail}</li>)}</ul>
        </div>
      )}

      {/* 초기 등록 (발급 직후, 기업이 직접 진행) */}
      {needsReg && tab === "home" && <InitialRegistration co={co} onDone={async (researchers, acctInfo) => {
        try {
          await completeRegistration(co.id, researchers, acctInfo);
          setToast("초기 등록이 완료되었습니다. 집행을 시작할 수 있습니다.");
          setTimeout(() => window.location.reload(), 800);
        } catch (e) {
          console.error(e);
          setToast("초기 등록 실패: " + (e.message || "다시 시도해 주세요"));
        }
      }} />}

      {/* 과제 현황 */}
      {!needsReg && tab === "home" && <HomeTab co={co} cid={cid} checks={checks} pendingAmend={pendingAmend} onAmendClick={() => setTab("amend")} />}

      {/* 예산 현황 (커스텀 편집 + 엑셀) */}
      {!needsReg && tab === "budget" && <BudgetSheet companyId={cid} />}

      {/* 통장 관리 */}
      {!needsReg && tab === "bank" && <BankManager companyId={cid} />}

      {/* 예산 집행 현황 (엑셀 업로드 + 증빙) */}
      {!needsReg && tab === "ledger" && <LedgerSheet companyId={cid} />}

      {/* 협약변경 */}
      {!needsReg && tab === "amend" && <CompanyAmend co={co} amends={myAmends} onSubmit={(a) => { submitAmendment(a); setToast("협약변경 신청이 접수되었습니다. 검토 후 반영됩니다."); }} />}

      {/* 참여연구원 관리 */}
      {!needsReg && tab === "people" && <ResearcherView co={co} amends={myAmends} onChangeRequest={() => setTab("amend")} />}

      {needsReg && tab !== "home" && <Panel title="초기 등록 필요"><div style={{ fontSize: 13, color: C.sub }}>과제가 발급되었으나 아직 초기 등록이 완료되지 않았습니다. <b style={{ color: C.text }}>과제 현황</b> 메뉴에서 초기 등록을 완료하면 이용할 수 있습니다.</div></Panel>}

      {!needsReg && tab === "audit" && <AuditResult companyId={cid} />}
      {!needsReg && tab === "settle" && <SettleView co={co} checks={checks} onSubmit={() => setToast("집행마감 후 사용실적보고서가 제출되었습니다.")} />}
      {!needsReg && tab === "rule" && <PolicyManager companyId={cid} />}
      {toast && <Toast text={toast} />}
    </Shell>
  );
}

const AMEND_DOT = { 신청: C.blue, 승인: C.green, 반려: C.red, 검토중: C.amber };

export function CompanyAmend({ co, amends, onSubmit }) {
  const { refreshAmendments } = useApp();
  const [mode, setMode] = useState("new"); // new | list | timeline
  const [open, setOpen] = useState(null);

  // 타임라인 이벤트 생성
  const timelineEvents = [];
  for (const a of [...amends].reverse()) {
    timelineEvents.push({ date: a.submittedAt, action: "신청", type: a.type, reason: a.reason, status: a.status, amendId: a.id, attachCount: (a.attachments || []).length });
    if (a.reviewedAt) timelineEvents.push({ date: a.reviewedAt, action: a.status, type: a.type, comment: a.reviewComment, amendId: a.id });
  }

  return (
    <>
      {/* 뷰 탭 */}
      <div style={{ display: "flex", borderBottom: `2px solid ${C.line}`, marginBottom: 14 }}>
        {[["new", "신규 신청"], ["list", "신청내역"], ["timeline", "변경이력"]].map(([k, l]) => (
          <button key={k} onClick={() => setMode(k)} style={{ padding: "10px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: mode === k ? "#fff" : "transparent", color: mode === k ? C.blue : C.sub, borderBottom: mode === k ? `2.5px solid ${C.blue}` : "2.5px solid transparent", marginBottom: -2 }}>{l}</button>
        ))}
      </div>

      {/* 신청내역 */}
      {mode === "list" && <Panel title="협약변경 신청 내역" sub={`총 ${amends.length}건`} pad={false}>
        <TableWrap>
          <thead><tr>{["신청번호", "변경유형", "신청일", "상태", "첨부", "검토의견", ""].map((h) => <th key={h} style={th()}>{h}</th>)}</tr></thead>
          <tbody>
            {amends.length === 0 && <tr><td style={{ ...td(), textAlign: "center", color: C.sub }} colSpan={7}>신청 내역이 없습니다.</td></tr>}
            {amends.map((a) => <React.Fragment key={a.id}>
              <tr>
                <td style={{ ...td(), ...numCell, color: C.sub }}>{a.id}</td>
                <td style={{ ...td(), fontWeight: 600 }}>{a.type}</td>
                <td style={{ ...td(), ...numCell }}>{a.submittedAt}</td>
                <td style={td()}><Tag text={a.status} color={AMEND_STATUS[a.status]} /></td>
                <td style={td()}>{(a.attachments || []).length > 0
                  ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: C.green, fontWeight: 700 }}><Paperclip size={12} /> {a.attachments.length}건</span>
                  : <span style={{ fontSize: 12, color: C.faint }}>없음</span>}</td>
                <td style={{ ...td(), color: C.sub }}>{a.reviewComment || "-"}</td>
                <td style={td()}><Btn kind="default" sm onClick={() => setOpen(open === a.id ? null : a.id)}>{open === a.id ? "닫기" : "보기"}</Btn></td>
              </tr>
              {open === a.id && <tr><td colSpan={7} style={{ padding: 14, background: "#FAFBFC", borderBottom: `1px solid ${C.lineSoft}` }}>
                <div style={{ fontSize: 12.5, marginBottom: 10 }}><b>변경사유</b> · {a.reason}</div>
                <AmendDiff a={a} />
                {(a.attachments || []).length > 0 && <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 6 }}>첨부파일</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {a.attachments.map((f, i) => (
                      <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", border: `1px solid ${C.line}`, borderRadius: 4, fontSize: 12, cursor: "pointer", background: "#fff" }}>
                        <FileText size={13} color={C.blue} /> {f.originalName || f.original_name || f.name || "파일"}
                      </div>
                    ))}
                  </div>
                </div>}
                {a.status === "승인" && <div style={{ marginTop: 10, fontSize: 12.5, color: C.green, fontWeight: 700 }}>✓ 승인 완료 — 변경 내용이 과제에 반영되었습니다.</div>}
                {a.status === "반려" && <div style={{ marginTop: 10, fontSize: 12.5, color: C.red, fontWeight: 700 }}>✕ 반려 — {a.reviewComment}</div>}
              </td></tr>}
            </React.Fragment>)}
          </tbody>
        </TableWrap>
      </Panel>}

      {/* 변경이력 타임라인 */}
      {mode === "timeline" && <Panel title="협약변경 이력" sub="시간순 타임라인">
        {timelineEvents.length === 0
          ? <div style={{ padding: "24px 0", textAlign: "center", color: C.sub }}>변경 이력이 없습니다.</div>
          : <div style={{ position: "relative", paddingLeft: 28 }}>
            <div style={{ position: "absolute", left: 9, top: 8, bottom: 8, width: 2, background: C.line }} />
            {timelineEvents.map((ev, i) => (
              <div key={i} style={{ position: "relative", marginBottom: i < timelineEvents.length - 1 ? 20 : 0 }}>
                <div style={{ position: "absolute", left: -24, top: 4, width: 12, height: 12, borderRadius: 999, background: AMEND_DOT[ev.action] || C.gray, border: "2px solid #fff", boxShadow: `0 0 0 2px ${(AMEND_DOT[ev.action] || C.gray)}33` }} />
                <div style={{ border: `1px solid ${C.line}`, borderRadius: 6, padding: "10px 14px", background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: C.sub, ...numCell }}>{ev.date}</span>
                      <Tag text={ev.action} color={AMEND_DOT[ev.action]} />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{ev.type}</span>
                    </div>
                    {ev.attachCount > 0 && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.sub }}><Paperclip size={12} /> {ev.attachCount}건</span>}
                  </div>
                  {ev.reason && <div style={{ fontSize: 12.5, color: C.text }}>{ev.reason}</div>}
                  {ev.comment && <div style={{ fontSize: 12.5, color: ev.action === "반려" ? C.red : C.green, fontWeight: 600 }}>{ev.action === "승인" ? "✓" : "✕"} {ev.comment}</div>}
                </div>
              </div>
            ))}
          </div>}
      </Panel>}

      {/* 신규 신청 */}
      {mode === "new" && <AmendForm co={co} onSubmit={async (a) => { await onSubmit(a); setMode("list"); }} onFilesUploaded={refreshAmendments} />}
    </>
  );
}

export function AmendForm({ co, onSubmit, onFilesUploaded, initType }) {
  const [type, setType] = useState(initType || "사업비 변경");
  const [after, setAfter] = useState({ ...co.budget });
  const [periodAfter, setPeriodAfter] = useState(co.period);
  const [people, setPeople] = useState(co.researchers.map((r) => ({ ...r })));
  const [reason, setReason] = useState("");
  const tb = sum(co.budget), ta = sum(after);
  const lbl = { background: "#F8F9FB", padding: "11px 14px", fontSize: 12.5, fontWeight: 700, color: C.text, borderRight: `1px solid ${C.lineSoft}`, display: "flex", alignItems: "center" };
  const row = { display: "grid", gridTemplateColumns: "120px 1fr", borderBottom: `1px solid ${C.lineSoft}` };
  const cell = { padding: "9px 14px", display: "flex", alignItems: "center", gap: 8 };

  const setP = (i, k, v) => setPeople(people.map((p, idx) => idx === i ? { ...p, [k]: v } : p));
  const addP = () => setPeople([...people, { id: "N" + Math.floor(Math.random() * 9000 + 1000), name: "", role: "참여연구원", position: "연구원", rate: 0, period: co.period, salary: true, _new: true }]);
  const toggleRemove = (i) => setPeople(people.map((p, idx) => idx === i ? { ...p, _removed: !p._removed } : p));

  const [files, setFiles] = useState([]);
  const fileRef = useRef(null);
  const addFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f && files.length < 5) setFiles([...files, { name: f.name, file: f, url: URL.createObjectURL(f) }]);
    e.target.value = "";
  };

  const submit = async () => {
    const now = new Date();
    const mmdd = `${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const seq = String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0") + String(now.getSeconds()).padStart(2, "0");
    const id = `GB-${now.getFullYear()}-${mmdd}-${seq}`;
    const submittedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const base = { id, companyId: co.id, company: co.name, type, reason: reason || "(사유 미입력)", submittedAt, status: "검토중", reviewComment: "", attachments: [] };
    let amend;
    if (type === "사업비 변경") amend = { ...base, before: { ...co.budget }, after: { ...after } };
    else if (type === "연구기간 변경") amend = { ...base, periodBefore: co.period, periodAfter };
    else if (type === "신규인력 추가" || type === "참여연구원 변경" || type === "참여율 변경") amend = { ...base, researchersBefore: co.researchers, researchersAfter: people.filter((p) => !p._removed).map(({ _new, _removed, ...r }) => r) };

    await onSubmit(amend);
    // 첨부파일 업로드
    for (const f of files) {
      try { await api.attachAmendmentFile(id, f.file); } catch (e) { console.error(e); }
    }
    if (files.length > 0 && onFilesUploaded) await onFilesUploaded();
    setFiles([]);
  };

  return <>
    <div style={{ border: `1px solid ${C.line}`, borderTop: `2px solid ${C.blue}`, borderRadius: 2, marginBottom: 14 }}>
      <div style={row}><div style={lbl}>변경유형</div><div style={cell}><select value={type} onChange={(e) => setType(e.target.value)} style={inp}><option>사업비 변경</option><option>연구기간 변경</option><option>신규인력 추가</option><option>참여연구원 변경</option><option>참여율 변경</option></select></div></div>
      <div style={{ ...row, borderBottom: "none" }}><div style={lbl}>변경사유</div><div style={cell}><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="변경 사유를 입력하세요" style={{ ...inp, width: "100%", maxWidth: 480 }} /></div></div>
    </div>

    {type === "사업비 변경" ? (
      <Panel title="비목별 사업비 변경(안)" sub="변경 후 금액을 입력하세요 (원 단위)" pad={false}>
        <TableWrap>
          <thead><tr>{["비목", "현재 배정(원)", "변경 후(원)", "증감(원)"].map((h, i) => <th key={h} style={th(i ? "right" : "left")}>{h}</th>)}</tr></thead>
          <tbody>
            {BIMOK.map((bm) => {
              const cur = co.budget[bm.key] || 0, nv = after[bm.key] || 0, d = nv - cur;
              return <tr key={bm.key} style={{ background: d ? (d > 0 ? C.greenLt : C.redLt) : "transparent" }}>
                <td style={{ ...td(), fontWeight: 600 }}>{bm.key}</td>
                <td style={{ ...td("right"), ...numCell }}>{cur.toLocaleString()}</td>
                <td style={{ ...td("right") }}><input value={nv ? nv.toLocaleString() : "0"} onChange={(e) => setAfter({ ...after, [bm.key]: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })} style={{ ...inp, width: 140, textAlign: "right", ...numCell }} /></td>
                <td style={{ ...td("right"), ...numCell, fontWeight: 700, color: d > 0 ? C.green : d < 0 ? C.red : C.sub }}>{d === 0 ? "-" : `${d > 0 ? "+" : ""}${d.toLocaleString()}`}</td>
              </tr>;
            })}
            <tr style={{ background: "#F8F9FB" }}>
              <td style={{ ...td(), fontWeight: 800 }}>합계</td>
              <td style={{ ...td("right"), ...numCell, fontWeight: 800 }}>{tb.toLocaleString()}</td>
              <td style={{ ...td("right"), ...numCell, fontWeight: 800 }}>{ta.toLocaleString()}</td>
              <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: ta - tb > 0 ? C.green : ta - tb < 0 ? C.red : C.sub }}>{ta - tb === 0 ? "총액 동일" : `${ta - tb > 0 ? "+" : ""}${(ta - tb).toLocaleString()}`}</td>
            </tr>
          </tbody>
        </TableWrap>
      </Panel>
    ) : type === "연구기간 변경" ? (
      <Panel title="연구기간 변경(안)" pad>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 13 }}>
          <span style={{ color: C.sub }}>현재: {co.period}</span><ChevronRight size={15} color={C.blue} />
          <Field label="변경 후 종료일"><input type="date" value={periodAfter.split(" ~ ")[1] || "2026-12-31"} onChange={(e) => setPeriodAfter(`${co.period.split(" ~ ")[0]} ~ ${e.target.value}`)} style={inp} /></Field>
        </div>
      </Panel>
    ) : type === "참여율 변경" ? (() => {
      const selected = people.filter((p) => p._rateTarget);
      const unselected = people.filter((p) => !p._rateTarget);
      return <>
        {/* 대상 선택 */}
        <Panel title="변경 대상 선택" sub="참여율을 변경할 연구원을 선택하세요" pad={false}>
          <TableWrap>
            <thead><tr>{["선택", "성명", "역할", "직급", "현재 참여기간", "현재 참여율(%)", "인건비"].map((h, i) => <th key={h} style={th(i === 5 ? "right" : "left")}>{h}</th>)}</tr></thead>
            <tbody>
              {people.map((p, i) => (
                <tr key={p.id} style={{ background: p._rateTarget ? C.blueLt : "transparent" }}>
                  <td style={td()}><input type="checkbox" checked={!!p._rateTarget} onChange={() => setP(i, "_rateTarget", !p._rateTarget)} style={{ accentColor: C.blue }} /></td>
                  <td style={{ ...td(), fontWeight: 700 }}>{p.name}</td>
                  <td style={td()}>{p.role}</td>
                  <td style={td()}>{p.position}</td>
                  <td style={{ ...td(), ...numCell }}>{p.period || "-"}</td>
                  <td style={{ ...td("right"), ...numCell, fontWeight: 700 }}>{p.rate}%</td>
                  <td style={td()}>{p.salary ? "현금" : "현물"}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Panel>

        {/* 선택된 대상 당초/변경 입력 */}
        {selected.length > 0 && <Panel title="참여율 변경(안)" sub="당초 대비 변경 참여율·참여기간을 입력하세요" pad={false}>
          <TableWrap>
            <thead><tr>{["성명", "역할", "직급", "구분", "참여기간", "참여율(%)", "인건비"].map((h, i) => <th key={h} style={th(i === 5 ? "right" : "left")}>{h}</th>)}</tr></thead>
            <tbody>
              {selected.map((p) => {
                const i = people.findIndex((x) => x.id === p.id);
                const orig = co.researchers.find((r) => r.id === p.id);
                const rateChanged = orig && (orig.rate !== p.rate || orig.period !== p.period);
                return <React.Fragment key={p.id}>
                  <tr style={{ background: C.amberLt }}>
                    <td style={{ ...td(), fontWeight: 700 }} rowSpan={2}>{p.name}</td>
                    <td style={{ ...td() }} rowSpan={2}>{p.role}</td>
                    <td style={{ ...td() }} rowSpan={2}>{p.position}</td>
                    <td style={{ ...td(), color: C.sub, fontWeight: 600 }}>당초</td>
                    <td style={{ ...td(), ...numCell, color: C.sub }}>{orig ? orig.period : p.period}</td>
                    <td style={{ ...td("right"), ...numCell, color: C.sub }}>{orig ? orig.rate : p.rate}%</td>
                    <td style={{ ...td(), color: C.sub }} rowSpan={2}>{p.salary ? "현금" : "현물"}</td>
                  </tr>
                  <tr style={{ background: C.blueLt }}>
                    <td style={{ ...td(), fontWeight: 700, color: C.blue }}>변경</td>
                    <td style={td()}><input value={p.period || ""} onChange={(e) => setP(i, "period", e.target.value)} placeholder="2026-04-01 ~ 2026-12-31" style={{ ...inp, width: 220, ...numCell }} /></td>
                    <td style={td("right")}><input value={p.rate} onChange={(e) => setP(i, "rate", Number(e.target.value.replace(/[^0-9]/g, "")) || 0)} style={{ ...inp, width: 60, textAlign: "right", ...numCell, fontWeight: 700, color: C.blue }} /></td>
                  </tr>
                </React.Fragment>;
              })}
              <tr style={{ background: "#F8F9FB" }}>
                <td style={{ ...td(), fontWeight: 800 }} colSpan={5}>변경 후 참여율 합 (선택 대상)</td>
                <td style={{ ...td("right"), ...numCell, fontWeight: 800 }}>{selected.filter((p) => p.salary).reduce((s, p) => s + Number(p.rate || 0), 0)}%</td>
                <td style={td()} />
              </tr>
            </tbody>
          </TableWrap>
        </Panel>}
      </>;
    })()
    : (type === "신규인력 추가" || type === "참여연구원 변경") ? (
      <Panel title={type === "신규인력 추가" ? "신규인력 추가" : "참여연구원 변경(안)"}
        sub={type === "신규인력 추가" ? "새로운 연구원을 추가합니다" : "연구원 추가·제외 및 참여율 조정"} pad={false}
        extra={<Btn kind="default" sm onClick={addP}><UserPlus size={13} /> 연구원 추가</Btn>}>
        <TableWrap>
          <thead><tr>{["성명", "역할", "직급", "참여율(%)", "참여기간", "인건비", "관리"].map((h, i) => <th key={h} style={th(i === 3 ? "right" : "left")}>{h}</th>)}</tr></thead>
          <tbody>
            {people.map((p, i) => {
              const isExisting = !p._new;
              const nameDisabled = p._removed;
              const showRemove = type === "참여연구원 변경";
              return <tr key={p.id} style={{ background: p._removed ? C.redLt : p._new ? C.greenLt : "transparent", opacity: p._removed ? 0.6 : 1 }}>
                <td style={td()}><input value={p.name} onChange={(e) => setP(i, "name", e.target.value)} disabled={nameDisabled} placeholder="성명" style={{ ...inp, width: 90, textDecoration: p._removed ? "line-through" : "none" }} /></td>
                <td style={td()}><select value={p.role} onChange={(e) => setP(i, "role", e.target.value)} disabled={nameDisabled} style={{ ...inp, padding: "4px 6px" }}><option>연구책임자</option><option>참여연구원</option></select></td>
                <td style={td()}><input value={p.position} onChange={(e) => setP(i, "position", e.target.value)} disabled={nameDisabled} style={{ ...inp, width: 90 }} /></td>
                <td style={td("right")}><input value={p.rate} onChange={(e) => setP(i, "rate", Number(e.target.value.replace(/[^0-9]/g, "")) || 0)} disabled={p._removed} style={{ ...inp, width: 60, textAlign: "right", ...numCell, borderColor: p.rate > 100 ? C.red : C.line, color: p.rate > 100 ? C.red : C.text }} /></td>
                <td style={td()}><input value={p.period || ""} onChange={(e) => setP(i, "period", e.target.value)} disabled={nameDisabled} placeholder="2026-02-01 ~ 2026-11-30" style={{ ...inp, width: 220, ...numCell }} /></td>
                <td style={td()}><select value={p.salary ? "현금" : "현물"} onChange={(e) => setP(i, "salary", e.target.value === "현금")} disabled={nameDisabled} style={{ ...inp, padding: "4px 6px" }}><option>현금</option><option>현물</option></select></td>
                <td style={td()}>
                  {p._new && <Btn kind="default" sm onClick={() => setPeople(people.filter((_, idx) => idx !== i))}><Trash2 size={12} /></Btn>}
                  {isExisting && showRemove && <Btn kind={p._removed ? "default" : "danger"} sm onClick={() => toggleRemove(i)}>{p._removed ? <><RotateCw size={12} /> 복원</> : "제외"}</Btn>}
                </td>
              </tr>;
            })}
            <tr style={{ background: "#F8F9FB" }}>
              <td style={{ ...td(), fontWeight: 800 }} colSpan={3}>현금계상 참여율 합</td>
              <td style={{ ...td("right"), ...numCell, fontWeight: 800 }}>{people.filter((p) => !p._removed && p.salary).reduce((s, p) => s + Number(p.rate || 0), 0)}%</td>
              <td style={td()} colSpan={3} />
            </tr>
          </tbody>
        </TableWrap>
        <div style={{ display: "flex", gap: 7, padding: "10px 0 0", fontSize: 12, color: C.sub }}><Info size={14} style={{ flexShrink: 0, marginTop: 1 }} /> 개인 참여율 100% 초과 시 자동 점검에서 적발됩니다.</div>
      </Panel>
    ) : null}
    {/* 첨부파일 */}
    <div style={{ marginBottom: 14 }}>
      <DropZone files={files} setFiles={setFiles} />
    </div>
    <div style={{ display: "flex", justifyContent: "flex-end" }}><Btn kind="primary" onClick={submit}><Send size={13} /> 협약변경 신청 제출</Btn></div>
  </>;
}

export function ResearcherView({ co, amends, onChangeRequest }) {
  const people = co.researchers || [];
  const cash = people.filter((r) => r.salary);
  const sumRate = cash.reduce((s, r) => s + r.rate, 0);
  const pendingPeople = amends.filter((a) => a.type === "참여연구원 변경" && a.status === "검토중").length;
  return <>
    {pendingPeople > 0 && <div style={{ background: C.amberLt, border: `1px solid ${C.amber}40`, borderRadius: 3, padding: "10px 16px", marginBottom: 14, fontSize: 12.5 }}>
      참여연구원 변경 신청 <b>{pendingPeople}건</b>이 검토 중입니다. 승인 시 아래 명단에 반영됩니다.
    </div>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 14 }}>
      <Kpi label="총 참여인원" value={people.length} unit="명" accent={C.blue} />
      <Kpi label="인건비 계상(현금)" value={cash.length} unit="명" sub={`현물 ${people.length - cash.length}명`} accent={C.gray} />
      <Kpi label="현금계상 참여율 합" value={sumRate} unit="%" sub={people.some((r) => r.rate > 100) ? "100% 초과자 있음" : "정상"} accent={people.some((r) => r.rate > 100) ? C.red : C.green} />
    </div>
    <Panel title="참여연구원 명단" sub="변경은 협약변경을 통해 신청합니다" pad={false}
      extra={<Btn kind="primary" sm onClick={onChangeRequest}><FileText size={13} /> 협약변경(인력) 신청</Btn>}>
      <TableWrap>
        <thead><tr>{["No", "성명", "역할", "직급", "참여율", "인건비 계상", "참여기간"].map((h, i) => <th key={h} style={th(i === 4 ? "right" : "left")}>{h}</th>)}</tr></thead>
        <tbody>
          {people.map((r, i) => (
            <tr key={r.id}>
              <td style={{ ...td(), color: C.sub }}>{i + 1}</td>
              <td style={{ ...td(), fontWeight: 700 }}>{r.name}</td>
              <td style={td()}>{r.role === "연구책임자" ? <Tag text="연구책임자" color={C.blue} /> : "참여연구원"}</td>
              <td style={td()}>{r.position}</td>
              <td style={{ ...td("right"), ...numCell, fontWeight: 700, color: r.rate > 100 ? C.red : C.text }}>{r.rate}%</td>
              <td style={td()}>{r.salary ? <Tag text="현금" color={C.green} /> : <Tag text="현물" color={C.gray} />}</td>
              <td style={{ ...td(), ...numCell, color: C.sub }}>{r.period}</td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Panel>
  </>;
}

/* ═══════════ 예산 현황 (커스텀 편집 + 엑셀) ═══════════ */
export function BudgetSheet({ companyId }) {
  const { budgetTrees, loadBudgetTree, updateBudgetTree } = useApp();
  const [localRows, setLocalRows] = useState([]);
  const ref = useRef(null);
  const [toast, setToast] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (companyId) loadBudgetTree(companyId).then(() => setLoaded(true));
  }, [companyId, loadBudgetTree]);

  const serverRows = budgetTrees[companyId] || [];
  const rows = loaded ? (localRows.length ? localRows : serverRows.map((r, i) => ({ ...r, _id: r.id || r._id || "B" + i }))) : [];

  useEffect(() => { if (serverRows.length && !localRows.length) setLocalRows(serverRows.map((r, i) => ({ ...r, _id: r.id || r._id || "B" + i }))); }, [serverRows]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 2600); return () => clearTimeout(t); } }, [toast]);

  const totB = rows.reduce((a, r) => a + (r.budget || 0), 0);
  const totE = rows.reduce((a, r) => a + (r.exec_amt || r.exec || 0), 0);
  const set = (id, k, v) => setLocalRows(rows.map((r) => r._id === id ? { ...r, [k]: v } : r));
  const groupKey = (r) => r._group || r.bimok || "";

  // 비목 추가: 빈 비목 그룹 생성. _group으로 격리되어 다른 빈 그룹과 안 합쳐짐
  const addBimok = () => {
    const gk = "G" + Date.now();
    setLocalRows([...rows, { _id: "B" + Date.now(), _group: gk, bimok: "", semok: "", sse: "", gwamok: "", budget: 0, exec_amt: 0 }]);
  };
  // 세목 추가: 같은 비목 그룹에 새 행 추가
  const addSemok = (gk) => {
    const ref = rows.find((r) => groupKey(r) === gk);
    if (!ref) return;
    setLocalRows([...rows, { _id: "B" + Date.now(), _group: ref._group, bimok: ref.bimok, semok: "", sse: "", gwamok: "", budget: 0, exec_amt: 0 }]);
  };
  // 비목명 변경: 같은 그룹의 모든 행에 일괄 적용
  const setBimokName = (gk, newName) => {
    setLocalRows(rows.map((r) => groupKey(r) === gk ? { ...r, bimok: newName } : r));
  };
  const del = (id) => setLocalRows(rows.filter((r) => r._id !== id));
  // 비목 그룹 통째 삭제
  const delBimok = (gk) => {
    if (!confirm("이 비목 전체를 삭제하시겠습니까?")) return;
    setLocalRows(rows.filter((r) => groupKey(r) !== gk));
  };

  // 비목별 그룹 — _group 또는 bimok명 기준
  const groupsMap = rows.reduce((a, r) => {
    const gk = groupKey(r);
    if (!a[gk]) a[gk] = { bimok: r.bimok || "", items: [] };
    a[gk].items.push(r);
    return a;
  }, {});
  const groups = Object.entries(groupsMap).sort(([_, ga], [__, gb]) => {
    const ia = BIMOK_ORDER.indexOf(ga.bimok), ib = BIMOK_ORDER.indexOf(gb.bimok);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const getExec = (r) => r.exec_amt || r.exec || 0;
  const onUpload = (raw) => {
    const parsed = raw.slice(1).filter((r) => r[0]).map((r, i) => ({ _id: "U" + i, bimok: String(r[0] || ""), semok: String(r[1] || ""), sse: String(r[2] || ""), gwamok: "", budget: Number(String(r[3]).replace(/[^0-9]/g, "")) || 0, exec_amt: Number(String(r[4]).replace(/[^0-9]/g, "")) || 0 }));
    if (parsed.length) { setLocalRows(parsed); setToast(`예산 ${parsed.length}행을 엑셀로 불러왔습니다.`); }
  };
  const download = () => downloadXlsx("예산현황_" + new Date().toISOString().slice(0, 10) + ".xlsx", [["비목", "세목", "세세목", "예산(원)", "집행(원)", "잔액(원)", "집행률(%)"], ...rows.map((r) => [r.bimok, r.semok, r.sse, r.budget, getExec(r), r.budget - getExec(r), rate(getExec(r), r.budget)])]);
  const r = rate(totE, totB);

  return <>
    <PageHead title="과제 예산 현황" actions={
      <div style={{ display: "flex", gap: 7 }}>
        <Btn kind="default" sm onClick={() => downloadXlsx("예산현황_양식.xlsx", [["비목", "세목", "세세목", "예산(원)", "집행(원)"], ["인건비", "보수", "보수", 100000000, 0]])}><Download size={13} /> 양식 다운로드</Btn>
        <Btn kind="default" sm onClick={() => ref.current && ref.current.click()}><Upload size={13} /> 엑셀 업로드</Btn>
        <Btn kind="default" sm onClick={download}><Download size={13} /> 내보내기</Btn>
        <input ref={ref} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) parseXlsx(f, (rws) => { onUpload(rws); e.target.value = ""; }); }} />
        <Btn kind="primary" sm onClick={addBimok}><PlusCircle size={13} /> 비목 추가</Btn>
      </div>} />

    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
      <Kpi label="총 예산" value={totB.toLocaleString()} unit="원" sub="합산" accent={C.gray} />
      <Kpi label="집행액" value={totE.toLocaleString()} unit="원" sub={`집행 ${r}%`} accent={C.green} />
      <Kpi label="잔액" value={(totB - totE).toLocaleString()} unit="원" sub={`잔여 ${(100 - r).toFixed(1)}%`} accent={C.amber} />
      <Kpi label="집행률" value={r} unit="%" sub={`집행 ${totE.toLocaleString()}`} accent={C.blue} />
    </div>

    <Panel title="비목별 예산 현황" sub="셀을 클릭해 직접 수정 · 엑셀 업로드로 일괄 반영" pad={false}>
      <TableWrap>
        <thead><tr>{["비목", "세목", "세세목", "예산(원)", "집행(원)", "잔액(원)", "집행률", ""].map((h, i) => <th key={h} style={th(i >= 3 && i <= 6 ? "right" : "left")}>{h}</th>)}</tr></thead>
        <tbody>
          {groups.map(([gk, group]) => {
            const items = group.items;
            const gb = items.reduce((a, x) => a + (x.budget || 0), 0), ge = items.reduce((a, x) => a + getExec(x), 0), grr = rate(ge, gb);
            return <React.Fragment key={gk}>
              <tr style={{ background: C.blueLt }}>
                <td style={{ ...td(), fontWeight: 800, color: C.blueDk }}>
                  <input value={group.bimok} onChange={(e) => setBimokName(gk, e.target.value)} placeholder="비목명 입력"
                    style={{ ...inp, fontWeight: 800, color: C.blueDk, background: "transparent", border: `1px solid transparent`, padding: "4px 6px", width: 130 }} />
                </td>
                <td style={td()} colSpan={2}>
                  <Btn kind="default" sm onClick={() => addSemok(gk)}><PlusCircle size={11} /> 세목 추가</Btn>
                </td>
                <td style={{ ...td("right"), ...numCell, fontWeight: 800 }}>{gb.toLocaleString()}</td>
                <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: ge > gb ? C.red : C.text }}>{ge.toLocaleString()}</td>
                <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: gb - ge < 0 ? C.red : C.text }}>{(gb - ge).toLocaleString()}</td>
                <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: grr > 100 ? C.red : C.text }}>{grr}%</td>
                <td style={td()}><button onClick={() => delBimok(gk)} title="비목 전체 삭제" style={{ border: "none", background: "none", cursor: "pointer", color: C.faint }}><Trash2 size={13} /></button></td>
              </tr>
              {items.map((row) => {
                const ex = getExec(row), rem = (row.budget || 0) - ex, rr = rate(ex, row.budget), over = rr > 100;
                return <tr key={row._id}>
                  <td style={td()} />
                  <td style={td()}><input value={row.semok} onChange={(e) => set(row._id, "semok", e.target.value)} placeholder="세목" style={{ ...inp, width: 120, border: "1px solid transparent", background: "transparent" }} /></td>
                  <td style={td()}><input value={row.sse} onChange={(e) => set(row._id, "sse", e.target.value)} placeholder="세세목" style={{ ...inp, width: 280, border: "1px solid transparent", background: "transparent" }} /></td>
                  <td style={td("right")}><input value={(row.budget || 0).toLocaleString()} onChange={(e) => set(row._id, "budget", Number(e.target.value.replace(/[^0-9]/g, "")) || 0)} style={{ ...inp, width: 130, textAlign: "right", ...numCell }} /></td>
                  <td style={{ ...td("right"), ...numCell, fontWeight: 700, color: over ? C.red : C.text }}>{ex.toLocaleString()}</td>
                  <td style={{ ...td("right"), ...numCell, color: rem < 0 ? C.red : C.sub }}>{rem.toLocaleString()}</td>
                  <td style={{ ...td("right"), ...numCell }}><MiniBar v={rr} color={over ? C.red : rr > 85 ? C.amber : C.green} /> <b style={{ color: over ? C.red : C.text }}>{rr}%</b></td>
                  <td style={td()}><button onClick={() => del(row._id)} style={{ border: "none", background: "none", cursor: "pointer", color: C.faint }}><X size={14} /></button></td>
                </tr>;
              })}
            </React.Fragment>;
          })}
          <tr style={{ background: C.navy }}>
            <td style={{ ...td(), fontWeight: 800, color: "#fff", textAlign: "center" }} colSpan={3}>합 계</td>
            <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: "#fff" }}>{totB.toLocaleString()}</td>
            <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: "#fff" }}>{totE.toLocaleString()}</td>
            <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: "#fff" }}>{(totB - totE).toLocaleString()}</td>
            <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: "#fff" }}>{r}%</td><td style={{ ...td(), background: C.navy }} />
          </tr>
        </tbody>
      </TableWrap>
    </Panel>
    {toast && <Toast text={toast} />}
  </>;
}

/* ═══════════ 집행 현황 (엑셀 업로드 + 증빙첨부) ═══════════ */
export function LedgerSheet({ companyId }) {
  const { ledgers, loadLedger, addLedgerEntries } = useApp();
  const ref = useRef(null);
  const fileRef = useRef(null);
  const [toast, setToast] = useState("");
  const [target, setTarget] = useState(null);

  useEffect(() => { if (companyId) loadLedger(companyId); }, [companyId, loadLedger]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 2600); return () => clearTimeout(t); } }, [toast]);

  const rows = (ledgers[companyId] || []).map((r) => ({ ...r, desc: r.desc || r.description }));

  const total = rows.reduce((a, r) => a + (r.amount || 0), 0);
  // 비목(상위)별 그룹 + 일자순 (ICT 기금규정 비목 순서)
  const byBimokMap = {};
  for (const r of rows) {
    const parent = SEMOK_TO_BIMOK[r.bimok] || r.bimok || "기타";
    (byBimokMap[parent] = byBimokMap[parent] || []).push(r);
  }
  Object.values(byBimokMap).forEach((items) => items.sort((a, b) => (a.date || "").localeCompare(b.date || "")));
  const byBimok = Object.entries(byBimokMap).sort(([a], [b]) => {
    const ia = BIMOK_ORDER.indexOf(a), ib = BIMOK_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const tmpl = { name: "집행등록_양식.xlsx", rows: [["전표일자", "집행내역", "지급처", "집행액(원)", "세목", "재원"], ["2026-05-20", "AI 컨설팅 자문료", "홍길동", 500000, "전문가활용비", "국비"], ["2026-05-22", "사무용품 구입", "(주)오피스", 120000, "소모품비", "국비"]] };
  const [bulkItems, setBulkItems] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  const onUpload = (raw) => {
    const parsed = raw.slice(1).filter((r) => r[0] || r[1]).map((r, i) => {
      const semok = String(r[4] || "");
      const matched = semokOptions.includes(semok);
      return { _idx: i, date: String(r[0] || ""), description: String(r[1] || ""), payee: String(r[2] || "—"), amount: Number(String(r[3]).replace(/[^0-9]/g, "")) || 0, bimok: semok, fund: String(r[5] || "국비"), matched };
    });
    if (parsed.length) setBulkItems(parsed);
  };
  const bulkUnmatched = bulkItems.filter((r) => !r.matched).length;
  const fixBulkSemok = (idx, newSemok) => setBulkItems(bulkItems.map((r) => r._idx === idx ? { ...r, bimok: newSemok, matched: true } : r));
  const submitBulk = async () => {
    setBulkBusy(true);
    const entries = bulkItems.map(({ _idx, matched, ...r }) => ({ ...r, reg: "엑셀업로드" }));
    await addLedgerEntries(companyId, entries);
    setToast(`집행 ${entries.length}건이 등록되었습니다.`);
    setBulkItems([]); setBulkBusy(false);
  };
  const download = () => downloadXlsx("집행현황_" + new Date().toISOString().slice(0, 10) + ".xlsx", [["전표일자", "집행내역", "지급처", "집행액(원)", "비목", "재원", "증빙"], ...rows.map((r) => [r.date, r.desc, r.payee, r.amount, r.bimok, r.fund, (r.evidence_status || "미첨부")])]);
  const attach = async (id, file) => {
    await api.attachEvidence(id, file);
    await loadLedger(companyId);
    setToast("증빙이 첨부되었습니다.");
  };

  // 예산현황에서 설정한 세목 목록 (budgetTree 기반)
  const { budgetTrees, loadBudgetTree } = useApp();
  useEffect(() => { if (companyId) loadBudgetTree(companyId); }, [companyId, loadBudgetTree]);
  const tree = budgetTrees[companyId] || [];
  const treeGwamoks = [...new Set(tree.map((r) => r.gwamok).filter(Boolean))];
  const semokOptions = treeGwamoks.length > 0 ? treeGwamoks : Object.keys(SEMOK_TO_BIMOK);

  // 비목>세목 구조 (드롭다운에 비목 표시)
  const semokWithBimok = semokOptions.map((s) => {
    const row = tree.find((r) => r.gwamok === s);
    return { semok: s, bimok: row ? row.bimok : (SEMOK_TO_BIMOK[s] || "") };
  });

  // 개별등록 폼
  const [showForm, setShowForm] = useState(false);
  const [ef, setEf] = useState({ date: "2026-05-30", bimok: "", vendor: "", amount: "", desc: "" });
  useEffect(() => { if (semokWithBimok.length && !ef.bimok) setEf((p) => ({ ...p, bimok: semokWithBimok[0].semok })); }, [semokWithBimok.length]);
  const efOk = ef.vendor && ef.amount && ef.desc && ef.bimok;
  const submitSingle = async () => {
    await addLedgerEntries(companyId, [{ date: ef.date, description: ef.desc, payee: ef.vendor, amount: Number(ef.amount), bimok: ef.bimok, fund: "국비", reg: "직접등록" }]);
    setToast("집행내역이 등록되었습니다.");
    setEf({ ...ef, vendor: "", amount: "", desc: "" });
    setShowForm(false);
  };

  return <>
    <PageHead title="예산 집행 현황" actions={
      <div style={{ display: "flex", gap: 7 }}>
        <Btn kind="default" sm onClick={() => downloadXlsx(tmpl.name, tmpl.rows)}><Download size={13} /> 양식</Btn>
        <Btn kind="default" sm onClick={() => ref.current && ref.current.click()}><Upload size={13} /> 엑셀 업로드</Btn>
        <Btn kind="default" sm onClick={download}><Download size={13} /> 내보내기</Btn>
        <input ref={ref} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) parseXlsx(f, (rws) => { onUpload(rws); e.target.value = ""; }); }} />
        <Btn kind="primary" sm onClick={() => setShowForm(!showForm)}><PlusCircle size={13} /> {showForm ? "닫기" : "개별 등록"}</Btn>
      </div>} />

    {/* 개별등록 폼 */}
    {showForm && <Panel title="집행 개별등록" pad={false}>
      <div>
        {[
          ["집행일자", <input type="date" value={ef.date} onChange={(e) => setEf({ ...ef, date: e.target.value })} style={inp} />],
          ["세목", <select value={ef.bimok} onChange={(e) => setEf({ ...ef, bimok: e.target.value })} style={{ ...inp, minWidth: 200 }}>{semokWithBimok.map((s) => <option key={s.semok} value={s.semok}>{s.bimok} &gt; {s.semok}</option>)}</select>],
          ["집행내역", <input value={ef.desc} onChange={(e) => setEf({ ...ef, desc: e.target.value })} placeholder="집행 내용을 입력하세요" style={{ ...inp, width: "100%", maxWidth: 400 }} />],
          ["지급처", <input value={ef.vendor} onChange={(e) => setEf({ ...ef, vendor: e.target.value })} placeholder="(주)○○테크" style={{ ...inp, width: 200 }} />],
          ["집행액(원)", <input value={ef.amount ? Number(String(ef.amount).replace(/[^0-9]/g, "")).toLocaleString() : ""} onChange={(e) => setEf({ ...ef, amount: e.target.value.replace(/[^0-9]/g, "") })} placeholder="0" style={{ ...inp, width: 180, textAlign: "right", ...numCell }} />],
        ].map(([label, input], i, arr) => (
          <div key={label} style={{ display: "grid", gridTemplateColumns: "110px 1fr", borderBottom: i < arr.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
            <div style={{ background: "#F8F9FB", padding: "9px 12px", fontSize: 12.5, fontWeight: 700, color: C.text, borderRight: `1px solid ${C.lineSoft}`, display: "flex", alignItems: "center" }}>{label}</div>
            <div style={{ padding: "7px 12px", display: "flex", alignItems: "center" }}>{input}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 12px", borderTop: `1px solid ${C.lineSoft}` }}>
        <Btn kind="primary" disabled={!efOk} onClick={submitSingle}><Check size={13} /> 등록</Btn>
      </div>
    </Panel>}

    {/* 엑셀 일괄등록 미리보기 */}
    {bulkItems.length > 0 && <>
      {bulkUnmatched > 0 && <div style={{ background: C.amberLt, border: `1px solid ${C.amber}55`, borderRadius: 4, padding: "10px 16px", marginBottom: 14, fontSize: 13 }}>
        <div style={{ fontWeight: 700, color: C.amber }}>매칭 안 된 세목 {bulkUnmatched}건</div>
        <div style={{ fontSize: 12.5, color: C.text, marginTop: 4 }}>예산 현황에 등록되지 않은 세목입니다. 드롭다운에서 수정하거나 그대로 등록할 수 있습니다.</div>
      </div>}
      <Panel title="엑셀 업로드 미리보기" sub={`총 ${bulkItems.length}건${bulkUnmatched > 0 ? ` · 미매칭 ${bulkUnmatched}건` : ""}`} pad={false}
        extra={<div style={{ display: "flex", gap: 7 }}>
          <Btn kind="default" sm onClick={() => setBulkItems([])}>취소</Btn>
          <Btn kind="primary" sm disabled={bulkBusy} onClick={submitBulk}><Check size={13} /> {bulkBusy ? "등록 중..." : `${bulkItems.length}건 등록${bulkUnmatched > 0 ? " (경고 포함)" : ""}`}</Btn>
        </div>}>
        <TableWrap>
          <thead><tr>{["No", "전표일자", "집행내역", "지급처", "세목", "집행액(원)"].map((h, i) => <th key={h} style={th(i === 5 ? "right" : "left")}>{h}</th>)}</tr></thead>
          <tbody>{bulkItems.map((r) => (
            <tr key={r._idx} style={{ background: r.matched ? "transparent" : C.amberLt }}>
              <td style={{ ...td(), color: C.sub }}>{r._idx + 1}</td>
              <td style={{ ...td(), ...numCell }}>{r.date}</td>
              <td style={{ ...td(), fontWeight: 600 }}>{r.description}</td>
              <td style={td()}>{r.payee}</td>
              <td style={td()}>{r.matched
                ? <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: C.sub }}>{SEMOK_TO_BIMOK[r.bimok] || ""} &gt;</span>
                    <span style={{ fontWeight: 600 }}>{r.bimok}</span>
                  </span>
                : <select value={r.bimok} onChange={(e) => fixBulkSemok(r._idx, e.target.value)}
                    style={{ ...inp, borderColor: C.amber, minWidth: 180, padding: "4px 8px", fontSize: 12 }}>
                    <option value={r.bimok}>{r.bimok} (미매칭)</option>
                    {semokWithBimok.map((s) => <option key={s.semok} value={s.semok}>{s.bimok} &gt; {s.semok}</option>)}
                  </select>}</td>
              <td style={{ ...td("right"), ...numCell, fontWeight: 700 }}>{(r.amount || 0).toLocaleString()}</td>
            </tr>
          ))}</tbody>
        </TableWrap>
      </Panel>
    </>}

    {/* 증빙 첨부용 숨김 input */}
    <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f && target) attach(target, f); setTarget(null); e.target.value = ""; }} />

    <Panel title="집행 내역" sub={`총 ${rows.length}건 · 비목별 그룹 · 미첨부 ${rows.filter((r) => r.evidence_status !== "첨부" && r.evidence_status !== "검토완료").length}건`} pad={false}>
      <TableWrap>
        <thead><tr>{["전표일자", "집행내역", "지급처", "세목", "집행액(원)", "증빙"].map((h, i) => <th key={h} style={th(i === 4 ? "right" : "left")}>{h}</th>)}</tr></thead>
        <tbody>
          {byBimok.map(([bimok, items]) => {
            const bsum = items.reduce((a, x) => a + (x.amount || 0), 0);
            return <React.Fragment key={bimok}>
              <tr style={{ background: C.blueLt }}>
                <td style={{ ...td(), fontWeight: 800, color: C.blueDk }} colSpan={4}>{bimok}</td>
                <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: C.blueDk }}>{bsum.toLocaleString()}</td>
                <td style={td()} />
              </tr>
              {items.map((row) => (
                <tr key={row.id}>
                  <td style={{ ...td(), ...numCell, whiteSpace: "nowrap" }}>{row.date}</td>
                  <td style={{ ...td(), fontWeight: 600 }}>{row.desc}</td>
                  <td style={td()}>{row.payee}</td>
                  <td style={{ ...td(), color: C.sub }}>{row.bimok}</td>
                  <td style={{ ...td("right"), ...numCell, fontWeight: 700 }}>{(row.amount || 0).toLocaleString()}</td>
                  <td style={td()}>{(row.evidence_status === "첨부" || row.evidence_status === "검토완료")
                    ? <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: row.evidence_status === "검토완료" ? C.blue : C.green, fontWeight: 700 }}><Paperclip size={11} /> {row.evidence_status}</span>
                        {(row.evidenceFiles || []).map((ef, ei) => (
                          <a key={ei} href={ef.url || `/uploads/${ef.filename}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: C.blue, textDecoration: "underline" }}>{ef.original_name || ef.originalName || "파일"}</a>
                        ))}
                        <Btn kind="default" sm onClick={() => { setTarget(row.id); fileRef.current && fileRef.current.click(); }} style={{ marginLeft: 4 }}><Paperclip size={10} /> 추가</Btn>
                      </div>
                    : <Btn kind="default" sm onClick={() => { setTarget(row.id); fileRef.current && fileRef.current.click(); }}><Paperclip size={11} /> 첨부</Btn>}</td>
                </tr>
              ))}
            </React.Fragment>;
          })}
          <tr style={{ background: C.navy }}>
            <td style={{ ...td(), fontWeight: 800, color: "#fff", textAlign: "center" }} colSpan={4}>총 계</td>
            <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: "#fff" }}>{total.toLocaleString()}</td>
            <td style={td()} colSpan={1} />
          </tr>
        </tbody>
      </TableWrap>
    </Panel>
    {toast && <Toast text={toast} />}
  </>;
}

export function ManualForm({ companyId, onAdd }) {
  const { addLedgerEntries } = useApp();
  const [f, setF] = useState({ date: "2026-05-29", type: "세금계산서", bimok: "연구재료비", vendor: "", amount: "" });
  const [file, setFile] = useState(false);
  const [bulk, setBulk] = useState([]);
  const [busy, setBusy] = useState(false);
  const ok = f.vendor && f.amount && !busy;
  const row = { display: "grid", gridTemplateColumns: "120px 1fr", borderBottom: `1px solid ${C.lineSoft}` };
  const lbl = { background: "#F8F9FB", padding: "11px 14px", fontSize: 12.5, fontWeight: 700, color: C.text, display: "flex", alignItems: "center", borderRight: `1px solid ${C.lineSoft}` };
  const cell = { padding: "9px 14px", display: "flex", alignItems: "center" };
  const wide = { ...inp, width: "100%", maxWidth: 320 };
  const tmpl = { name: "사업비집행_일괄등록_양식.xlsx", rows: [["집행일자", "집행구분", "비목", "거래처", "집행금액(원)", "적요"], ["2026-05-30", "세금계산서", "연구재료비", "(주)예시상사", 1500000, "실험용 시약 구매"], ["2026-05-31", "계좌이체", "연구활동비", "한국정보과학회", 300000, "학술대회 등록비"]] };
  return <>
    {/* 엑셀 일괄등록 */}
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 3, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 16px", borderBottom: bulk.length ? `1px solid ${C.lineSoft}` : "none", background: "#F8F9FB" }}>
        <div style={{ fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 7 }}><Upload size={15} color={C.blue} /> 엑셀 일괄등록</div>
        <ExcelBulk template={tmpl} onRows={(rows) => setBulk(rows.slice(1).filter((r) => r[0] || r[3]).map((r) => ({ date: String(r[0] || ""), type: String(r[1] || "세금계산서"), bimok: String(r[2] || ""), vendor: String(r[3] || ""), amount: Number(String(r[4]).replace(/[^0-9]/g, "")) || 0, desc: String(r[5] || "") })))} />
      </div>
      {bulk.length > 0 && <div style={{ padding: 16 }}>
        <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 8 }}>업로드 미리보기 · 총 <b style={{ color: C.text }}>{bulk.length}건</b> · 합계 <b style={{ color: C.text }}>{won(bulk.reduce((a, b) => a + Math.round(b.amount / 1000), 0))}원</b></div>
        <TableWrap>
          <thead><tr>{["집행일", "구분", "비목", "거래처", "금액(원)", "적요"].map((h, i) => <th key={h} style={th(i === 4 ? "right" : "left")}>{h}</th>)}</tr></thead>
          <tbody>{bulk.map((b, i) => <tr key={i}><td style={{ ...td(), ...numCell }}>{b.date}</td><td style={td()}>{b.type}</td><td style={{ ...td(), fontWeight: 600 }}>{b.bimok}</td><td style={td()}>{b.vendor}</td><td style={{ ...td("right"), ...numCell, fontWeight: 700 }}>{b.amount.toLocaleString()}</td><td style={{ ...td(), color: C.sub }}>{b.desc}</td></tr>)}</tbody>
        </TableWrap>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 7, marginTop: 12 }}>
          <Btn kind="default" onClick={() => setBulk([])}>취소</Btn>
          <Btn kind="primary" onClick={async () => {
            setBusy(true);
            const entries = bulk.map((b) => ({ date: b.date, description: b.desc, payee: b.vendor, amount: b.amount, bimok: b.bimok, fund: "국비", reg: "엑셀업로드" }));
            await addLedgerEntries(companyId, entries);
            onAdd(`집행 ${bulk.length}건이 일괄 등록되었습니다.`); setBulk([]); setBusy(false);
          }}><Check size={14} /> {bulk.length}건 일괄 등록</Btn>
        </div>
      </div>}
    </div>

    {/* 개별 등록 */}
    <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>개별 등록</div>
    <div style={{ border: `1px solid ${C.line}`, borderTop: `2px solid ${C.blue}`, borderRadius: 2 }}>
      <div style={row}><div style={lbl}>집행일자</div><div style={cell}><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} style={inp} /></div></div>
      <div style={row}><div style={lbl}>집행구분</div><div style={cell}><select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} style={inp}><option>세금계산서</option><option>계좌이체</option><option>인건비 이체</option></select></div></div>
      <div style={row}><div style={lbl}>비목</div><div style={cell}><select value={f.bimok} onChange={(e) => setF({ ...f, bimok: e.target.value })} style={inp}>{BIMOK.map((b) => <option key={b.key}>{b.key}</option>)}</select></div></div>
      <div style={row}><div style={lbl}>거래처</div><div style={cell}><input value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} placeholder="(주)○○테크" style={wide} /></div></div>
      <div style={row}><div style={lbl}>집행금액(원)</div><div style={cell}><input value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value.replace(/[^0-9]/g, "") })} placeholder="0" style={{ ...wide, textAlign: "right" }} /></div></div>
      <div style={{ ...row, borderBottom: "none" }}><div style={lbl}>증빙</div><div style={cell}><Btn kind="default" onClick={() => setFile(!file)}>{file ? "첨부됨 ✓" : <><Paperclip size={13} /> 파일 첨부</>}</Btn></div></div>
    </div>
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}><Btn kind="primary" disabled={!ok} onClick={async () => {
      setBusy(true);
      await addLedgerEntries(companyId, [{ date: f.date, description: `[${f.type}] ${f.vendor}`, payee: f.vendor, amount: Number(f.amount), bimok: f.bimok, fund: "국비", reg: "직접등록" }]);
      onAdd("집행내역이 등록되었습니다.");
      setF({ ...f, vendor: "", amount: "" }); setBusy(false);
    }}>{busy ? "등록 중..." : "집행 등록"}</Btn></div>
  </>;
}

export function SettleView({ co, checks, onSubmit }) {
  const high = checks.filter((c) => c.sev === "high");
  const match = sum(co.exec) <= sum(co.budget);
  const items = [
    { t: "예산액·집행액 일치 확인", ok: match, d: match ? "일치" : "초과" },
    { t: "비목 초과집행 없음", ok: !checks.some((c) => c.rule === "비목 초과집행") },
    { t: "참여연구원 참여율 적정 (100% 이하)", ok: !checks.some((c) => c.rule === "참여율 초과") },
    { t: "미해결 보완 없음", ok: co.status !== "보완요청" },
  ];
  const canClose = items.every((c) => c.ok);
  return <>
    <Panel title="집행마감 전 점검" sub="마감 후에는 사업비를 사용할 수 없습니다" pad={false}>
      <TableWrap><thead><tr>{["점검 항목", "결과", "상태"].map((h) => <th key={h} style={th()}>{h}</th>)}</tr></thead>
        <tbody>{items.map((c, i) => <tr key={i}><td style={{ ...td(), fontWeight: 600 }}>{c.t}</td><td style={td()}>{c.d || "-"}</td><td style={td()}>{c.ok ? <Tag text="적합" color={C.green} /> : <Tag text="부적합" color={C.red} />}</td></tr>)}</tbody>
      </TableWrap>
    </Panel>
    <Panel title="사용실적보고서 제출">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontSize: 13, color: C.sub }}>신청 정산액(집행 기준) · <b style={{ color: C.text, fontSize: 17 }}>{won(sum(co.exec))}원</b></div>
        <div style={{ display: "flex", gap: 7 }}><Btn kind="default" disabled={!canClose}><Lock size={13} /> 집행마감</Btn><Btn kind="primary" disabled={!canClose} onClick={onSubmit}><Send size={13} /> 보고서 제출</Btn></div>
      </div>
      {!canClose && <div style={{ fontSize: 12.5, color: C.red, marginTop: 12 }}>점검 항목을 모두 해결해야 집행마감·제출이 가능합니다.</div>}
    </Panel>
  </>;
}

/* ═══════════ 관리자 ═══════════ */
export function AccountRegister({ registered, onRegistered, initialAcc, displayInfo }) {
  const ref = useRef(null);
  const [file, setFile] = useState(null);
  const [acc, setAcc] = useState(initialAcc || { bank: "", account: "", holder: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const pickFile = (f) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = String(e.target.result);
      setFile({ name: f.name, mime: f.type || "image/png", b64: dataUrl.split(",")[1], preview: (f.type || "").startsWith("image") ? dataUrl : null, raw: f });
      setErr("");
    };
    reader.readAsDataURL(f);
  };

  // 통장사본 OCR — Tesseract.js (브라우저 측 무료 OCR)
  const runOcr = async () => {
    if (!file) return;
    setLoading(true); setErr("");
    try {
      const Tesseract = await import("tesseract.js");
      const worker = await Tesseract.createWorker("kor+eng");
      const { data: { text } } = await worker.recognize(file.raw || file.preview);
      await worker.terminate();

      // 텍스트에서 계좌 정보 추출
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      let bank = "", account = "", holder = "";

      // 은행명 찾기
      const banks = ["국민은행", "신한은행", "우리은행", "하나은행", "농협은행", "농협", "기업은행", "SC제일은행", "카카오뱅크", "케이뱅크", "토스뱅크", "수협", "대구은행", "부산은행", "경남은행", "광주은행", "전북은행", "제주은행", "산업은행", "새마을금고", "신협", "우체국"];
      for (const line of lines) {
        for (const b of banks) { if (line.includes(b)) { bank = b; break; } }
        if (bank) break;
      }

      // 계좌번호 찾기 (숫자-숫자 패턴)
      const accMatch = text.match(/\d{2,6}[-\s]?\d{2,6}[-\s]?\d{2,6}[-\s]?\d{0,4}/);
      if (accMatch) account = accMatch[0].replace(/\s/g, "");

      // 예금주 찾기 (괄호 안 또는 "예금주" 다음)
      const holderMatch = text.match(/예금주[:\s]*([^\n]+)/) || text.match(/\(주\)[^\n]+/) || text.match(/주식회사\s*[^\n]+/);
      if (holderMatch) holder = holderMatch[1] ? holderMatch[1].trim() : holderMatch[0].trim();

      setAcc({ bank: bank || acc.bank, account: account || acc.account, holder: holder || acc.holder });
      if (!account && !bank) setErr("인식 결과가 부족합니다. 직접 수정해 주세요.");
    } catch (e) { console.error(e); setErr("OCR 인식에 실패했습니다. 직접 입력해 주세요."); }
    setLoading(false);
  };

  const ok = acc.bank && acc.account;
  const lbl = { background: "#F8F9FB", padding: "10px 14px", fontSize: 12.5, fontWeight: 700, color: C.text, borderRight: `1px solid ${C.lineSoft}`, display: "flex", alignItems: "center" };
  const row = { display: "grid", gridTemplateColumns: "110px 1fr", borderBottom: `1px solid ${C.lineSoft}` };
  const cell = { padding: "8px 14px", display: "flex", alignItems: "center" };

  if (registered) {
    const info = displayInfo || acc;
    return <div style={{ background: C.greenLt, border: `1px solid ${C.green}55`, borderRadius: 4, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 26, height: 26, borderRadius: 999, background: C.green, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800 }}>✓</div>
      <div style={{ fontSize: 13 }}><b style={{ color: C.green }}>사업비 계좌 등록 완료</b> <span style={{ color: C.text, marginLeft: 8 }}>{info.bank} {info.account} {info.holder && `(예금주 ${info.holder})`}</span></div>
    </div>;
  }

  return <>
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
      {/* 업로드 / 미리보기 */}
      <div style={{ width: 240, flexShrink: 0 }}>
        <div onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) pickFile(f); }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => ref.current && ref.current.click()}
          style={{ border: `2px dashed ${file && file.preview ? C.green : C.line}`, borderRadius: 6, height: 150, display: "grid", placeItems: "center", cursor: "pointer", background: "#FAFBFC", overflow: "hidden", transition: "all 0.15s" }}>
          {file && file.preview ? <img src={file.preview} alt="통장사본" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            : <div style={{ textAlign: "center", color: C.sub }}><Upload size={22} /><div style={{ fontSize: 12.5, marginTop: 6, fontWeight: 600 }}>통장사본 업로드</div><div style={{ fontSize: 11, marginTop: 2 }}>드래그하거나 클릭</div></div>}
        </div>
        <input ref={ref} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={(e) => pickFile(e.target.files && e.target.files[0])} />
        {file && <div style={{ fontSize: 11.5, color: C.sub, marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</div>}
        {/* OCR 버튼 — 추후 API 연동 시 활성화 */}
      </div>

      {/* 인식 결과 / 입력 */}
      <div style={{ flex: 1, minWidth: 240 }}>
        <div style={{ border: `1px solid ${C.line}`, borderTop: `2px solid ${C.blue}`, borderRadius: 2 }}>
          <div style={row}><div style={lbl}>은행명</div><div style={cell}><input value={acc.bank} onChange={(e) => setAcc({ ...acc, bank: e.target.value })} placeholder="예: 농협은행" style={{ ...inp, width: "100%", maxWidth: 240 }} /></div></div>
          <div style={row}><div style={lbl}>계좌번호</div><div style={cell}><input value={acc.account} onChange={(e) => setAcc({ ...acc, account: e.target.value })} placeholder="예: 301-0000-0000-00" style={{ ...inp, width: "100%", maxWidth: 240 }} /></div></div>
          <div style={{ ...row, borderBottom: "none" }}><div style={lbl}>예금주</div><div style={cell}><input value={acc.holder} onChange={(e) => setAcc({ ...acc, holder: e.target.value })} placeholder="예: (주)○○테크" style={{ ...inp, width: "100%", maxWidth: 240 }} /></div></div>
        </div>
        {err && <div style={{ fontSize: 12, color: C.red, marginTop: 8 }}>{err}</div>}
        <div style={{ fontSize: 12, color: C.sub, marginTop: 8 }}>통장사본을 업로드하고 계좌정보를 직접 입력하세요.</div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <Btn kind="primary" disabled={!ok} onClick={() => onRegistered(acc)}><Check size={14} /> 계좌 등록 완료</Btn>
        </div>
      </div>
    </div>
  </>;
}

export function InitialRegistration({ co, onDone }) {
  const STORAGE_KEY = `init-reg-${co.id}`;
  const makeInit = () => [{ id: "R1", name: co.pm || "", role: "연구책임자", position: "책임연구원", rate: 30, period: co.period, salary: true }];
  const makeEmpty = () => [{ id: "R1", name: "", role: "연구책임자", position: "", rate: 0, period: "", salary: true }];

  // localStorage에서 진행 상태 복원
  const [people, setPeople] = useState(() => {
    try { const s = localStorage.getItem(STORAGE_KEY + "-people"); if (s) return JSON.parse(s); } catch {}
    return makeInit();
  });
  const [acct, setAcct] = useState(() => localStorage.getItem(STORAGE_KEY + "-acct") === "true");
  const [acctInfo, setAcctInfo] = useState(() => {
    try { const s = localStorage.getItem(STORAGE_KEY + "-acct-info"); if (s) return JSON.parse(s); } catch {}
    return null;
  });
  const [acctResetKey, setAcctResetKey] = useState(0);

  // 변경시 localStorage에 저장
  useEffect(() => { localStorage.setItem(STORAGE_KEY + "-people", JSON.stringify(people)); }, [people]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY + "-acct", String(acct)); }, [acct]);
  useEffect(() => { if (acctInfo) localStorage.setItem(STORAGE_KEY + "-acct-info", JSON.stringify(acctInfo)); }, [acctInfo]);

  const clearStorage = () => {
    localStorage.removeItem(STORAGE_KEY + "-people");
    localStorage.removeItem(STORAGE_KEY + "-acct");
    localStorage.removeItem(STORAGE_KEY + "-acct-info");
  };

  const setP = (i, k, v) => setPeople(people.map((p, idx) => idx === i ? { ...p, [k]: v } : p));
  const addP = () => setPeople([...people, { id: "R" + (people.length + 1), name: "", role: "참여연구원", position: "연구원", rate: 0, period: co.period, salary: true }]);
  const delP = (i) => setPeople(people.filter((_, idx) => idx !== i));
  const resetAll = () => {
    if (!confirm("입력한 모든 정보를 초기화하시겠습니까?")) return;
    setPeople(makeEmpty());
    setAcct(false);
    setAcctInfo(null);
    setAcctResetKey((k) => k + 1);
    clearStorage();
  };
  const valid = people.some((p) => p.name) && acct;

  const steps = [
    { t: "참여연구원 등록", done: people.some((p) => p.name) },
    { t: "사업비 통장(계좌) 등록", done: acct },
  ];
  return <>
    <Panel title="초기 등록" sub="발급된 과제의 집행을 시작하기 위한 등록 절차입니다" extra={<Btn kind="danger" sm onClick={resetAll}><RotateCw size={12} /> 전체 초기화</Btn>}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", border: `1px solid ${s.done ? C.green + "55" : C.line}`, borderRadius: 4, background: s.done ? C.greenLt : "#fff", flex: 1, minWidth: 180 }}>
            <div style={{ width: 22, height: 22, borderRadius: 999, background: s.done ? C.green : C.line, color: "#fff", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800 }}>{s.done ? "✓" : i + 1}</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: s.done ? C.green : C.text }}>{s.t}</span>
          </div>
        ))}
      </div>
    </Panel>

    <Panel title="① 참여연구원 등록" sub="직접 입력 또는 엑셀 일괄등록" pad={false}
      extra={<div style={{ display: "flex", gap: 7 }}>
        <ExcelBulk template={{ name: "참여연구원_일괄등록_양식.xlsx", rows: [["성명", "역할", "직급", "참여율(%)", "인건비(현금/현물)", "참여기간"], ["홍길동", "연구책임자", "책임연구원", 30, "현금", co.period], ["김연구", "참여연구원", "선임연구원", 50, "현금", co.period]] }}
          onRows={(rows) => { const parsed = rows.slice(1).filter((r) => r[0]).map((r, i) => ({ id: "R" + (i + 1), name: String(r[0]), role: String(r[1] || "참여연구원"), position: String(r[2] || "연구원"), rate: Number(r[3]) || 0, salary: String(r[4] || "현금") !== "현물", period: String(r[5] || co.period) })); if (parsed.length) setPeople(parsed); }} />
        <Btn kind="default" sm onClick={addP}><UserPlus size={13} /> 연구원 추가</Btn>
      </div>}>
      <TableWrap>
        <thead><tr>{["성명", "역할", "직급", "참여율(%)", "인건비", "참여기간", ""].map((h, i) => <th key={h} style={th(i === 3 ? "right" : "left")}>{h}</th>)}</tr></thead>
        <tbody>
          {people.map((p, i) => <tr key={p.id}>
            <td style={td()}><input value={p.name} onChange={(e) => setP(i, "name", e.target.value)} placeholder="성명" style={{ ...inp, width: 90 }} /></td>
            <td style={td()}><select value={p.role} onChange={(e) => setP(i, "role", e.target.value)} style={{ ...inp, padding: "4px 6px" }}><option>연구책임자</option><option>참여연구원</option></select></td>
            <td style={td()}><input value={p.position} onChange={(e) => setP(i, "position", e.target.value)} style={{ ...inp, width: 90 }} /></td>
            <td style={td("right")}><input value={p.rate} onChange={(e) => setP(i, "rate", Number(e.target.value.replace(/[^0-9]/g, "")) || 0)} style={{ ...inp, width: 60, textAlign: "right", ...numCell }} /></td>
            <td style={td()}><select value={p.salary ? "현금" : "현물"} onChange={(e) => setP(i, "salary", e.target.value === "현금")} style={{ ...inp, padding: "4px 6px" }}><option>현금</option><option>현물</option></select></td>
            <td style={td()}><input value={p.period} onChange={(e) => setP(i, "period", e.target.value)} placeholder="2026-02-01 ~ 2026-11-30" style={{ ...inp, width: 170 }} /></td>
            <td style={td()}>{people.length > 1 && <Btn kind="danger" sm onClick={() => delP(i)}><Trash2 size={11} /></Btn>}</td>
          </tr>)}
        </tbody>
      </TableWrap>
    </Panel>

    <Panel title="② 사업비 계좌 등록" sub="통장사본 업로드 시 계좌정보 자동 인식(OCR)"
      extra={acct && <Btn kind="default" sm onClick={() => { setAcct(false); setAcctInfo(null); setAcctResetKey((k) => k + 1); }}><RotateCw size={12} /> 재등록</Btn>}>
      <AccountRegister key={acctResetKey} registered={acct} initialAcc={acctInfo} onRegistered={(acc) => { setAcct(true); setAcctInfo(acc); }} displayInfo={acctInfo} />
    </Panel>

    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
      {!valid && <span style={{ fontSize: 12.5, color: C.sub }}>참여연구원 1명 이상 등록 및 사업비 계좌 등록을 완료하세요.</span>}
      <Btn kind="primary" disabled={!valid} onClick={() => { onDone(people.filter((p) => p.name), acctInfo); clearStorage(); }}><Check size={14} /> 초기 등록 완료 · 집행 개시</Btn>
    </div>
  </>;
}

export function CompanyLogin({ companies, onLogin }) {
  const [mode, setMode] = useState("login");
  const accounts = companies; // 초대된 기업 계정(데모)
  return (
    <div style={{ flex: 1, width: "100%", minHeight: "calc(100vh - 52px)", display: "flex", alignItems: "flex-start", justifyContent: "center", background: C.bg, padding: "48px 20px" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>지원기업 연구비 포털</div>
          <div style={{ fontSize: 12.5, color: C.sub, marginTop: 4 }}>회원가입 후 본인 과제만 조회·관리할 수 있습니다</div>
        </div>
        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ display: "flex", borderBottom: `1px solid ${C.line}` }}>
            {[["login", "로그인"], ["signup", "회원가입"]].map(([k, l]) => (
              <button key={k} onClick={() => setMode(k)} style={{ flex: 1, padding: "12px 0", border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 700, background: mode === k ? "#fff" : "#F4F5F7", color: mode === k ? C.blue : C.sub, borderBottom: mode === k ? `2px solid ${C.blue}` : "2px solid transparent" }}>{l}</button>
            ))}
          </div>
          <div style={{ padding: 20 }}>
            {mode === "login" ? <>
              <input placeholder="아이디(이메일)" style={{ ...inp, width: "100%", marginBottom: 8, padding: "10px 12px" }} />
              <input placeholder="비밀번호" type="password" style={{ ...inp, width: "100%", marginBottom: 12, padding: "10px 12px" }} />
              <Btn kind="primary" onClick={() => accounts[0] && onLogin(accounts[0].id)}><Lock size={14} /> 로그인</Btn>
              <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px dashed ${C.line}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 8 }}>데모: 초대된 기업 계정으로 로그인</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }}>
                  {accounts.map((c) => (
                    <button key={c.id} onClick={() => onLogin(c.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", border: `1px solid ${C.line}`, borderRadius: 4, background: "#fff", cursor: "pointer", textAlign: "left" }}>
                      <span><b style={{ fontSize: 13 }}>{c.name}</b> <span style={{ fontSize: 11.5, color: C.sub }}>{c.id.toLowerCase()}@biz.co.kr</span></span>
                      <Status s={c.status} />
                    </button>
                  ))}
                </div>
              </div>
            </> : <>
              {["사업자등록번호", "기업명", "담당자명", "이메일(아이디)", "비밀번호"].map((p) => <input key={p} placeholder={p} style={{ ...inp, width: "100%", marginBottom: 8, padding: "10px 12px" }} />)}
              <Btn kind="primary"><UserPlus size={14} /> 회원가입 신청</Btn>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 10, lineHeight: 1.6 }}>가입 후 관리자가 발급한 과제와 매칭되면 본인 과제 현황이 활성화됩니다.</div>
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ 통장 관리 ═══════════ */

const MOCK_MONTHS = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"];

export function BankManager({ companyId }) {
  const { companies } = useApp();
  const co = companies.find((c) => c.id === companyId);
  const [bookImg, setBookImg] = useState(null);
  const [bookPreview, setBookPreview] = useState(null);
  const bookRef = useRef(null);
  const txRef = useRef(null);
  const [toast, setToast] = useState("");
  const [selMonth, setSelMonth] = useState("2026-05");
  const [txRecords, setTxRecords] = useState({});
  const [txImages, setTxImages] = useState({});

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 2800); return () => clearTimeout(t); } }, [toast]);

  const handleBookUpload = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setBookImg(f);
    setBookPreview(URL.createObjectURL(f));
    setToast("통장사본이 등록되었습니다.");
    e.target.value = "";
  };

  const handleTxUpload = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (f.name.endsWith(".xlsx") || f.name.endsWith(".xls") || f.name.endsWith(".csv")) {
      parseXlsx(f, (rows) => {
        const parsed = rows.slice(1).filter((r) => r[0]).map((r, i) => ({
          _id: "TX" + Date.now() + i,
          date: String(r[0] || ""),
          desc: String(r[1] || ""),
          deposit: Number(String(r[2] || "0").replace(/[^0-9]/g, "")) || 0,
          withdraw: Number(String(r[3] || "0").replace(/[^0-9]/g, "")) || 0,
          balance: Number(String(r[4] || "0").replace(/[^0-9]/g, "")) || 0,
          memo: String(r[5] || ""),
        }));
        setTxRecords((prev) => ({ ...prev, [selMonth]: parsed }));
        setToast(`${selMonth} 거래내역 ${parsed.length}건이 등록되었습니다.`);
      });
    } else {
      setTxImages((prev) => ({ ...prev, [selMonth]: [...(prev[selMonth] || []), { name: f.name, url: URL.createObjectURL(f) }] }));
      setToast(`${selMonth} 거래내역 이미지가 등록되었습니다.`);
    }
    e.target.value = "";
  };

  const curRecords = txRecords[selMonth] || [];
  const curImages = txImages[selMonth] || [];
  const totalDeposit = curRecords.reduce((a, r) => a + r.deposit, 0);
  const totalWithdraw = curRecords.reduce((a, r) => a + r.withdraw, 0);

  return <>
    <PageHead title="통장 관리" actions={
      <div style={{ display: "flex", gap: 7 }}>
        <Btn kind="default" sm onClick={() => downloadXlsx("통장거래내역_양식.xlsx", [["거래일", "적요", "입금(원)", "출금(원)", "잔액(원)", "비고"], ["2026-05-01", "사업비 입금", 50000000, 0, 50000000, "국비"], ["2026-05-03", "연구재료비", 0, 1500000, 48500000, ""]])}><Download size={13} /> 양식 다운로드</Btn>
      </div>
    } />

    {/* 사업비 통장사본 */}
    <Panel title="사업비 통장사본" sub="협약 시 등록한 사업비 전용계좌 통장사본">
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ width: 280, flexShrink: 0 }}>
          <div onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setBookImg(f); setBookPreview(URL.createObjectURL(f)); setToast("통장사본이 등록되었습니다."); } }}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => bookRef.current && bookRef.current.click()}
            style={{ border: `2px dashed ${bookPreview ? C.green : C.line}`, borderRadius: 8, height: 200, display: "grid", placeItems: "center", cursor: "pointer", background: bookPreview ? "#fff" : "#FAFBFC", overflow: "hidden", transition: "all 0.15s" }}>
            {bookPreview
              ? <img src={bookPreview} alt="통장사본" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              : <div style={{ textAlign: "center", color: C.sub }}>
                  <Upload size={24} style={{ marginBottom: 6 }} />
                  <div style={{ fontSize: 13, fontWeight: 700 }}>통장사본 업로드</div>
                  <div style={{ fontSize: 11.5, marginTop: 3 }}>드래그하거나 클릭</div>
                </div>}
          </div>
          <input ref={bookRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={handleBookUpload} />
          {bookImg && <div style={{ fontSize: 12, color: C.sub, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
            <Paperclip size={11} /> {bookImg.name}
          </div>}
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: C.text }}>계좌 정보</div>
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 4, overflow: "hidden" }}>
            {[["은행", co?.bankName || "-"], ["계좌번호", co?.bankAccount || "-"], ["예금주", co?.bankHolder || "-"], ["용도", "사업비 전용계좌"]].map(([label, val], i, arr) => (
              <div key={label} style={{ display: "grid", gridTemplateColumns: "100px 1fr", borderBottom: i < arr.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
                <div style={{ background: "#F8F9FB", padding: "9px 12px", fontSize: 12.5, fontWeight: 700, color: C.text, borderRight: `1px solid ${C.lineSoft}` }}>{label}</div>
                <div style={{ padding: "9px 12px", fontSize: 13, color: C.text }}>{val}</div>
              </div>
            ))}
          </div>
          {!bookPreview && <div style={{ marginTop: 10, padding: "10px 14px", background: C.amberLt, border: `1px solid ${C.amber}40`, borderRadius: 4, fontSize: 12.5, color: C.text }}>
            통장사본 이미지를 등록하면 관리자 검토 시 활용됩니다.
          </div>}
        </div>
      </div>
    </Panel>

    {/* 월별 통장거래 내역 */}
    <Panel title="월별 통장거래 내역" sub="매월 통장 거래내역을 엑셀 또는 이미지로 업로드" pad={false}
      extra={
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          <Btn kind="primary" sm onClick={() => txRef.current && txRef.current.click()}><Upload size={13} /> 업로드</Btn>
          <input ref={txRef} type="file" accept=".xlsx,.xls,.csv,image/*,.pdf" style={{ display: "none" }} onChange={handleTxUpload} />
        </div>
      }>

      {/* 월별 탭 */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.line}`, background: "#FAFBFC" }}>
        {MOCK_MONTHS.map((m) => {
          const hasData = (txRecords[m] && txRecords[m].length > 0) || (txImages[m] && txImages[m].length > 0);
          return <button key={m} onClick={() => setSelMonth(m)}
            style={{ padding: "10px 18px", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700,
              background: selMonth === m ? "#fff" : "transparent",
              color: selMonth === m ? C.blue : C.sub,
              borderBottom: selMonth === m ? `2.5px solid ${C.blue}` : "2.5px solid transparent",
              position: "relative" }}>
            {m.split("-")[1]}월
            {hasData && <span style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: 999, background: C.green }} />}
          </button>;
        })}
      </div>

      {/* 업로드된 이미지 미리보기 */}
      {curImages.length > 0 && <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.lineSoft}` }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Image size={14} color={C.blue} /> 거래내역 이미지 ({curImages.length}건)</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {curImages.map((img, i) => (
            <div key={i} style={{ width: 140, border: `1px solid ${C.line}`, borderRadius: 6, overflow: "hidden", cursor: "pointer" }}>
              <img src={img.url} alt={img.name} style={{ width: "100%", height: 90, objectFit: "cover" }} />
              <div style={{ padding: "4px 8px", fontSize: 11, color: C.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{img.name}</div>
            </div>
          ))}
        </div>
      </div>}

      {/* 엑셀 데이터 테이블 */}
      {curRecords.length > 0 ? <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0, borderBottom: `1px solid ${C.line}` }}>
          <div style={{ padding: "10px 16px", borderRight: `1px solid ${C.lineSoft}` }}>
            <div style={{ fontSize: 11.5, color: C.sub }}>입금 합계</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.blue }}>{totalDeposit.toLocaleString()}원</div>
          </div>
          <div style={{ padding: "10px 16px", borderRight: `1px solid ${C.lineSoft}` }}>
            <div style={{ fontSize: 11.5, color: C.sub }}>출금 합계</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.red }}>{totalWithdraw.toLocaleString()}원</div>
          </div>
          <div style={{ padding: "10px 16px" }}>
            <div style={{ fontSize: 11.5, color: C.sub }}>거래 건수</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{curRecords.length}건</div>
          </div>
        </div>
        <TableWrap>
          <thead><tr>{["거래일", "적요", "입금(원)", "출금(원)", "잔액(원)", "비고"].map((h, i) => <th key={h} style={th(i >= 2 && i <= 4 ? "right" : "left")}>{h}</th>)}</tr></thead>
          <tbody>
            {curRecords.map((r) => (
              <tr key={r._id}>
                <td style={{ ...td(), ...numCell, whiteSpace: "nowrap" }}>{r.date}</td>
                <td style={{ ...td(), fontWeight: 600 }}>{r.desc}</td>
                <td style={{ ...td("right"), ...numCell, color: r.deposit ? C.blue : C.faint, fontWeight: r.deposit ? 700 : 400 }}>{r.deposit ? r.deposit.toLocaleString() : "-"}</td>
                <td style={{ ...td("right"), ...numCell, color: r.withdraw ? C.red : C.faint, fontWeight: r.withdraw ? 700 : 400 }}>{r.withdraw ? r.withdraw.toLocaleString() : "-"}</td>
                <td style={{ ...td("right"), ...numCell, fontWeight: 700 }}>{r.balance.toLocaleString()}</td>
                <td style={{ ...td(), color: C.sub }}>{r.memo}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </> : <div style={{ padding: "32px 16px", textAlign: "center", color: C.sub }}>
        <Calendar size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
        <div style={{ fontSize: 13, fontWeight: 600 }}>{selMonth.replace("-", "년 ")}월 거래내역이 없습니다</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>엑셀 파일(.xlsx) 또는 통장 캡처 이미지를 업로드하세요</div>
      </div>}
    </Panel>
    {toast && <Toast text={toast} />}
  </>;
}

/* ═══════════ 회계검토 결과 (기업 열람) ═══════════ */

export function AuditResult({ companyId }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const reps = await api.listAuditReports();
        setReports(reps.filter((r) => (r.company_id || r.companyId) === companyId));
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [companyId]);

  if (loading) return <div style={{ padding: 24, color: C.sub }}>불러오는 중…</div>;

  const report = reports[0];

  return <>
    <PageHead title="회계검토 결과" />
    {!report ? (
      <Panel title="검토 결과">
        <div style={{ padding: "24px 0", textAlign: "center", color: C.sub }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>아직 회계검토가 완료되지 않았습니다</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>검토가 완료되면 결과가 여기에 표시됩니다.</div>
        </div>
      </Panel>
    ) : <>
      {report.status === "검토완료" && report.opinion === "적정" && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: C.greenLt, border: `1px solid ${C.green}55`, borderRadius: 4, marginBottom: 14, fontSize: 13, fontWeight: 700, color: C.green }}>
          <Check size={15} /> 검토 완료 — {report.opinion} 의견
        </div>
      )}
      {report.status === "보완필요" && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: C.redLt, border: `1px solid ${C.red}55`, borderRadius: 4, marginBottom: 14, fontSize: 13, fontWeight: 700, color: C.red }}>
          보완 필요 — {report.opinion} 의견
        </div>
      )}
      <Panel title="검토 내용">
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
          {[
            ["담당 회계사", report.auditorName || report.auditor_name || "-"],
            ["검토일", report.submitted_at || report.submittedAt || "-"],
            ["검토 의견", report.opinion || "-"],
            ["검토 요약", report.summary || "-"],
          ].map(([label, val], i, arr) => (
            <div key={label} style={{ display: "grid", gridTemplateColumns: "110px 1fr", borderBottom: i < arr.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
              <div style={{ background: "#F8F9FB", padding: "10px 14px", fontSize: 12.5, fontWeight: 700, borderRight: `1px solid ${C.lineSoft}` }}>{label}</div>
              <div style={{ padding: "10px 14px", fontSize: 13, color: label === "검토 의견" ? (val === "적정" ? C.green : C.red) : C.text, fontWeight: label === "검토 의견" ? 700 : 400 }}>{val}</div>
            </div>
          ))}
        </div>
        {(report.files || []).length > 0 && <>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.sub, marginBottom: 8 }}>보고서 파일</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {report.files.map((f, i) => (
              <a key={i} href={f.url || `/uploads/${f.filename}`} target="_blank" rel="noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 14px", border: `1px solid ${C.line}`, borderRadius: 4, fontSize: 13, background: "#fff", cursor: "pointer", textDecoration: "none", color: C.text }}>
                <FileText size={14} color={C.blue} /> {f.original_name || f.originalName || f.filename} <Download size={13} color={C.sub} />
              </a>
            ))}
          </div>
        </>}
      </Panel>
    </>}
  </>;
}

/* ═══════════════════ 연구비 사용기준 관리 ═══════════════════ */
const POLICY_STATUS_COLORS = { 등록: C.green, 기본적용: C.blue, 미등록: C.amber };
const DEFAULT_POLICY_ITEMS = [
  { item: "기관 자체 연구비 사용규정", content: "미등록 → 공무원 여비·집행 기준 자동 적용", status: "미등록" },
  { item: "국내출장 여비", content: "공무원 여비규정 준용 (일비·숙박비 상한)", status: "기본적용" },
  { item: "연구활동비 식비 한도", content: "1인 1식 기준 한도", status: "기본적용" },
  { item: "비목별 전용 한도", content: "비목 간 전용 시 협약변경 절차 적용", status: "기본적용" },
];

export function PolicyManager({ companyId, readOnly = false }) {
  const [items, setItems] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editRow, setEditRow] = useState({});
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState({ item: "", content: "", status: "등록" });
  const [toast, setToast] = useState("");
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const r = await api.getPolicy(companyId);
      setItems(r.items || []);
      setFiles(r.files || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [companyId]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 2500); return () => clearTimeout(t); } }, [toast]);

  const startEdit = (row) => { setEditId(row.id); setEditRow(row); };
  const saveEdit = async () => {
    try { await api.updatePolicyItem(companyId, editId, editRow); setToast("수정되었습니다"); setEditId(null); load(); } catch (e) { setToast("수정 실패: " + e.message); }
  };
  const removeItem = async (id) => {
    if (!confirm("이 기준 항목을 삭제하시겠습니까?")) return;
    try { await api.deletePolicyItem(companyId, id); setToast("삭제되었습니다"); load(); } catch (e) { setToast("삭제 실패: " + e.message); }
  };
  const addNew = async () => {
    if (!newRow.item || !newRow.content) return;
    try { await api.addPolicyItem(companyId, newRow); setToast("추가되었습니다"); setNewRow({ item: "", content: "", status: "등록" }); setAdding(false); load(); } catch (e) { setToast("추가 실패: " + e.message); }
  };
  const seedDefaults = async () => {
    if (!confirm("기본 기준 항목 4개를 일괄 등록하시겠습니까?")) return;
    for (const r of DEFAULT_POLICY_ITEMS) { try { await api.addPolicyItem(companyId, r); } catch (e) { console.error(e); } }
    setToast("기본 항목이 등록되었습니다"); load();
  };
  const onUpload = async (file) => {
    if (!file) return;
    try { await api.uploadPolicyFile(companyId, file); setToast("파일이 업로드되었습니다"); load(); } catch (e) { setToast("업로드 실패: " + e.message); }
  };
  const removeFile = async (id) => {
    if (!confirm("이 파일을 삭제하시겠습니까?")) return;
    try { await api.deletePolicyFile(companyId, id); setToast("삭제되었습니다"); load(); } catch (e) { setToast("삭제 실패: " + e.message); }
  };

  if (loading) return <div style={{ padding: 24, color: C.sub }}>불러오는 중…</div>;

  return <>
    {/* ① 자체 규정 파일 */}
    <Panel title="① 기관 자체 연구비 사용규정 (파일)" sub="PDF / HWPX / DOCX 등 자체규정 문서를 첨부하세요">
      {!readOnly && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onUpload(f); }}
          onClick={() => fileRef.current && fileRef.current.click()}
          style={{ border: `2px dashed ${C.line}`, borderRadius: 6, padding: "24px 20px", textAlign: "center", cursor: "pointer", background: "#FAFBFC", marginBottom: 12 }}>
          <Upload size={24} style={{ color: C.sub, marginBottom: 6 }} />
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>규정 파일 업로드</div>
          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 4 }}>드래그하거나 클릭 · PDF, HWPX, DOCX, DOC</div>
          <input ref={fileRef} type="file" accept=".pdf,.hwpx,.docx,.doc" style={{ display: "none" }} onChange={(e) => onUpload(e.target.files[0])} />
        </div>
      )}
      {files.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {files.map((f) => (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.greenLt, border: `1px solid ${C.green}40`, borderRadius: 4 }}>
              <FileText size={16} style={{ color: C.green }} />
              <a href={`/uploads/${f.filename}`} target="_blank" rel="noreferrer" style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.text, textDecoration: "none" }}>{f.original_name}</a>
              <div style={{ fontSize: 11.5, color: C.sub }}>{(f.size / 1024).toFixed(1)}KB · {(f.uploaded_at || "").slice(0, 10)}</div>
              <a href={`/uploads/${f.filename}`} download style={{ textDecoration: "none" }}><Btn kind="default" sm><Download size={11} /></Btn></a>
              {!readOnly && <Btn kind="danger" sm onClick={() => removeFile(f.id)}><Trash2 size={11} /></Btn>}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "10px 14px", background: C.amberLt, border: `1px solid ${C.amber}40`, borderRadius: 4, fontSize: 12.5 }}>
          ⓘ 자체규정 미등록 시 <b>공무원 여비·집행 기준이 자동 적용</b>됩니다.
        </div>
      )}
    </Panel>

    {/* ② 기준 항목 */}
    <Panel title="② 기준 항목 관리" sub="기관별 적용 기준을 추가/수정할 수 있습니다" pad={false}
      extra={!readOnly && <div style={{ display: "flex", gap: 6 }}>
        {items.length === 0 && <Btn kind="default" sm onClick={seedDefaults}>기본 항목 일괄 등록</Btn>}
        <Btn kind="primary" sm onClick={() => setAdding(true)}><PlusCircle size={12} /> 기준 추가</Btn>
      </div>}>
      {items.length === 0 && !adding ? (
        <div style={{ padding: "30px 16px", textAlign: "center", color: C.sub, fontSize: 13 }}>
          등록된 기준 항목이 없습니다. {!readOnly && "위의 [기본 항목 일괄 등록] 또는 [기준 추가] 버튼을 사용하세요."}
        </div>
      ) : (
        <TableWrap>
          <thead><tr>{["기준 항목", "적용 내용", "상태", ...(readOnly ? [] : ["관리"])].map((h) => <th key={h} style={th()}>{h}</th>)}</tr></thead>
          <tbody>
            {items.map((row) => editId === row.id ? (
              <tr key={row.id}>
                <td style={td()}><input value={editRow.item} onChange={(e) => setEditRow({ ...editRow, item: e.target.value })} style={{ ...inp, width: "100%" }} /></td>
                <td style={td()}><input value={editRow.content} onChange={(e) => setEditRow({ ...editRow, content: e.target.value })} style={{ ...inp, width: "100%" }} /></td>
                <td style={td()}>
                  <select value={editRow.status} onChange={(e) => setEditRow({ ...editRow, status: e.target.value })} style={{ ...inp, padding: "4px 6px" }}>
                    <option>등록</option><option>기본적용</option><option>미등록</option>
                  </select>
                </td>
                <td style={td()}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Btn kind="primary" sm onClick={saveEdit}><Check size={11} /></Btn>
                    <Btn kind="default" sm onClick={() => setEditId(null)}><X size={11} /></Btn>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={row.id}>
                <td style={{ ...td(), fontWeight: 700 }}>{row.item}</td>
                <td style={{ ...td(), color: C.text }}>{row.content}</td>
                <td style={td()}><Tag text={row.status} color={POLICY_STATUS_COLORS[row.status] || C.gray} /></td>
                {!readOnly && <td style={td()}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Btn kind="default" sm onClick={() => startEdit(row)}>수정</Btn>
                    <Btn kind="danger" sm onClick={() => removeItem(row.id)}><Trash2 size={11} /></Btn>
                  </div>
                </td>}
              </tr>
            ))}
            {adding && (
              <tr style={{ background: C.blueLt }}>
                <td style={td()}><input value={newRow.item} onChange={(e) => setNewRow({ ...newRow, item: e.target.value })} placeholder="예: 도서구입비 한도" style={{ ...inp, width: "100%" }} /></td>
                <td style={td()}><input value={newRow.content} onChange={(e) => setNewRow({ ...newRow, content: e.target.value })} placeholder="예: 1인 연 50만원" style={{ ...inp, width: "100%" }} /></td>
                <td style={td()}>
                  <select value={newRow.status} onChange={(e) => setNewRow({ ...newRow, status: e.target.value })} style={{ ...inp, padding: "4px 6px" }}>
                    <option>등록</option><option>기본적용</option><option>미등록</option>
                  </select>
                </td>
                <td style={td()}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Btn kind="primary" sm onClick={addNew}><Check size={11} /></Btn>
                    <Btn kind="default" sm onClick={() => { setAdding(false); setNewRow({ item: "", content: "", status: "등록" }); }}><X size={11} /></Btn>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </TableWrap>
      )}
    </Panel>
    {toast && <Toast text={toast} />}
  </>;
}
