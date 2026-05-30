import React, { useState } from "react";
import { C } from "../../lib/theme.js";
import { th, td, numCell, inp, Tag, Btn, Panel, TableWrap, Kpi, SearchBox, Field, PageHead } from "../common/ui.jsx";
import { Check, UserPlus, Trash2, Settings, Search, X, Shield, Building2, FileText } from "lucide-react";

const mockUsers = [
  { id: "U-ADMIN-001", name: "이승모", email: "admin@admin.kr", role: "admin", status: "활성", companyId: null, createdAt: "2026-01-01" },
  { id: "U-C-2026-001", name: "뉴로메카 담당자", email: "test@test.kr", role: "company", status: "활성", companyId: "C-2026-001", companyName: "뉴로메카", createdAt: "2026-01-15" },
  { id: "U-C-2026-002", name: "에이아이파크 담당자", email: "c-2026-002@biz.co.kr", role: "company", status: "활성", companyId: "C-2026-002", companyName: "에이아이파크", createdAt: "2026-01-20" },
  { id: "AUD-001", name: "김회계사", email: "kim@audit.kr", role: "auditor", status: "활성", createdAt: "2026-03-01" },
  { id: "AUD-002", name: "박회계사", email: "park@audit.kr", role: "auditor", status: "활성", createdAt: "2026-03-15" },
];

const mockSignupReqs = [
  { id: "SR-001", companyName: "(주)테스트기업", contactName: "홍길동", email: "hong@test.co.kr", bizNo: "123-45-67890", status: "대기", createdAt: "2026-05-28" },
  { id: "SR-002", companyName: "(주)AI솔루션", contactName: "김개발", email: "dev@ai.co.kr", bizNo: "987-65-43210", status: "대기", createdAt: "2026-05-29" },
];

const roleLabel = { admin: "관리자", company: "기업", auditor: "회계사" };
const roleColor = { admin: C.blue, company: C.teal, auditor: C.amber };

