import React, { useState } from "react";
import { C } from "../../lib/theme.js";
import { Tag } from "./ui.jsx";
import { Bell, Check, FileText, Users, CreditCard, ClipboardList } from "lucide-react";

const mockNotifications = [
  { id: 1, type: "amend", title: "협약변경 승인", message: "사업비 변경 신청(GB-2026-0520-1)이 승인되었습니다.", date: "2026-05-30 14:30", read: false, icon: FileText, color: C.green },
  { id: 2, type: "amend", title: "협약변경 반려", message: "연구기간 변경 신청이 반려되었습니다. 사유: 사유 불충분", date: "2026-05-29 11:20", read: false, icon: FileText, color: C.red },
  { id: 3, type: "signup", title: "가입 승인 대기", message: "(주)테스트기업 홍길동님이 가입을 신청했습니다.", date: "2026-05-28 09:15", read: false, icon: Users, color: C.amber },
  { id: 4, type: "audit", title: "회계검토 완료", message: "뉴로메카 회계검토가 완료되었습니다. 의견: 적정", date: "2026-05-27 16:40", read: true, icon: ClipboardList, color: C.blue },
  { id: 5, type: "exec", title: "증빙 미첨부", message: "뉴로메카 3건의 전표에 증빙이 미첨부입니다.", date: "2026-05-26 10:00", read: true, icon: CreditCard, color: C.amber },
  { id: 6, type: "exec", title: "집행 등록", message: "뉴로메카에서 5건의 집행내역을 등록했습니다.", date: "2026-05-25 15:30", read: true, icon: CreditCard, color: C.green },
  { id: 7, type: "signup", title: "가입 완료", message: "(주)AI솔루션 계정이 자동 매칭되었습니다.", date: "2026-05-24 11:00", read: true, icon: Users, color: C.green },
  { id: 8, type: "amend", title: "협약변경 신청", message: "에이아이파크에서 참여연구원 변경을 신청했습니다.", date: "2026-05-23 09:45", read: true, icon: FileText, color: C.blue },
  { id: 9, type: "audit", title: "회계검토 배정", message: "비전테크놀로지가 김회계사에게 배정되었습니다.", date: "2026-05-22 14:20", read: true, icon: ClipboardList, color: C.teal },
];

const tabs = [
  { k: "all", l: "전체" },
  { k: "amend", l: "협약변경" },
  { k: "exec", l: "집행" },
  { k: "audit", l: "회계검토" },
  { k: "signup", l: "가입" },
];

