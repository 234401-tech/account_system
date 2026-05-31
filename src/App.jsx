import React, { useState, useEffect, useRef } from "react";
import { Bell, LogOut, FileText, Users, CreditCard, ClipboardList, Lock, X } from "lucide-react";
import { C } from "./lib/theme.js";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { AppProvider, useApp } from "./context/AppContext.jsx";
import { CompanyPortal } from "./components/company/index.jsx";
import { AdminApp } from "./components/admin/index.jsx";
import { AuditorApp } from "./components/auditor/index.jsx";
import { LoginPage } from "./components/auth/LoginPage.jsx";
import { PolicyMockup } from "./components/company/PolicyMockup.jsx";
import { AmendBudgetMockup } from "./components/company/AmendBudgetMockup.jsx";
import { api } from "./api/index.js";

const notifIcon = { amend: FileText, signup: Users, exec: CreditCard, audit: ClipboardList };
const notifColor = { amend: C.blue, signup: C.amber, exec: C.green, audit: C.teal };
const notifTabs = [{ k: "all", l: "전체" }, { k: "amend", l: "협약변경" }, { k: "exec", l: "집행" }, { k: "audit", l: "회계검토" }, { k: "signup", l: "가입" }];

function ChangePasswordModal({ onClose }) {
  const [cur, setCur] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const submit = async () => {
    setErr(""); setMsg("");
    if (!cur || !newPw) return setErr("모든 항목을 입력하세요");
    if (newPw.length < 4) return setErr("새 비밀번호는 4자 이상이어야 합니다");
    if (newPw !== confirm) return setErr("새 비밀번호가 일치하지 않습니다");
    try { const res = await api.changePassword(cur, newPw); setMsg(res.message || "변경되었습니다"); setCur(""); setNewPw(""); setConfirm(""); } catch (e) { setErr(e.message); }
  };
  const inp = { padding: "10px 12px", border: `1px solid ${C.line}`, borderRadius: 4, fontSize: 13, width: "100%", boxSizing: "border-box", outline: "none" };
  return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "grid", placeItems: "center", zIndex: 200 }} onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 8, padding: "24px", width: 380, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 16, fontWeight: 800 }}>비밀번호 변경</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={C.sub} /></button>
      </div>
      <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} placeholder="현재 비밀번호" style={{ ...inp, marginBottom: 10 }} />
      <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="새 비밀번호" style={{ ...inp, marginBottom: 10 }} />
      <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="새 비밀번호 확인" style={{ ...inp, marginBottom: 14 }} />
      {err && <div style={{ fontSize: 12.5, color: C.red, marginBottom: 10, fontWeight: 600 }}>{err}</div>}
      {msg && <div style={{ fontSize: 12.5, color: C.green, marginBottom: 10, fontWeight: 600 }}>{msg}</div>}
      <button onClick={submit} style={{ width: "100%", padding: "11px", border: "none", borderRadius: 5, background: C.blue, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>변경</button>
    </div>
  </div>;
}

function Topbar({ myProjects = [], selectedProject, onSelectProject }) {
  const { user, logout } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifTab, setNotifTab] = useState("all");
  const ref = useRef(null);

  useEffect(() => { if (user) loadNotifs(); const iv = setInterval(() => { if (user) loadNotifs(); }, 30000); return () => clearInterval(iv); }, [user]);
  useEffect(() => { const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowNotif(false); }; document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler); }, []);

  const loadNotifs = async () => { try { const n = await api.listNotifications(); setNotifs(n); } catch {} };
  const markRead = async (id) => { await api.markNotificationRead(id); setNotifs(notifs.map((n) => n.id === id ? { ...n, read: 1 } : n)); };
  const markAllRead = async () => { await api.markAllNotificationsRead(); setNotifs(notifs.map((n) => ({ ...n, read: 1 }))); };

  const unread = notifs.filter((n) => !n.read).length;
  const filtered = notifTab === "all" ? notifs : notifs.filter((n) => n.type === notifTab);
  const tabUnread = (k) => notifs.filter((n) => !n.read && (k === "all" || n.type === k)).length;

  if (!user) return null;
  return (
    <header style={{ background: C.navy, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", height: 52, position: "sticky", top: 0, zIndex: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: 4, background: C.blue, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 13 }}>정</div>
        <span style={{ fontSize: 15, fontWeight: 800 }}>지원기업 사업비 정산 모니터링 시스템</span>
        <span style={{ fontSize: 11.5, color: "#8E9AA6", marginLeft: 2 }}>경북AI혁신본부</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ padding: "5px 12px", borderRadius: 4, fontSize: 11.5, fontWeight: 700, background: user.role === "master" || user.role === "admin" ? C.blue + "33" : user.role === "auditor" ? C.amber + "33" : C.teal + "33", color: user.role === "master" || user.role === "admin" ? "#B0C4FF" : user.role === "auditor" ? "#E0C080" : "#7EDCC8" }}>
          {user.role === "master" ? "마스터 관리자" : user.role === "admin" ? "기관관리자" : user.role === "auditor" ? "회계사" : "기업 포털"}
        </div>
        {user.role === "company" && myProjects.length > 1 && (
          <select value={selectedProject || ""} onChange={(e) => onSelectProject(e.target.value)}
            style={{ background: "#2A3845", border: "1px solid #3A4A5A", borderRadius: 4, padding: "4px 10px", color: "#fff", fontSize: 12, fontWeight: 600 }}>
            {myProjects.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
          </select>
        )}
        {/* 알림 벨 */}
        <div ref={ref} style={{ position: "relative" }}>
          <div onClick={() => setShowNotif(!showNotif)} style={{ cursor: "pointer", position: "relative" }}>
            <Bell size={18} color="#B5C0CB" />
            {unread > 0 && <span style={{ position: "absolute", top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 999, background: C.red, color: "#fff", fontSize: 10, fontWeight: 800, display: "grid", placeItems: "center", padding: "0 4px" }}>{unread}</span>}
          </div>
          {showNotif && <div style={{ position: "absolute", top: 36, right: -60, width: 380, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 100 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: `1px solid ${C.lineSoft}` }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>알림 {unread > 0 && <span style={{ color: C.red, fontSize: 12 }}>{unread}</span>}</span>
              <button onClick={markAllRead} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.blue, fontWeight: 600 }}>모두 읽음</button>
            </div>
            <div style={{ display: "flex", borderBottom: `1px solid ${C.lineSoft}`, background: "#FAFBFC" }}>
              {notifTabs.map((t) => {
                const cnt = tabUnread(t.k);
                return <button key={t.k} onClick={() => setNotifTab(t.k)} style={{ flex: 1, padding: "7px 0", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, background: notifTab === t.k ? "#fff" : "transparent", color: notifTab === t.k ? C.blue : C.sub, borderBottom: notifTab === t.k ? `2px solid ${C.blue}` : "2px solid transparent" }}>
                  {t.l}{cnt > 0 && <span style={{ marginLeft: 2, color: C.red, fontSize: 10 }}>{cnt}</span>}
                </button>;
              })}
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {filtered.length === 0 && <div style={{ padding: "20px 14px", textAlign: "center", color: C.sub, fontSize: 13 }}>알림이 없습니다.</div>}
              {filtered.map((n) => {
                const Icon = notifIcon[n.type] || Bell;
                const color = notifColor[n.type] || C.gray;
                return <div key={n.id} onClick={() => markRead(n.id)} style={{ display: "flex", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${C.lineSoft}`, cursor: "pointer", background: n.read ? "#fff" : C.blueLt }}>
                  <div style={{ width: 28, height: 28, borderRadius: 999, background: `${color}18`, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon size={14} color={color} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{n.title}</span>
                      {!n.read && <span style={{ width: 7, height: 7, borderRadius: 999, background: C.blue, flexShrink: 0, marginTop: 4 }} />}
                    </div>
                    <div style={{ fontSize: 12, color: C.sub, marginTop: 1, lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{n.created_at || ""}</div>
                  </div>
                </div>;
              })}
            </div>
          </div>}
        </div>
        <div style={{ fontSize: 12.5, color: "#C9D2DA" }}><b style={{ color: "#fff" }}>{user.name}</b> 님</div>
        <button onClick={() => setShowPwModal(true)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "1px solid #3A4A5A", borderRadius: 4, padding: "5px 12px", cursor: "pointer", color: "#9AA6B2", fontSize: 12 }}>
          <Lock size={13} />
        </button>
        <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "1px solid #3A4A5A", borderRadius: 4, padding: "5px 12px", cursor: "pointer", color: "#9AA6B2", fontSize: 12 }}>
          <LogOut size={13} /> 로그아웃
        </button>
        {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
      </div>
    </header>
  );
}

function Layout() {
  const { user, loading: authLoading } = useAuth();
  const { companies, loading: appLoading } = useApp();
  const [myProjects, setMyProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    if (user?.role === "company") {
      api.getMyProjects().then((ps) => {
        setMyProjects(ps);
        if (ps.length > 0 && !selectedProject) setSelectedProject(ps[0].id);
      }).catch(() => {});
    }
  }, [user]);

  if (authLoading || appLoading) return <div style={{ padding: 40, color: C.sub, fontFamily: "Pretendard, sans-serif" }}>불러오는 중…</div>;

  if (window.location.hash === "#policy-mockup") return <PolicyMockup />;
  if (window.location.hash === "#amend-budget-mockup") return <AmendBudgetMockup />;
  if (!user) return <LoginPage />;

  const companyId = user.role === "company"
    ? (myProjects.length > 1 ? (selectedProject || myProjects[0]?.id) : user.companyId || myProjects[0]?.id)
    : (companies[0]?.id || null);

  return (
    <div style={{ color: C.text, minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <Topbar myProjects={myProjects} selectedProject={selectedProject} onSelectProject={setSelectedProject} />
      <div style={{ flex: 1, display: "flex" }}>
        {(user.role === "admin" || user.role === "master")
          ? <AdminApp />
          : user.role === "auditor"
          ? <AuditorApp />
          : <CompanyPortal companyId={companyId} />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Layout />
      </AppProvider>
    </AuthProvider>
  );
}
