import React, { useState } from "react";
import { PlusCircle, Trash2, X, Check, Info } from "lucide-react";
import { C, BIMOK_ORDER } from "../../lib/theme.js";
import { Tag, Btn, Panel, TableWrap, th, td, numCell, inp } from "../common/ui.jsx";

// 시뮬레이션용 — 실제로는 budgetTree에서 가져옴
const INITIAL_ROWS = [
  { _id: "B1", _group: null, bimok: "총사업비", semok: "총사업비", sse: "총사업비", budget: 12345678 },
  { _id: "B2", _group: null, bimok: "인건비", semok: "보수", sse: "기본급", budget: 8000000 },
  { _id: "B3", _group: null, bimok: "인건비", semok: "보수", sse: "수당", budget: 2000000 },
  { _id: "B4", _group: null, bimok: "운영비", semok: "일반수용비", sse: "소모품비", budget: 1345678 },
  { _id: "B5", _group: null, bimok: "운영비", semok: "일반수용비", sse: "전문가활용비", budget: 1000000 },
];

export function AmendBudgetMockup() {
  // 변경(안): 현재 배정 + 사용자가 편집한 변경 후 값
  const [rows, setRows] = useState(INITIAL_ROWS.map((r) => ({ ...r, before: r.budget, after: r.budget })));

  const groupKey = (r) => r._group || r.bimok || "";

  const setAfter = (id, v) => setRows(rows.map((r) => r._id === id ? { ...r, after: v } : r));
  const setBimokName = (gk, name) => setRows(rows.map((r) => groupKey(r) === gk ? { ...r, bimok: name } : r));
  const setSemok = (id, k, v) => setRows(rows.map((r) => r._id === id ? { ...r, [k]: v } : r));

  const addBimok = () => {
    const gk = "G" + Date.now();
    setRows([...rows, { _id: "B" + Date.now(), _group: gk, bimok: "", semok: "", sse: "", before: 0, after: 0 }]);
  };
  const addSemok = (gk) => {
    const ref = rows.find((r) => groupKey(r) === gk);
    if (!ref) return;
    setRows([...rows, { _id: "B" + Date.now(), _group: ref._group, bimok: ref.bimok, semok: "", sse: "", before: 0, after: 0 }]);
  };
  const delRow = (id) => setRows(rows.filter((r) => r._id !== id));
  const delBimok = (gk) => { if (confirm("이 비목 전체를 삭제하시겠습니까?")) setRows(rows.filter((r) => groupKey(r) !== gk)); };

  // 그룹화
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

  // 검증
  const baseBefore = rows.filter((r) => r.bimok === "총사업비").reduce((a, x) => a + (x.before || 0), 0);
  const baseAfter = rows.filter((r) => r.bimok === "총사업비").reduce((a, x) => a + (x.after || 0), 0);
  const otherBefore = rows.filter((r) => r.bimok !== "총사업비").reduce((a, x) => a + (x.before || 0), 0);
  const otherAfter = rows.filter((r) => r.bimok !== "총사업비").reduce((a, x) => a + (x.after || 0), 0);
  const diff = baseAfter - otherAfter;

  return <div style={{ padding: 24, maxWidth: 1300, margin: "0 auto", fontFamily: "Pretendard, sans-serif", background: "#F5F7FA", minHeight: "100vh" }}>
    <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>협약변경 — 비목/세목별 사업비 변경(안) 목업</div>
    <div style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>예산 현황과 동일한 구조로 비목/세목 단위 변경 입력</div>

    {/* 검증 */}
    {diff !== 0 ? (
      <div style={{ background: C.redLt, border: `1px solid ${C.red}55`, borderRadius: 4, padding: "12px 16px", marginBottom: 14, fontSize: 13 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Info size={15} style={{ color: C.red }} />
          <b style={{ color: C.red }}>총사업비와 비목 합계가 일치하지 않습니다</b>
        </div>
        <div style={{ paddingLeft: 23, fontSize: 12.5, lineHeight: 1.7 }}>
          총사업비: <b>{baseAfter.toLocaleString()}원</b> · 비목 합계: <b>{otherAfter.toLocaleString()}원</b> ·
          차액: <b style={{ color: C.red }}>{diff > 0 ? "+" : ""}{diff.toLocaleString()}원</b>
        </div>
      </div>
    ) : (
      <div style={{ background: C.greenLt, border: `1px solid ${C.green}55`, borderRadius: 4, padding: "10px 14px", marginBottom: 14, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
        <Check size={15} style={{ color: C.green }} /> <b>총사업비와 비목 합계가 일치합니다.</b> ({baseAfter.toLocaleString()}원)
      </div>
    )}

    <Panel title="비목별 사업비 변경(안)" sub="현재 배정 ↔ 변경 후를 비교하면서 비목/세목 단위로 수정"
      extra={<Btn kind="primary" sm onClick={addBimok}><PlusCircle size={12} /> 비목 추가</Btn>} pad={false}>
      <TableWrap>
        <thead><tr>{["비목", "세목", "세세목", "현재 배정(원)", "변경 후(원)", "증감(원)", ""].map((h, i) => <th key={h} style={th(i >= 3 ? "right" : "left")}>{h}</th>)}</tr></thead>
        <tbody>
          {groups.map(([gk, group]) => {
            const items = group.items;
            const gBefore = items.reduce((a, x) => a + (x.before || 0), 0);
            const gAfter = items.reduce((a, x) => a + (x.after || 0), 0);
            const gDiff = gAfter - gBefore;
            const isBase = group.bimok === "총사업비";
            return <React.Fragment key={gk}>
              <tr style={{ background: isBase ? "#FFF8E1" : C.blueLt }}>
                <td style={{ ...td(), fontWeight: 800, color: isBase ? C.amber : C.blueDk }}>
                  {isBase ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      총사업비 <Tag text="기준" color={C.amber} />
                    </span>
                  ) : (
                    <input value={group.bimok} onChange={(e) => setBimokName(gk, e.target.value)} placeholder="비목명 입력"
                      style={{ ...inp, fontWeight: 800, color: C.blueDk, background: "transparent", border: "1px solid transparent", padding: "4px 6px", width: 130 }} />
                  )}
                </td>
                <td style={td()} colSpan={2}>
                  {!isBase && <Btn kind="default" sm onClick={() => addSemok(gk)}><PlusCircle size={11} /> 세목 추가</Btn>}
                </td>
                <td style={{ ...td("right"), ...numCell, fontWeight: 800 }}>{gBefore.toLocaleString()}</td>
                <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: isBase ? C.amber : C.text }}>{gAfter.toLocaleString()}</td>
                <td style={{ ...td("right"), ...numCell, fontWeight: 800, color: gDiff > 0 ? C.green : gDiff < 0 ? C.red : C.sub }}>{gDiff === 0 ? "-" : `${gDiff > 0 ? "+" : ""}${gDiff.toLocaleString()}`}</td>
                <td style={td()}>{!isBase && <button onClick={() => delBimok(gk)} title="비목 전체 삭제" style={{ border: "none", background: "none", cursor: "pointer", color: C.faint }}><Trash2 size={13} /></button>}</td>
              </tr>
              {items.map((row) => {
                const rDiff = (row.after || 0) - (row.before || 0);
                return <tr key={row._id} style={{ background: rDiff > 0 ? "rgba(40,167,69,0.04)" : rDiff < 0 ? "rgba(220,53,69,0.04)" : "transparent" }}>
                  <td style={td()} />
                  {isBase ? (
                    <>
                      <td style={{ ...td(), color: C.sub }}>{row.semok}</td>
                      <td style={{ ...td(), color: C.sub }}>{row.sse}</td>
                      <td style={{ ...td("right"), ...numCell, color: C.amber }}>{(row.before || 0).toLocaleString()}</td>
                      <td style={{ ...td("right"), ...numCell, color: C.amber, fontWeight: 700 }}>{(row.after || 0).toLocaleString()}</td>
                    </>
                  ) : (
                    <>
                      <td style={td()}><input value={row.semok} onChange={(e) => setSemok(row._id, "semok", e.target.value)} placeholder="세목" style={{ ...inp, width: 120, border: "1px solid transparent", background: "transparent" }} /></td>
                      <td style={td()}><input value={row.sse} onChange={(e) => setSemok(row._id, "sse", e.target.value)} placeholder="세세목" style={{ ...inp, width: 220, border: "1px solid transparent", background: "transparent" }} /></td>
                      <td style={{ ...td("right"), ...numCell, color: C.sub }}>{(row.before || 0).toLocaleString()}</td>
                      <td style={td("right")}>
                        <input value={(row.after || 0).toLocaleString()} onChange={(e) => setAfter(row._id, Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
                          style={{ ...inp, width: 130, textAlign: "right", ...numCell, fontWeight: 700 }} />
                      </td>
                    </>
                  )}
                  <td style={{ ...td("right"), ...numCell, fontWeight: 700, color: rDiff > 0 ? C.green : rDiff < 0 ? C.red : C.sub }}>{rDiff === 0 ? "-" : `${rDiff > 0 ? "+" : ""}${rDiff.toLocaleString()}`}</td>
                  <td style={td()}>{!isBase && <button onClick={() => delRow(row._id)} style={{ border: "none", background: "none", cursor: "pointer", color: C.faint }}><X size={13} /></button>}</td>
                </tr>;
              })}
            </React.Fragment>;
          })}
          {/* 합계 */}
          <tr style={{ background: C.navy }}>
            <td style={{ ...td(), color: "#fff", fontWeight: 800, textAlign: "center" }} colSpan={3}>합 계</td>
            <td style={{ ...td("right"), ...numCell, color: "#fff", fontWeight: 800 }}>{otherBefore.toLocaleString()}</td>
            <td style={{ ...td("right"), ...numCell, color: "#fff", fontWeight: 800 }}>{otherAfter.toLocaleString()}</td>
            <td style={{ ...td("right"), ...numCell, color: "#fff", fontWeight: 800 }}>{(otherAfter - otherBefore === 0) ? "-" : `${otherAfter - otherBefore > 0 ? "+" : ""}${(otherAfter - otherBefore).toLocaleString()}`}</td>
            <td style={{ ...td(), background: C.navy }} />
          </tr>
        </tbody>
      </TableWrap>
    </Panel>

    <div style={{ marginTop: 18, padding: "12px 16px", background: "#F8F9FB", border: `1px solid ${C.line}`, borderRadius: 4, fontSize: 12.5, color: C.sub }}>
      <b>설계 요점:</b>
      <ul style={{ margin: "6px 0 0 18px", lineHeight: 1.7 }}>
        <li>예산 현황과 동일한 비목/세목 트리 구조 사용 (budgetTree 그대로)</li>
        <li>각 row에 "현재 배정" + "변경 후" + "증감" 컬럼</li>
        <li>비목 추가 / 세목 추가 / 행 삭제 가능 — 총사업비는 잠금</li>
        <li>총사업비 ↔ 비목 합계 일치 여부 실시간 검증</li>
        <li>제출 시 변경 전/후 트리 전체를 협약변경 detail에 저장</li>
      </ul>
    </div>
  </div>;
}