export function NotificationMockup() {
  const [view, setView] = useState("dropdown");
  const [notifs, setNotifs] = useState(mockNotifications);
  const [tab, setTab] = useState("all");
  const unread = notifs.filter((n) => !n.read).length;

  const markRead = (id) => setNotifs(notifs.map((n) => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifs(notifs.map((n) => ({ ...n, read: true })));

  const filtered = tab === "all" ? notifs : notifs.filter((n) => n.type === tab);
  const tabUnread = (k) => notifs.filter((n) => !n.read && (k === "all" || n.type === k)).length;

  return <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
    <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>알림 + 서버 로그 — 목업</div>

    <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
      {[["dropdown", "알림 드롭다운"], ["log", "서버 로그"]].map(([k, l]) => (
        <button key={k} onClick={() => setView(k)} style={{ padding: "10px 24px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13, background: view === k ? C.blue : C.line, color: view === k ? "#fff" : C.text }}>{l}</button>
      ))}
    </div>

    {/* 알림 드롭다운 */}
    {view === "dropdown" && <>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 14 }}>상단바의 벨 아이콘을 클릭하면 아래와 같은 드롭다운이 표시됩니다.</div>

      {/* 상단바 시뮬레이션 */}
      <div style={{ background: C.navy, padding: "10px 20px", borderRadius: "6px 6px 0 0", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16 }}>
        <div style={{ position: "relative", cursor: "pointer" }}>
          <Bell size={20} color="#B5C0CB" />
          {unread > 0 && <span style={{ position: "absolute", top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 999, background: C.red, color: "#fff", fontSize: 10, fontWeight: 800, display: "grid", placeItems: "center", padding: "0 4px" }}>{unread}</span>}
        </div>
        <span style={{ color: "#C9D2DA", fontSize: 13 }}>최고관리자 님</span>
      </div>

      {/* 드롭다운 패널 */}
      <div style={{ border: `1px solid ${C.line}`, borderTop: "none", borderRadius: "0 0 6px 6px", background: "#fff", maxWidth: 420, marginLeft: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${C.lineSoft}` }}>
          <span style={{ fontSize: 14, fontWeight: 800 }}>알림 {unread > 0 && <span style={{ color: C.red, fontSize: 12 }}>{unread}건</span>}</span>
          <button onClick={markAllRead} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.blue, fontWeight: 600 }}>모두 읽음</button>
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", borderBottom: `1px solid ${C.lineSoft}`, background: "#FAFBFC" }}>
          {tabs.map((t) => {
            const cnt = tabUnread(t.k);
            return <button key={t.k} onClick={() => setTab(t.k)}
              style={{ flex: 1, padding: "8px 0", border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 700,
                background: tab === t.k ? "#fff" : "transparent",
                color: tab === t.k ? C.blue : C.sub,
                borderBottom: tab === t.k ? `2px solid ${C.blue}` : "2px solid transparent",
                position: "relative" }}>
              {t.l}
              {cnt > 0 && <span style={{ marginLeft: 3, fontSize: 10, color: C.red, fontWeight: 800 }}>{cnt}</span>}
            </button>;
          })}
        </div>

        {/* 알림 목록 */}
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          {filtered.length === 0 && <div style={{ padding: "24px 16px", textAlign: "center", color: C.sub, fontSize: 13 }}>알림이 없습니다.</div>}
          {filtered.map((n) => {
            const Icon = n.icon;
            return <div key={n.id} onClick={() => markRead(n.id)} style={{ display: "flex", gap: 10, padding: "11px 16px", borderBottom: `1px solid ${C.lineSoft}`, cursor: "pointer", background: n.read ? "#fff" : C.blueLt }}>
              <div style={{ width: 30, height: 30, borderRadius: 999, background: `${n.color}18`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Icon size={15} color={n.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{n.title}</span>
                  {!n.read && <span style={{ width: 7, height: 7, borderRadius: 999, background: C.blue, flexShrink: 0 }} />}
                </div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2, lineHeight: 1.4 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: C.faint, marginTop: 3 }}>{n.date}</div>
              </div>
            </div>;
          })}
        </div>
      </div>
    </>}

    {/* 서버 로그 */}
    {view === "log" && <>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 14 }}>서버 콘솔에 아래와 같은 로그가 기록됩니다. 파일로도 저장됩니다.</div>

      <div style={{ background: "#1a1a2e", borderRadius: 6, padding: 16, fontFamily: "Consolas, monospace", fontSize: 12, lineHeight: 1.8, color: "#e0e0e0", maxHeight: 400, overflowY: "auto" }}>
        <div><span style={{ color: "#888" }}>2026-05-30 14:30:12</span> <span style={{ color: "#4CAF50" }}>INFO</span>  <span style={{ color: "#90CAF9" }}>POST</span> /api/auth/login <span style={{ color: "#4CAF50" }}>200</span> - admin@ptp.or.kr (master)</div>
        <div><span style={{ color: "#888" }}>2026-05-30 14:30:13</span> <span style={{ color: "#4CAF50" }}>INFO</span>  <span style={{ color: "#90CAF9" }}>GET</span>  /api/companies <span style={{ color: "#4CAF50" }}>200</span> - 7 items</div>
        <div><span style={{ color: "#888" }}>2026-05-30 14:31:05</span> <span style={{ color: "#4CAF50" }}>INFO</span>  <span style={{ color: "#90CAF9" }}>POST</span> /api/amendments <span style={{ color: "#4CAF50" }}>201</span> - GB-2026-0530-1 created</div>
        <div><span style={{ color: "#888" }}>2026-05-30 14:31:06</span> <span style={{ color: "#4CAF50" }}>INFO</span>  <span style={{ color: "#FFA726" }}>POST</span> /api/ledger/L001/evidence <span style={{ color: "#4CAF50" }}>201</span> - file: receipt.pdf</div>
        <div><span style={{ color: "#888" }}>2026-05-30 14:32:20</span> <span style={{ color: "#4CAF50" }}>INFO</span>  <span style={{ color: "#90CAF9" }}>POST</span> /api/auth/login <span style={{ color: "#4CAF50" }}>200</span> - test@test.kr (company)</div>
        <div><span style={{ color: "#888" }}>2026-05-30 14:33:10</span> <span style={{ color: "#FFA726" }}>WARN</span>  <span style={{ color: "#90CAF9" }}>POST</span> /api/auth/login <span style={{ color: "#EF5350" }}>401</span> - wrong@email.kr (failed)</div>
        <div><span style={{ color: "#888" }}>2026-05-30 14:35:00</span> <span style={{ color: "#4CAF50" }}>INFO</span>  <span style={{ color: "#90CAF9" }}>POST</span> /api/auth/signup <span style={{ color: "#4CAF50" }}>201</span> - new@company.kr (pending)</div>
        <div><span style={{ color: "#888" }}>2026-05-30 14:36:15</span> <span style={{ color: "#4CAF50" }}>INFO</span>  <span style={{ color: "#FFA726" }}>POST</span> /api/companies/C-2026-001/ledger <span style={{ color: "#4CAF50" }}>201</span> - 5 entries added</div>
        <div><span style={{ color: "#888" }}>2026-05-30 14:37:00</span> <span style={{ color: "#4CAF50" }}>INFO</span>  <span style={{ color: "#90CAF9" }}>PUT</span>  /api/audit/reports/AU-001 <span style={{ color: "#4CAF50" }}>200</span> - status: completed</div>
      </div>

      <div style={{ marginTop: 14, fontSize: 13, color: C.sub }}>
        <b>로그 저장 위치:</b> <code style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: 3 }}>server/logs/YYYY-MM-DD.log</code>
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: C.sub }}>
        <b>기록 항목:</b> 날짜시간, 레벨(INFO/WARN/ERROR), HTTP메서드, 경로, 상태코드, 사용자, 상세
      </div>
    </>}
  </div>;
}
