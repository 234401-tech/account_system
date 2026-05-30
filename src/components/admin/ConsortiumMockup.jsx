import React, { useState } from "react";
import { C } from "../../lib/theme.js";
import { th, td, numCell, inp, Tag, Btn, Panel, TableWrap } from "../common/ui.jsx";

export function ConsortiumMockup() {
  const [option, setOption] = useState("A");

  // 안 A: 라디오 버튼
  const [roleA, setRoleA] = useState("주관");

  // 안 B: 체크박스
  const [rolesB, setRolesB] = useState({ 주관: true, 참여: false });

  // 안 C: 드롭다운
  const [roleC, setRoleC] = useState("주관");

  const lbl = { background: "#F8F9FB", padding: "10px 14px", fontSize: 12.5, fontWeight: 700, color: C.text, borderRight: `1px solid ${C.lineSoft}`, display: "flex", alignItems: "center" };
  const row = { display: "grid", gridTemplateColumns: "120px 1fr", borderBottom: `1px solid ${C.lineSoft}` };
  const cell = { padding: "8px 14px", display: "flex", alignItems: "center", gap: 10 };

  return <div style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>
    <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>회사명 + 주관/참여 구분 — 목업</div>

    <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
      {[["A", "안 1: 라디오 버튼"], ["B", "안 2: 토글 태그"], ["C", "안 3: 드롭다운"]].map(([k, l]) => (
        <button key={k} onClick={() => setOption(k)} style={{ padding: "10px 20px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13, background: option === k ? C.blue : C.line, color: option === k ? "#fff" : C.text }}>{l}</button>
      ))}
    </div>

    {/* 안 A: 라디오 버튼 */}
    {option === "A" && <Panel title="과제 개별등록" sub="안 1: 회사명 옆 라디오 버튼">
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 4, overflow: "hidden" }}>
        <div style={row}>
          <div style={lbl}>지원기업명</div>
          <div style={cell}><input placeholder="예: (주)○○테크" style={{ ...inp, width: 200 }} /></div>
        </div>
        <div style={row}>
          <div style={lbl}>회사명</div>
          <div style={cell}>
            <input placeholder="예: POSTECH" style={{ ...inp, width: 200 }} />
            <div style={{ display: "flex", gap: 12, marginLeft: 8 }}>
              {["주관", "참여"].map((r) => (
                <label key={r} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer", fontWeight: roleA === r ? 700 : 400, color: roleA === r ? C.blue : C.text }}>
                  <input type="radio" name="roleA" checked={roleA === r} onChange={() => setRoleA(r)} style={{ accentColor: C.blue }} /> {r}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={{ ...row, borderBottom: "none" }}>
          <div style={lbl}>과제명</div>
          <div style={cell}><input placeholder="과제명을 입력하세요" style={{ ...inp, width: "100%", maxWidth: 400 }} /></div>
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 12.5, color: C.sub }}>
        결과 예시: <Tag text={roleA} color={roleA === "주관" ? C.blue : C.teal} />
      </div>
    </Panel>}

    {/* 안 B: 토글 태그 */}
    {option === "B" && <Panel title="과제 개별등록" sub="안 2: 회사명 옆 토글 태그">
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 4, overflow: "hidden" }}>
        <div style={row}>
          <div style={lbl}>지원기업명</div>
          <div style={cell}><input placeholder="예: (주)○○테크" style={{ ...inp, width: 200 }} /></div>
        </div>
        <div style={row}>
          <div style={lbl}>회사명</div>
          <div style={cell}>
            <input placeholder="예: POSTECH" style={{ ...inp, width: 200 }} />
            <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
              {["주관", "참여"].map((r) => {
                const on = rolesB[r];
                return <button key={r} onClick={() => setRolesB({ 주관: r === "주관", 참여: r === "참여" })}
                  style={{ padding: "4px 12px", borderRadius: 4, border: `1.5px solid ${on ? C.blue : C.line}`, background: on ? C.blueLt : "#fff", color: on ? C.blue : C.sub, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  {r}
                </button>;
              })}
            </div>
          </div>
        </div>
        <div style={{ ...row, borderBottom: "none" }}>
          <div style={lbl}>과제명</div>
          <div style={cell}><input placeholder="과제명을 입력하세요" style={{ ...inp, width: "100%", maxWidth: 400 }} /></div>
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 12.5, color: C.sub }}>
        결과 예시: <Tag text={rolesB["주관"] ? "주관" : "참여"} color={rolesB["주관"] ? C.blue : C.teal} />
      </div>
    </Panel>}

    {/* 안 C: 드롭다운 */}
    {option === "C" && <Panel title="과제 개별등록" sub="안 3: 회사명 옆 드롭다운">
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 4, overflow: "hidden" }}>
        <div style={row}>
          <div style={lbl}>지원기업명</div>
          <div style={cell}><input placeholder="예: (주)○○테크" style={{ ...inp, width: 200 }} /></div>
        </div>
        <div style={row}>
          <div style={lbl}>회사명</div>
          <div style={cell}>
            <input placeholder="예: POSTECH" style={{ ...inp, width: 200 }} />
            <select value={roleC} onChange={(e) => setRoleC(e.target.value)} style={{ ...inp, padding: "5px 10px", marginLeft: 8, fontWeight: 700, color: roleC === "주관" ? C.blue : C.teal }}>
              <option value="주관">주관</option>
              <option value="참여">참여</option>
            </select>
          </div>
        </div>
        <div style={{ ...row, borderBottom: "none" }}>
          <div style={lbl}>과제명</div>
          <div style={cell}><input placeholder="과제명을 입력하세요" style={{ ...inp, width: "100%", maxWidth: 400 }} /></div>
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 12.5, color: C.sub }}>
        결과 예시: <Tag text={roleC} color={roleC === "주관" ? C.blue : C.teal} />
      </div>
    </Panel>}

    {/* 엑셀 양식 미리보기 */}
    <Panel title="엑셀 양식 미리보기" sub="일괄등록 시" pad={false}>
      <TableWrap>
        <thead><tr>{["기업명", "회사명", "구분", "사업명", "과제명", "연구책임자", "사업비(원)"].map((h) => <th key={h} style={th()}>{h}</th>)}</tr></thead>
        <tbody>
          <tr>
            <td style={{ ...td(), fontWeight: 700 }}>(주)뉴로메카</td>
            <td style={td()}>POSTECH</td>
            <td style={td()}><Tag text="주관" color={C.blue} /></td>
            <td style={td()}>2026 AI 실증사업</td>
            <td style={td()}>로봇·AI 실증 고도화</td>
            <td style={td()}>김선모</td>
            <td style={{ ...td("right"), ...numCell }}>390,000,000</td>
          </tr>
          <tr>
            <td style={{ ...td(), fontWeight: 700 }}>(주)에이아이파크</td>
            <td style={td()}>금오공대</td>
            <td style={td()}><Tag text="참여" color={C.teal} /></td>
            <td style={td()}>2026 AI 실증사업</td>
            <td style={td()}>AI 클라우드 팜</td>
            <td style={td()}>이정안</td>
            <td style={{ ...td("right"), ...numCell }}>303,000,000</td>
          </tr>
        </tbody>
      </TableWrap>
    </Panel>
  </div>;
}
