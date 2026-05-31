import React, { useState } from "react";
import { PlusCircle, Trash2, X, Check, Info, FilePlus } from "lucide-react";
import { C, BIMOK_ORDER } from "../../lib/theme.js";
import { Tag, Btn, Panel, TableWrap, th, td, numCell, inp, Kpi } from "../common/ui.jsx";

// 재원 색상
const FUND_COLORS = {
  "기업지원비": C.blue,
  "민간현금": C.green,
  "민간현물": C.amber,
};
const FUND_KEYS = ["기업지원비", "민간현금", "민간현물"];
const FUND_LABELS = { "기업지원비": "기업지원비", "민간현금": "민간부담금(현금)", "민간현물": "민간부담금(현물)" };

export function FundingMockup() {
  const [tab, setTab] = useState("issue");

  const tabs = [
    { k: "issue", l: "1. 과제 발급" },
    { k: "home", l: "2. 과제 현황" },
    { k: "budget", l: "3. 예산 현황" },
    { k: "ledger", l: "4. 집행 등록" },
  ];

  return <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto", fontFamily: "Pretendard, sans-serif", background: "#F5F7FA", minHeight: "100vh" }}>
    <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>기업지원비 / 민간부담금 — 전체 목업 (3단계)</div>
    <div style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>과제 발급 → 과제 현황 → 예산 → 집행까지 재원 구분 적용</div>

    {/* 탭 */}
    <div style={{ display: "flex", gap: 6, borderBottom: `2px solid ${C.line}`, marginBottom: 20 }}>
      {tabs.map((t) => (
        <button key={t.k} onClick={() => setTab(t.k)} style={{
          padding: "10px 18px", border: "none", background: tab === t.k ? "#fff" : "transparent", cursor: "pointer",
          fontWeight: 700, fontSize: 13, color: tab === t.k ? C.blue : C.sub,
          borderBottom: tab === t.k ? `2.5px solid ${C.blue}` : "2.5px solid transparent", marginBottom: -2,
        }}>{t.l}</button>
      ))}
    </div>

    {tab === "issue" && <IssueMockup />}
    {tab === "home" && <HomeMockup />}
    {tab === "budget" && <BudgetMockup />}
    {tab === "ledger" && <LedgerMockup />}

    <div style={{ marginTop: 22, padding: "12px 16px", background: "#F8F9FB", border: `1px solid ${C.line}`, borderRadius: 4, fontSize: 12.5, color: C.sub }}>
      <b>구현 시 변경 요점:</b>
      <ul style={{ margin: "6px 0 0 18px", lineHeight: 1.7 }}>
        <li>companies 테이블에 <code>govt_fund</code>, <code>cash_fund</code>, <code>inkind_fund</code> 컬럼 추가</li>
        <li>budget_tree, ledger 테이블에 <code>fund_source</code> 컬럼 추가 (기업지원비/민간현금/민간현물)</li>
        <li>집행 시 재원 선택 필수, 재원별 잔액 초과 차단</li>
        <li>총사업비 = 3개 재원 합. 합 일치 검증 추가</li>
        <li>회계검토/정산 보고서에도 재원별 분리 표시</li>
      </ul>
    </div>
  </div>;
}

