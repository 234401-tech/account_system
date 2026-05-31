import React, { useState } from "react";
import { C } from "../../lib/theme.js";
import { Tag, Btn, Panel, TableWrap, th, td, numCell, Kpi, Status } from "../common/ui.jsx";
import { ChevronDown, Building2, FileText } from "lucide-react";

const mockProjects = [
  { id: "GB-2026-001", name: "AI 실증사업", status: "집행중", budget: 150000000, exec: 2000000 },
  { id: "GB-2026-005", name: "데이터 플랫폼 구축", status: "초기등록", budget: 80000000, exec: 0 },
  { id: "GB-2026-008", name: "스마트팩토리 고도화", status: "집행중", budget: 200000000, exec: 45000000 },
];

export function MultiProjectMockup() {
  const [option, setOption] = useState("A");
  const [selProject, setSelProject] = useState("GB-2026-001");

  return <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
    <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>1기업 다과제 — 목업</div>

    <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
      <button onClick={() => setOption("A")} style={{ padding: "10px 24px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13, background: option === "A" ? C.blue : C.line, color: option === "A" ? "#fff" : C.text }}>안 1: 1계정 다과제</button>
      <button onClick={() => setOption("B")} style={{ padding: "10px 24px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13, background: option === "B" ? C.blue : C.line, color: option === "B" ? "#fff" : C.text }}>안 3: 기업 그룹</button>
    </div>

    {/* 안 1: 1계정 다과제 — 상단에 과제 선택기 */}
    {option === "A" && <>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 14, padding: "10px 14px", background: C.blueLt, borderRadius: 4, border: `1px solid ${C.blue}33` }}>
        로그인 후 상단 또는 좌측에서 과제를 선택/전환합니다. 1개 계정으로 여러 과제를 관리합니다.
      </div>

      {/* 상단바 시뮬레이션 */}
      <div style={{ background: C.navy, padding: "10px 20px", borderRadius: "6px 6px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 4, background: C.blue, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 12, color: "#fff" }}>정</div>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>사업비 정산 모니터링</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* 과제 선택 드롭다운 */}
          <select value={selProject} onChange={(e) => setSelProject(e.target.value)}
            style={{ background: "#2A3845", border: "1px solid #3A4A5A", borderRadius: 4, padding: "5px 12px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {mockProjects.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
          </select>
          <span style={{ color: "#C9D2DA", fontSize: 12 }}>뉴로메카 담당자 님</span>
        </div>
      </div>

      {/* 선택된 과제 정보 */}
      <div style={{ border: "1px solid #ddd", borderTop: "none", borderRadius: "0 0 6px 6px", padding: 20, background: "#fff" }}>
        {(() => {
          const p = mockProjects.find((x) => x.id === selProject);
          return <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 16, fontWeight: 800 }}>{p.name}</span>
              <Status s={p.status} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 14 }}>
              <Kpi label="사업비" value={(p.budget / 100000000).toFixed(2)} unit="억원" accent={C.blue} />
              <Kpi label="집행액" value={(p.exec / 100000000).toFixed(2)} unit="억원" accent={C.green} />
              <Kpi label="집행률" value={p.budget ? Math.round(p.exec / p.budget * 100) : 0} unit="%" accent={C.amber} />
            </div>
            <div style={{ fontSize: 12.5, color: C.sub }}>과제를 전환하면 예산/집행/협약변경 등 모든 메뉴가 해당 과제 기준으로 전환됩니다.</div>
          </>;
        })()}
      </div>

      <div style={{ marginTop: 14 }}>
        <Panel title="내 과제 목록" sub={`${mockProjects.length}개 과제`} pad={false}>
          <TableWrap>
            <thead><tr>{["과제번호", "과제명", "사업비(원)", "집행률", "상태", ""].map((h, i) => <th key={h} style={th(i === 2 ? "right" : "left")}>{h}</th>)}</tr></thead>
            <tbody>
              {mockProjects.map((p) => (
                <tr key={p.id} style={{ background: p.id === selProject ? C.blueLt : "transparent" }}>
                  <td style={{ ...td(), ...numCell, color: C.sub }}>{p.id}</td>
                  <td style={{ ...td(), fontWeight: 700 }}>{p.name}</td>
                  <td style={{ ...td("right"), ...numCell }}>{p.budget.toLocaleString()}</td>
                  <td style={{ ...td(), ...numCell }}>{p.budget ? Math.round(p.exec / p.budget * 100) : 0}%</td>
                  <td style={td()}><Status s={p.status} /></td>
                  <td style={td()}><Btn kind={p.id === selProject ? "primary" : "default"} sm onClick={() => setSelProject(p.id)}>{p.id === selProject ? "현재" : "전환"}</Btn></td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Panel>
      </div>
    </>}

    {/* 안 3: 기업 그룹 */}
    {option === "B" && <>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 14, padding: "10px 14px", background: C.amberLt, borderRadius: 4, border: `1px solid ${C.amber}33` }}>
        기업 단위로 그룹을 만들고 그 안에 과제들을 넣습니다. 관리자가 기업 그룹에 과제를 배정합니다.
      </div>

      <Panel title="기업 그룹" sub="뉴로메카">
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
          {[
            ["기업명", "뉴로메카"],
            ["사업자번호", "123-45-67890"],
            ["담당자", "뉴로메카 담당자 (test@test.kr)"],
            ["연결 과제", `${mockProjects.length}개`],
          ].map(([k, v], i, arr) => (
            <div key={k} style={{ display: "grid", gridTemplateColumns: "120px 1fr", borderBottom: i < arr.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
              <div style={{ background: "#F8F9FB", padding: "9px 14px", fontSize: 12.5, fontWeight: 700, borderRight: `1px solid ${C.lineSoft}` }}>{k}</div>
              <div style={{ padding: "9px 14px", fontSize: 13 }}>{v}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="소속 과제" sub={`${mockProjects.length}개`} pad={false}>
        <TableWrap>
          <thead><tr>{["과제번호", "과제명", "사업비(원)", "집행률", "상태"].map((h, i) => <th key={h} style={th(i === 2 ? "right" : "left")}>{h}</th>)}</tr></thead>
          <tbody>
            {mockProjects.map((p) => (
              <tr key={p.id}>
                <td style={{ ...td(), ...numCell, color: C.sub }}>{p.id}</td>
                <td style={{ ...td(), fontWeight: 700 }}>{p.name}</td>
                <td style={{ ...td("right"), ...numCell }}>{p.budget.toLocaleString()}</td>
                <td style={{ ...td(), ...numCell }}>{p.budget ? Math.round(p.exec / p.budget * 100) : 0}%</td>
                <td style={td()}><Status s={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>

      <div style={{ marginTop: 14, fontSize: 12.5, color: C.sub, padding: "10px 14px", background: "#F8F9FB", borderRadius: 4, border: `1px solid ${C.line}` }}>
        <b>차이점:</b> 안 1은 DB 구조 변경 최소화 (users 테이블에 다대다 관계). 안 3은 company_groups 테이블을 추가하여 기업을 그룹으로 관리. 안 3이 체계적이지만 작업량이 더 큼.
      </div>
    </>}
  </div>;
}
