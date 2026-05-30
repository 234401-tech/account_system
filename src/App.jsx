import React, { useState } from "react";
import { Bell, LogOut } from "lucide-react";
import { C } from "./lib/theme.js";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { AppProvider, useApp } from "./context/AppContext.jsx";
import { CompanyPortal } from "./components/company/index.jsx";
import { AdminApp } from "./components/admin/index.jsx";
import { AuditorApp } from "./components/auditor/index.jsx";
import { LoginPage } from "./components/auth/LoginPage.jsx";

function Topbar({ view, setView }) {
  const { user, logout } = useAuth();
  const { companies } = useApp();
  if (!user) return null;
  return (
    <header style={{ background: C.navy, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", height: 52, position: "sticky", top: 0, zIndex: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: 4, background: C.blue, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 13 }}>정</div>
        <span style={{ fontSize: 15, fontWeight: 800 }}>지원기업 사업비 정산 모니터링 시스템</span>
        <span style={{ fontSize: 11.5, color: "#8E9AA6", marginLeft: 2 }}>경북AI혁신본부</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", background: "#2A3845", borderRadius: 5, padding: 3 }}>
          {[{ k: "company", l: "기업 포털" }, { k: "admin", l: "기관관리자" }, { k: "auditor", l: "회계사" }].map((x) => {
            const on = view === x.k;
            return <button key={x.k} onClick={() => setView(x.k)} style={{ border: "none", cursor: "pointer", borderRadius: 4, padding: "5px 14px", fontSize: 12, fontWeight: 700, background: on ? C.blue : "transparent", color: on ? "#fff" : "#9AA6B2" }}>{x.l}</button>;
          })}
        </div>
        <div style={{ position: "relative", cursor: "pointer" }}><Bell size={18} color="#B5C0CB" /><span style={{ position: "absolute", top: -2, right: -2, width: 7, height: 7, background: C.red, borderRadius: 999 }} /></div>
        <div style={{ fontSize: 12.5, color: "#C9D2DA" }}><b style={{ color: "#fff" }}>{user.name}</b> 님</div>
        <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "1px solid #3A4A5A", borderRadius: 4, padding: "5px 12px", cursor: "pointer", color: "#9AA6B2", fontSize: 12 }}>
          <LogOut size={13} /> 로그아웃
        </button>
      </div>
    </header>
  );
}

function Layout() {
  const { user, loading: authLoading } = useAuth();
  const { companies, loading: appLoading } = useApp();
  const [view, setView] = useState(null);

  if (authLoading || appLoading) return <div style={{ padding: 40, color: C.sub, fontFamily: "Pretendard, sans-serif" }}>불러오는 중…</div>;

  if (!user) return <LoginPage />;

  const activeView = view || (user.role === "admin" || user.role === "master" ? "admin" : user.role === "auditor" ? "auditor" : "company");
  const companyId = user.role === "company" ? user.companyId : (companies[0]?.id || null);

  return (
    <div style={{ color: C.text, minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <Topbar view={activeView} setView={setView} />
      <div style={{ flex: 1, display: "flex" }}>
        {activeView === "admin"
          ? <AdminApp />
          : activeView === "auditor"
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