/* ═══ 1. 과제 발급 ═══ */
function IssueMockup() {
  const [govt, setGovt] = useState(80000000);
  const [cash, setCash] = useState(10000000);
  const [inkind, setInkind] = useState(10000000);
  const total = govt + cash + inkind;
  const matchRate = total > 0 ? Math.round((cash + inkind) / total * 100) : 0;

  return <>
    <Panel title="과제 발급 — 사업비 구성">
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
        {[
          ["과제명", <input defaultValue="AI 실증사업" style={{ ...inp, width: 240 }} />],
          ["회사명", <input defaultValue="(주)테스트테크" style={{ ...inp, width: 240 }} />],
          ["연구책임자", <input defaultValue="홍길동" style={{ ...inp, width: 140 }} />],
          ["협약기간", <input defaultValue="2026-01-01 ~ 2026-12-31" style={{ ...inp, width: 240 }} />],
        ].map(([k, v], i, arr) => (
          <div key={k} style={{ display: "grid", gridTemplateColumns: "140px 1fr", borderBottom: i < arr.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
            <div style={{ background: "#F8F9FB", padding: "9px 14px", fontSize: 12.5, fontWeight: 700, borderRight: `1px solid ${C.lineSoft}` }}>{k}</div>
            <div style={{ padding: "8px 14px" }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>사업비 구성 (원)</div>
      <div style={{ border: `2px solid ${C.blue}`, borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 160px", background: C.blueLt, padding: "10px 14px", borderBottom: `1px solid ${C.line}`, fontSize: 13 }}>
          <div style={{ fontWeight: 700, color: C.blueDk }}>기업지원비 (정부)</div>
          <div></div>
          <div style={{ textAlign: "right" }}>
            <input value={govt.toLocaleString()} onChange={(e) => setGovt(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
              style={{ ...inp, textAlign: "right", width: 150, fontWeight: 700, ...numCell }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 160px", padding: "10px 14px", borderBottom: `1px solid ${C.lineSoft}`, fontSize: 13 }}>
          <div style={{ fontWeight: 700, color: C.text, paddingLeft: 16 }}>└ 민간부담금(현금)</div>
          <div></div>
          <div style={{ textAlign: "right" }}>
            <input value={cash.toLocaleString()} onChange={(e) => setCash(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
              style={{ ...inp, textAlign: "right", width: 150, fontWeight: 700, ...numCell }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 160px", padding: "10px 14px", borderBottom: `2px solid ${C.line}`, fontSize: 13 }}>
          <div style={{ fontWeight: 700, color: C.text, paddingLeft: 16 }}>└ 민간부담금(현물)</div>
          <div></div>
          <div style={{ textAlign: "right" }}>
            <input value={inkind.toLocaleString()} onChange={(e) => setInkind(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
              style={{ ...inp, textAlign: "right", width: 150, fontWeight: 700, ...numCell }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 160px", padding: "12px 14px", background: C.navy, color: "#fff" }}>
          <div style={{ fontWeight: 800 }}>총사업비</div>
          <div></div>
          <div style={{ textAlign: "right", fontWeight: 800, fontSize: 15 }}>{total.toLocaleString()}원</div>
        </div>
      </div>

      <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.7 }}>
        ⓘ 민간부담금 비율(현금+현물): <b>{matchRate}%</b> · 사업기금 규정에 따라 최소 비율을 확인하세요.
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
        <Btn kind="primary"><FilePlus size={14} /> 협약 체결 · 과제 발급</Btn>
      </div>
    </Panel>
  </>;
}

/* ═══ 2. 과제 현황 ═══ */
function HomeMockup() {
  return <>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
      <Kpi label="총사업비" value="100,000,000" unit="원" sub="합산" accent={C.navy} />
      <Kpi label="기업지원비" value="80,000,000" unit="원" sub="정부" accent={C.blue} />
      <Kpi label="민간부담금(현금)" value="10,000,000" unit="원" sub="자부담" accent={C.green} />
      <Kpi label="민간부담금(현물)" value="10,000,000" unit="원" sub="자부담" accent={C.amber} />
    </div>

    <Panel title="재원별 집행 현황" sub="재원 구분별로 예산 · 집행 · 잔액 · 집행률" pad={false}>
      <TableWrap>
        <thead><tr>{["재원", "예산(원)", "집행(원)", "잔액(원)", "집행률"].map((h, i) => <th key={h} style={th(i ? "right" : "left")}>{h}</th>)}</tr></thead>
        <tbody>
          {[
            { f: "기업지원비", b: 80000000, e: 12000000, c: C.blue },
            { f: "민간현금", b: 10000000, e: 2000000, c: C.green },
            { f: "민간현물", b: 10000000, e: 5000000, c: C.amber },
          ].map((r) => {
            const rem = r.b - r.e, pct = Math.round(r.e / r.b * 100);
            return <tr key={r.f}>
              <td style={td()}><Tag text={FUND_LABELS[r.f]} color={r.c} /></td>
              <td style={{ ...td("right"), ...numCell, fontWeight: 700 }}>{r.b.toLocaleString()}</td>
              <td style={{ ...td("right"), ...numCell, fontWeight: 700 }}>{r.e.toLocaleString()}</td>
              <td style={{ ...td("right"), ...numCell }}>{rem.toLocaleString()}</td>
              <td style={{ ...td("right"), ...numCell, fontWeight: 700 }}>{pct}%</td>
            </tr>;
          })}
          <tr style={{ background: C.navy }}>
            <td style={{ ...td(), color: "#fff", fontWeight: 800 }}>합계 (총사업비)</td>
            <td style={{ ...td("right"), ...numCell, color: "#fff", fontWeight: 800 }}>100,000,000</td>
            <td style={{ ...td("right"), ...numCell, color: "#fff", fontWeight: 800 }}>19,000,000</td>
            <td style={{ ...td("right"), ...numCell, color: "#fff", fontWeight: 800 }}>81,000,000</td>
            <td style={{ ...td("right"), ...numCell, color: "#fff", fontWeight: 800 }}>19%</td>
          </tr>
        </tbody>
      </TableWrap>
    </Panel>
  </>;
}

/* ═══ 3. 예산 현황 ═══ */
function BudgetMockup() {
  const SAMPLE = [
    { bimok: "인건비", semok: "보수", sse: "기본급", fund: "기업지원비", budget: 50000000 },
    { bimok: "인건비", semok: "보수", sse: "수당", fund: "민간현금", budget: 5000000 },
    { bimok: "운영비", semok: "일반수용비", sse: "소모품비", fund: "기업지원비", budget: 20000000 },
    { bimok: "운영비", semok: "일반수용비", sse: "전문가활용비", fund: "민간현금", budget: 5000000 },
    { bimok: "운영비", semok: "장비", sse: "연구장비 임차", fund: "민간현물", budget: 10000000 },
    { bimok: "여비", semok: "출장", sse: "국내", fund: "기업지원비", budget: 10000000 },
  ];

  // 재원별 합산
  const byFund = SAMPLE.reduce((a, r) => { a[r.fund] = (a[r.fund] || 0) + r.budget; return a; }, {});
  const totalSum = Object.values(byFund).reduce((a, b) => a + b, 0);

  return <>
    <Panel title="비목/세목 + 재원 구분" sub="각 row마다 재원(기업지원비/민간현금/민간현물) 지정" pad={false}>
      <TableWrap>
        <thead><tr>{["비목", "세목", "세세목", "재원", "예산(원)", ""].map((h, i) => <th key={h} style={th(i === 4 ? "right" : "left")}>{h}</th>)}</tr></thead>
        <tbody>
          {SAMPLE.map((r, i) => (
            <tr key={i}>
              <td style={{ ...td(), fontWeight: 600 }}>{r.bimok}</td>
              <td style={td()}>{r.semok}</td>
              <td style={td()}>{r.sse}</td>
              <td style={td()}>
                <select defaultValue={r.fund} style={{ ...inp, padding: "3px 8px", fontSize: 12, fontWeight: 700, color: FUND_COLORS[r.fund], borderColor: FUND_COLORS[r.fund] }}>
                  {FUND_KEYS.map((f) => <option key={f} value={f}>{FUND_LABELS[f]}</option>)}
                </select>
              </td>
              <td style={{ ...td("right"), ...numCell, fontWeight: 700 }}>{r.budget.toLocaleString()}</td>
              <td style={td()}><button style={{ border: "none", background: "none", cursor: "pointer", color: C.faint }}><X size={14} /></button></td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Panel>

    {/* 재원별 합계 + 검증 */}
    <Panel title="재원별 편성 합계 vs 발급액" sub="발급된 사업비 구성과 비목 편성이 일치해야 합니다" pad>
      <TableWrap>
        <thead><tr>{["재원", "발급액(원)", "편성액(원)", "차액", "상태"].map((h, i) => <th key={h} style={th(i > 0 && i < 3 ? "right" : "left")}>{h}</th>)}</tr></thead>
        <tbody>
          {[
            { f: "기업지원비", issued: 80000000 },
            { f: "민간현금", issued: 10000000 },
            { f: "민간현물", issued: 10000000 },
          ].map((r) => {
            const plan = byFund[r.f] || 0, d = plan - r.issued, ok = d === 0;
            return <tr key={r.f}>
              <td style={td()}><Tag text={FUND_LABELS[r.f]} color={FUND_COLORS[r.f]} /></td>
              <td style={{ ...td("right"), ...numCell }}>{r.issued.toLocaleString()}</td>
              <td style={{ ...td("right"), ...numCell, fontWeight: 700 }}>{plan.toLocaleString()}</td>
              <td style={{ ...td("right"), ...numCell, fontWeight: 700, color: d === 0 ? C.sub : d > 0 ? C.red : C.amber }}>
                {d === 0 ? "-" : `${d > 0 ? "+" : ""}${d.toLocaleString()}`}
              </td>
              <td style={td()}>{ok ? <Tag text="일치" color={C.green} /> : <Tag text="불일치" color={C.red} />}</td>
            </tr>;
          })}
        </tbody>
      </TableWrap>
    </Panel>
  </>;
}

/* ═══ 4. 집행 등록 ═══ */
function LedgerMockup() {
  const SAMPLE = [
    { date: "2026-03-15", desc: "사무용품 구매", payee: "(주)오피스", bimok: "운영비", semok: "일반수용비", amount: 320000, fund: "기업지원비", ev: "검토완료" },
    { date: "2026-03-22", desc: "전문가 자문료", payee: "김전문", bimok: "운영비", semok: "일반수용비", amount: 500000, fund: "민간현금", ev: "첨부" },
    { date: "2026-04-01", desc: "장비 임차료", payee: "테크렌탈", bimok: "운영비", semok: "장비", amount: 1500000, fund: "민간현물", ev: "미첨부" },
  ];

  return <>
    {/* 신규 집행 등록 폼 */}
    <Panel title="신규 집행 등록" sub="재원을 반드시 선택하여 등록" pad>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>전표일자</div>
          <input type="date" defaultValue="2026-05-15" style={{ ...inp, width: "100%" }} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>비목</div>
          <select style={{ ...inp, width: "100%" }}><option>운영비</option><option>인건비</option><option>여비</option></select>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>세목</div>
          <input placeholder="예: 일반수용비" style={{ ...inp, width: "100%" }} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: C.red }}>재원 *</div>
          <select style={{ ...inp, width: "100%", borderColor: C.red, color: C.red, fontWeight: 700 }}>
            <option>(선택)</option>
            {FUND_KEYS.map((f) => <option key={f} value={f}>{FUND_LABELS[f]}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>집행내역</div>
          <input placeholder="집행 내용" style={{ ...inp, width: "100%" }} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>지급처</div>
          <input placeholder="지급처" style={{ ...inp, width: "100%" }} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>집행액(원)</div>
          <input placeholder="0" style={{ ...inp, width: "100%", textAlign: "right" }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <Btn kind="primary"><PlusCircle size={13} /> 집행 등록</Btn>
      </div>
    </Panel>

    {/* 집행 원장 */}
    <Panel title="집행 원장" sub="재원별 컬럼 추가" pad={false}>
      <TableWrap>
        <thead><tr>{["전표일자", "집행내역", "지급처", "비목", "재원", "집행액(원)", "증빙"].map((h, i) => <th key={h} style={th(i === 5 ? "right" : "left")}>{h}</th>)}</tr></thead>
        <tbody>
          {SAMPLE.map((r, i) => (
            <tr key={i}>
              <td style={{ ...td(), ...numCell, whiteSpace: "nowrap" }}>{r.date}</td>
              <td style={{ ...td(), fontWeight: 600 }}>{r.desc}</td>
              <td style={td()}>{r.payee}</td>
              <td style={{ ...td(), color: C.sub }}>{r.bimok}</td>
              <td style={td()}><Tag text={FUND_LABELS[r.fund]} color={FUND_COLORS[r.fund]} /></td>
              <td style={{ ...td("right"), ...numCell, fontWeight: 700 }}>{r.amount.toLocaleString()}</td>
              <td style={td()}><Tag text={r.ev} color={r.ev === "검토완료" ? C.blue : r.ev === "첨부" ? C.green : C.red} /></td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Panel>

    {/* 재원별 집행률 */}
    <Panel title="재원별 잔액 (실시간)" sub="집행 등록 시 재원별 잔액 부족하면 차단" pad>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { f: "기업지원비", b: 80000000, e: 320000 },
          { f: "민간현금", b: 10000000, e: 500000 },
          { f: "민간현물", b: 10000000, e: 1500000 },
        ].map((r) => {
          const rem = r.b - r.e, pct = Math.round(r.e / r.b * 100);
          return <div key={r.f} style={{ border: `1px solid ${FUND_COLORS[r.f]}55`, borderTop: `3px solid ${FUND_COLORS[r.f]}`, borderRadius: 4, padding: 14, background: "#fff" }}>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>{FUND_LABELS[r.f]}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: FUND_COLORS[r.f] }}>{rem.toLocaleString()}<span style={{ fontSize: 12, color: C.sub, marginLeft: 4 }}>원 잔액</span></div>
            <div style={{ marginTop: 8, height: 6, background: C.lineSoft, borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: FUND_COLORS[r.f] }} />
            </div>
            <div style={{ fontSize: 11.5, color: C.sub, marginTop: 4 }}>집행 {pct}% · 예산 {r.b.toLocaleString()}원</div>
          </div>;
        })}
      </div>
    </Panel>
  </>;
}
