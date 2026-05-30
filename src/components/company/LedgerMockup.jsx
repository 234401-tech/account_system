import React, { useState } from "react";
import { C } from "../../lib/theme.js";
import { th, td, numCell, inp, Tag, Btn, Panel, TableWrap } from "../common/ui.jsx";
import { Check, AlertTriangle, ChevronDown } from "lucide-react";

const mockData = [
  { no: 1, date: "2026-05-01", desc: "AI 컨설팅 자문료", payee: "홍길동", amount: 500000, bimok: "전문가활용비", matched: true, parentBimok: "운영비" },
  { no: 2, date: "2026-05-03", desc: "사무용품 구입", payee: "(주)오피스", amount: 120000, bimok: "소모품비", matched: true, parentBimok: "운영비" },
  { no: 3, date: "2026-05-10", desc: "클라우드 서버 비용", payee: "AWS", amount: 3000000, bimok: "클라우드비", matched: false, parentBimok: "" },
  { no: 4, date: "2026-05-15", desc: "서울 출장비", payee: "김연구", amount: 150000, bimok: "국내여비", matched: true, parentBimok: "여비" },
  { no: 5, date: "2026-05-20", desc: "장비 수리비", payee: "(주)테크서비스", amount: 800000, bimok: "수리유지비", matched: false, parentBimok: "" },
];

const semokOptions = [
  { semok: "인건비", bimok: "인건비" },
  { semok: "소모품비", bimok: "운영비" },
  { semok: "도서인쇄비", bimok: "운영비" },
  { semok: "전문가활용비", bimok: "운영비" },
  { semok: "위탁용역비", bimok: "운영비" },
  { semok: "공과금", bimok: "운영비" },
  { semok: "임차료", bimok: "운영비" },
  { semok: "국내여비", bimok: "여비" },
  { semok: "국외여비", bimok: "여비" },
  { semok: "사업추진비", bimok: "업무추진비" },
  { semok: "기업지원", bimok: "민간위탁비" },
];