export function UsersMockup() {
  const [option, setOption] = useState("A");
  const [tab, setTab] = useState("list");
  const [filter, setFilter] = useState("전체");

  const filtered = filter === "전체" ? mockUsers : mockUsers.filter((u) => u.role === { 관리자: "admin", 기업: "company", 회계사: "auditor" }[filter]);

  return <div style={{ padding: 20, maxWidth: 1000, margin: "0 auto" }}>
    <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>회원관리 CMS — 목업</div>

    <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
      <button onClick={() => setOption("A")} style={{ padding: "10px 24px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13, background: option === "A" ? C.blue : C.line, color: option === "A" ? "#fff" : C.text }}>안 1: 관리자 포털 메뉴</button>
      <button onClick={() => setOption("B")} style={{ padding: "10px 24px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13, background: option === "B" ? C.blue : C.line, color: option === "B" ? "#fff" : C.text }}>안 2: 별도 CMS 페이지</button>
    </div>

    {/* 안 1: 관리자 포털 메뉴 */}
    {option === "A" && <>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 14, padding: "10px 14px", background: C.blueLt, borderRadius: 4, border: `1px solid ${C.blue}33` }}>
        관리자 포털 좌측 메뉴에 "회원관리" 메뉴가 추가됩니다. 기존 메뉴와 동일한 레이아웃.
      </div>

      <div style={{ display: "flex", borderBottom: `2px solid ${C.line}`, marginBottom: 14 }}>
        {[["list", "전체 계정"], ["signup", `가입 승인 (${mockSignupReqs.length})`], ["create", "계정 생성"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "10px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: tab === k ? "#fff" : "transparent", color: tab === k ? C.blue : C.sub, borderBottom: tab === k ? `2.5px solid ${C.blue}` : "2.5px solid transparent", marginBottom: -2 }}>{l}</button>
        ))}
      </div>

      {tab === "list" && <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
          <Kpi label="전체 계정" value={mockUsers.length} unit="명" accent={C.gray} />
          <Kpi label="관리자" value={mockUsers.filter((u) => u.role === "admin").length} unit="명" accent={C.blue} />
          <Kpi label="기업" value={mockUsers.filter((u) => u.role === "company").length} unit="명" accent={C.teal} />
          <Kpi label="회계사" value={mockUsers.filter((u) => u.role === "auditor").length} unit="명" accent={C.amber} />
        </div>
        <SearchBox>
          <Field label="역할"><select value={filter} onChange={(e) => setFilter(e.target.value)} style={inp}>{["전체", "관리자", "기업", "회계사"].map((f) => <option key={f}>{f}</option>)}</select></Field>
        </SearchBox>
        <Panel title="계정 목록" sub={`${filtered.length}명`} pad={false}>
          <TableWrap>
            <thead><tr>{["이름", "이메일", "역할", "연결 기업", "상태", "가입일", "관리"].map((h) => <th key={h} style={th()}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td style={{ ...td(), fontWeight: 700 }}>{u.name}</td>
                  <td style={{ ...td(), color: C.sub }}>{u.email}</td>
                  <td style={td()}><Tag text={roleLabel[u.role]} color={roleColor[u.role]} /></td>
                  <td style={td()}>{u.companyName || <span style={{ color: C.faint }}>-</span>}</td>
                  <td style={td()}><Tag text={u.status} color={u.status === "활성" ? C.green : C.red} /></td>
                  <td style={{ ...td(), ...numCell }}>{u.createdAt}</td>
                  <td style={td()}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Btn kind="default" sm><Settings size={11} /></Btn>
                      {u.role !== "admin" && <Btn kind="danger" sm><Trash2 size={11} /></Btn>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Panel>
      </>}

      {tab === "signup" && <>
        <Panel title="가입 승인 대기" sub={`${mockSignupReqs.length}건`} pad={false}>
          {mockSignupReqs.length === 0 ? <div style={{ padding: "24px 16px", textAlign: "center", color: C.sub }}>대기 중인 가입 신청이 없습니다.</div> :
          <TableWrap>
            <thead><tr>{["기업명", "담당자", "이메일", "사업자번호", "신청일", "처리"].map((h) => <th key={h} style={th()}>{h}</th>)}</tr></thead>
            <tbody>
              {mockSignupReqs.map((sr) => (
                <tr key={sr.id}>
                  <td style={{ ...td(), fontWeight: 700 }}>{sr.companyName}</td>
                  <td style={td()}>{sr.contactName}</td>
                  <td style={{ ...td(), color: C.sub }}>{sr.email}</td>
                  <td style={{ ...td(), ...numCell }}>{sr.bizNo}</td>
                  <td style={{ ...td(), ...numCell }}>{sr.createdAt}</td>
                  <td style={td()}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Btn kind="ok" sm><Check size={11} /> 승인</Btn>
                      <Btn kind="danger" sm><X size={11} /> 반려</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>}
        </Panel>
      </>}

      {tab === "create" && <>
        <Panel title="계정 생성" sub="관리자가 직접 계정을 생성합니다">
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 4, overflow: "hidden" }}>
            {[
              ["역할", <select style={inp}><option>기업</option><option>회계사</option><option>관리자</option></select>],
              ["이름", <input placeholder="홍길동" style={{ ...inp, width: 200 }} />],
              ["이메일", <input placeholder="user@email.com" style={{ ...inp, width: 300 }} />],
              ["비밀번호", <input type="password" placeholder="초기 비밀번호" style={{ ...inp, width: 200 }} />],
              ["연결 과제", <select style={{ ...inp, minWidth: 250 }}><option value="">선택 (기업 역할만)</option><option>C-2026-001 뉴로메카</option><option>C-2026-002 에이아이파크</option></select>],
            ].map(([label, input]) => (
              <div key={label} style={{ display: "grid", gridTemplateColumns: "110px 1fr", borderBottom: `1px solid ${C.lineSoft}` }}>
                <div style={{ background: "#F8F9FB", padding: "10px 14px", fontSize: 12.5, fontWeight: 700, borderRight: `1px solid ${C.lineSoft}` }}>{label}</div>
                <div style={{ padding: "8px 14px", display: "flex", alignItems: "center" }}>{input}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
            <Btn kind="primary"><UserPlus size={13} /> 계정 생성</Btn>
          </div>
        </Panel>
      </>}
    </>}

    {/* 안 2: 별도 CMS 페이지 */}
    {option === "B" && <>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 14, padding: "10px 14px", background: C.amberLt, borderRadius: 4, border: `1px solid ${C.amber}33` }}>
        상단 토글에 "CMS" 버튼이 추가됩니다. 관리자/기업/회계사와 별도의 독립 페이지.
      </div>

      <div style={{ background: C.navy, color: "#fff", padding: "12px 20px", borderRadius: "6px 6px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 4, background: C.blue, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 12 }}>C</div>
          <span style={{ fontWeight: 800, fontSize: 14 }}>회원관리 CMS</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#9AA6B2" }}>이승모 관리자</span>
          <button style={{ background: "none", border: "1px solid #3A4A5A", borderRadius: 4, padding: "4px 10px", color: "#9AA6B2", fontSize: 11, cursor: "pointer" }}>돌아가기</button>
        </div>
      </div>
      <div style={{ border: `1px solid ${C.line}`, borderTop: "none", borderRadius: "0 0 6px 6px", padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 20 }}>
          {/* 좌측 메뉴 */}
          <div>
            {[
              { icon: <Shield size={14} />, label: "전체 계정", active: true },
              { icon: <UserPlus size={14} />, label: "가입 승인 (2)" },
              { icon: <Building2 size={14} />, label: "기업 계정" },
              { icon: <FileText size={14} />, label: "회계사 계정" },
              { icon: <Settings size={14} />, label: "시스템 설정" },
            ].map((m, i) => (
              <div key={i} style={{ padding: "10px 14px", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: "pointer", background: m.active ? C.blueLt : "transparent", color: m.active ? C.blue : C.sub, borderLeft: m.active ? `3px solid ${C.blue}` : "3px solid transparent", display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                {m.icon} {m.label}
              </div>
            ))}
          </div>
          {/* 우측 내용 */}
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
              <Kpi label="전체" value={5} unit="명" accent={C.gray} />
              <Kpi label="관리자" value={1} unit="명" accent={C.blue} />
              <Kpi label="기업" value={2} unit="명" accent={C.teal} />
              <Kpi label="회계사" value={2} unit="명" accent={C.amber} />
            </div>
            <Panel title="계정 목록" pad={false}>
              <TableWrap>
                <thead><tr>{["이름", "이메일", "역할", "상태"].map((h) => <th key={h} style={th()}>{h}</th>)}</tr></thead>
                <tbody>
                  {mockUsers.slice(0, 3).map((u) => (
                    <tr key={u.id}>
                      <td style={{ ...td(), fontWeight: 700 }}>{u.name}</td>
                      <td style={{ ...td(), color: C.sub }}>{u.email}</td>
                      <td style={td()}><Tag text={roleLabel[u.role]} color={roleColor[u.role]} /></td>
                      <td style={td()}><Tag text="활성" color={C.green} /></td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </Panel>
          </div>
        </div>
      </div>
    </>}
  </div>;
}
