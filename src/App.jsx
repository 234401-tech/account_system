import React from "react";
import { Bell, LogOut } from "lucide-react";
import { C } from "./lib/theme.js";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { AppProvider, useApp } from "./context/AppContext.jsx";
import { CompanyPortal } from "./components/company/index.jsx";
import { AdminApp } from "./components/admin/index.jsx";
import { AuditorApp } from "./components/auditor/index.jsx";
import { LoginPage } from "./components/auth/LoginPage.jsx";

function Topbar() {
  const { user, logout } = useAuth();
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
  if (authLoading || appLoading) return <div style={{ padding: 40, color: C.sub, fontFamily: "Pretendard, sans-serif" }}>불러오는 중…</div>;

  if (!user) return <LoginPage />;

  const companyId = user.role === "company" ? user.companyId : (companies[0]?.id || null);

  return (
    <div style={{ color: C.text, minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <Topbar />
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