export function LedgerMockup() {
  const [option, setOption] = useState("A");
  const [items, setItems] = useState(mockData.map((d) => ({ ...d })));
  const unmatchedCount = items.filter((r) => !r.matched).length;

  const fixSemok = (no, newSemok) => {
    const opt = semokOptions.find((s) => s.semok === newSemok);
    setItems(items.map((r) => r.no === no ? { ...r, bimok: newSemok, matched: true, parentBimok: opt?.bimok || "" } : r));
  };

  return <div style={{ padding: 20 }}>
    <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>집행 일괄등록 — 매칭 실패 처리 목업</div>

    <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
      <button onClick={() => setOption("A")} style={{ padding: "10px 24px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 14, background: option === "A" ? C.blue : C.line, color: option === "A" ? "#fff" : C.text }}>안 1: 경고 후 등록</button>
      <button onClick={() => setOption("B")} style={{ padding: "10px 24px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 14, background: option === "B" ? C.blue : C.line, color: option === "B" ? "#fff" : C.text }}>안 3: 미리보기에서 수정</button>
    </div>

    {/* 안 1: 경고 표시 + 그대로 등록 */}
    {option === "A" && <>
      <div style={{ background: C.amberLt, border: `1px solid ${C.amber}55`, borderRadius: 4, padding: "10px 16px", marginBottom: 14, fontSize: 13 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: C.amber }}><AlertTriangle size={16} /> 매칭 안 된 세목 {unmatchedCount}건</div>
        <div style={{ fontSize: 12.5, color: C.text, marginTop: 4 }}>예산 현황에 등록되지 않은 세목입니다. 노란색 행을 확인하세요. 그대로 등록하거나 세목을 수정할 수 있습니다.</div>
      </div>

      <Panel title="업로드 미리보기" sub={`총 ${items.length}건 · 매칭실패 ${unmatchedCount}건`} pad={false} extra={
        <div style={{ display: "flex", gap: 7 }}>
          <Btn kind="default" sm>취소</Btn>
          <Btn kind="primary" sm><Check size={13} /> {items.length}건 등록 (경고 포함)</Btn>
        </div>
      }>
        <TableWrap>
          <thead><tr>{["No", "전표일자", "집행내역", "지급처", "세목", "집행액(원)", "상태"].map((h, i) => <th key={h} style={th(i === 5 ? "right" : "left")}>{h}</th>)}</tr></thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.no} style={{ background: r.matched ? "transparent" : C.amberLt }}>
                <td style={{ ...td(), color: C.sub }}>{r.no}</td>
                <td style={{ ...td(), ...numCell }}>{r.date}</td>
                <td style={{ ...td(), fontWeight: 600 }}>{r.desc}</td>
                <td style={td()}>{r.payee}</td>
                <td style={td()}>
                  <span style={{ fontWeight: 600, color: r.matched ? C.text : C.amber }}>{r.bimok}</span>
                  {!r.matched && <span style={{ fontSize: 11, color: C.red, marginLeft: 6 }}>매칭안됨</span>}
                </td>
                <td style={{ ...td("right"), ...numCell, fontWeight: 700 }}>{r.amount.toLocaleString()}</td>
                <td style={td()}>
                  {r.matched
                    ? <Tag text="매칭" color={C.green} />
                    : <Tag text="미매칭" color={C.amber} />}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>
    </>}

    {/* 안 3: 미리보기에서 드롭다운으로 수정 */}
    {option === "B" && <>
      {unmatchedCount > 0 && <div style={{ background: C.redLt, border: `1px solid ${C.red}55`, borderRadius: 4, padding: "10px 16px", marginBottom: 14, fontSize: 13 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: C.red }}><AlertTriangle size={16} /> 매칭 안 된 세목 {unmatchedCount}건 — 수정 필요</div>
        <div style={{ fontSize: 12.5, color: C.text, marginTop: 4 }}>빨간색 행의 세목을 드롭다운에서 선택하여 수정하세요. 모두 매칭되어야 등록할 수 있습니다.</div>
      </div>}

      {unmatchedCount === 0 && <div style={{ background: C.greenLt, border: `1px solid ${C.green}55`, borderRadius: 4, padding: "10px 16px", marginBottom: 14, fontSize: 13 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: C.green }}><Check size={16} /> 모든 세목이 매칭되었습니다</div>
      </div>}

      <Panel title="업로드 미리보기" sub={`총 ${items.length}건`} pad={false} extra={
        <div style={{ display: "flex", gap: 7 }}>
          <Btn kind="default" sm>취소</Btn>
          <Btn kind="primary" sm disabled={unmatchedCount > 0}><Check size={13} /> {unmatchedCount > 0 ? `${unmatchedCount}건 미매칭` : `${items.length}건 등록`}</Btn>
        </div>
      }>
        <TableWrap>
          <thead><tr>{["No", "전표일자", "집행내역", "지급처", "세목", "집행액(원)"].map((h, i) => <th key={h} style={th(i === 5 ? "right" : "left")}>{h}</th>)}</tr></thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.no} style={{ background: r.matched ? "transparent" : C.redLt }}>
                <td style={{ ...td(), color: C.sub }}>{r.no}</td>
                <td style={{ ...td(), ...numCell }}>{r.date}</td>
                <td style={{ ...td(), fontWeight: 600 }}>{r.desc}</td>
                <td style={td()}>{r.payee}</td>
                <td style={td()}>
                  {r.matched
                    ? <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: C.sub }}>{r.parentBimok} &gt;</span>
                        <span style={{ fontWeight: 600 }}>{r.bimok}</span>
                        <Check size={13} color={C.green} />
                      </span>
                    : <select value="" onChange={(e) => fixSemok(r.no, e.target.value)}
                        style={{ ...inp, borderColor: C.red, background: "#fff", minWidth: 180, padding: "5px 8px", fontSize: 12.5 }}>
                        <option value="" disabled>⚠ {r.bimok} → 세목 선택</option>
                        {semokOptions.map((s) => <option key={s.semok} value={s.semok}>{s.bimok} &gt; {s.semok}</option>)}
                      </select>}
                </td>
                <td style={{ ...td("right"), ...numCell, fontWeight: 700 }}>{r.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>
    </>}
  </div>;
}
