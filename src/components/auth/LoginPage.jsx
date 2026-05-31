import React, { useState } from "react";
import { Lock, UserPlus, Building2, Shield, KeyRound, X } from "lucide-react";
import { C } from "../../lib/theme.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../api/index.js";

const inp = { border: `1px solid ${C.line}`, borderRadius: 4, padding: "11px 14px", fontSize: 13.5, width: "100%", boxSizing: "border-box", outline: "none" };

export function LoginPage() {
  const { login, signup, error } = useAuth();
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // 회원가입 폼
  const [sForm, setSForm] = useState({ bizNo: "", companyName: "", contactName: "", email: "", password: "" });

  // 비밀번호 찾기 모달
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const submitReset = async () => {
    if (!resetEmail) return;
    setResetBusy(true);
    try {
      const r = await api.requestPasswordReset(resetEmail);
      setResetMsg(r.message || "요청이 접수되었습니다");
    } catch (e) { setResetMsg("실패: " + e.message); }
    setResetBusy(false);
  };

  const doLogin = async () => {
    if (!email || !pw) return;
    setBusy(true); setMsg("");
    try { await login(email, pw); } catch { }
    setBusy(false);
  };

  const doSignup = async () => {
    const { companyName, contactName, email, password } = sForm;
    if (!companyName || !contactName || !email || !password) return;
    setBusy(true); setMsg("");
    try {
      const res = await signup(sForm);
      if (res.token && res.user) {
        localStorage.setItem("auth_token", res.token);
        localStorage.setItem("auth_user", JSON.stringify(res.user));
        window.location.reload();
        return;
      }
      setMsg(res.message || "가입 신청이 접수되었습니다.");
      setTab("login");
    } catch { }
    setBusy(false);
  };

  const tabStyle = (active) => ({
    flex: 1, padding: "13px 0", border: "none", cursor: "pointer",
    fontSize: 13.5, fontWeight: 700,
    background: active ? "#fff" : "#F4F5F7",
    color: active ? C.blue : C.sub,
    borderBottom: active ? `2.5px solid ${C.blue}` : "2.5px solid transparent",
  });

  return (
    <div style={{ flex: 1, width: "100%", minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center", background: `linear-gradient(135deg, ${C.navy} 0%, #1A2740 100%)`, padding: "60px 20px" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* 로고 */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 6, background: C.blue, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 17, color: "#fff" }}>정</div>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>사업비 정산 모니터링</span>
          </div>
          <div style={{ fontSize: 12.5, color: "#8E9AA6" }}>경북AI혁신본부 · ICT방송통신기금 회계규정 기반</div>
        </div>

        {/* 카드 */}
        <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.15)" }}>
          <div style={{ display: "flex", borderBottom: `1px solid ${C.line}` }}>
            <button onClick={() => setTab("login")} style={tabStyle(tab === "login")}>로그인</button>
            <button onClick={() => setTab("signup")} style={tabStyle(tab === "signup")}>회원가입</button>
          </div>

          <div style={{ padding: "24px 24px 20px" }}>
            {tab === "login" ? <>
              {/* 역할 안내 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
                <div style={{ padding: "10px 12px", border: `1px solid ${C.line}`, borderRadius: 5, display: "flex", alignItems: "center", gap: 8 }}>
                  <Building2 size={16} color={C.teal} />
                  <div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>기업 포털</div><div style={{ fontSize: 11, color: C.sub }}>과제 조회·집행</div></div>
                </div>
                <div style={{ padding: "10px 12px", border: `1px solid ${C.line}`, borderRadius: 5, display: "flex", alignItems: "center", gap: 8 }}>
                  <Shield size={16} color={C.blue} />
                  <div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>관리자</div><div style={{ fontSize: 11, color: C.sub }}>모니터링·정산</div></div>
                </div>
              </div>

              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" style={{ ...inp, marginBottom: 10 }} onKeyDown={(e) => e.key === "Enter" && doLogin()} />
              <input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" type="password" style={{ ...inp, marginBottom: 14 }} onKeyDown={(e) => e.key === "Enter" && doLogin()} />

              {(error || msg) && <div style={{ fontSize: 12.5, color: error ? C.red : C.green, marginBottom: 10, fontWeight: 600 }}>{error || msg}</div>}

              <button onClick={doLogin} disabled={busy || !email || !pw} style={{ width: "100%", padding: "12px 0", border: "none", borderRadius: 5, background: C.blue, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", opacity: busy ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <Lock size={15} /> {busy ? "로그인 중..." : "로그인"}
              </button>
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <button onClick={() => { setShowReset(true); setResetMsg(""); setResetEmail(email); }} style={{ background: "none", border: "none", color: C.sub, fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}>
                  <KeyRound size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />비밀번호를 잊으셨나요?
                </button>
              </div>

            </> : <>
              <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 14, lineHeight: 1.6 }}>
                가입 신청 후 관리자가 승인하면 본인 과제를 조회·관리할 수 있습니다.
              </div>
              <input value={sForm.bizNo} onChange={(e) => setSForm({ ...sForm, bizNo: e.target.value })} placeholder="사업자등록번호" style={{ ...inp, marginBottom: 8 }} />
              <input value={sForm.companyName} onChange={(e) => setSForm({ ...sForm, companyName: e.target.value })} placeholder="기업명 *" style={{ ...inp, marginBottom: 8 }} />
              <input value={sForm.contactName} onChange={(e) => setSForm({ ...sForm, contactName: e.target.value })} placeholder="담당자명 *" style={{ ...inp, marginBottom: 8 }} />
              <input value={sForm.email} onChange={(e) => setSForm({ ...sForm, email: e.target.value })} placeholder="이메일(아이디) *" style={{ ...inp, marginBottom: 8 }} />
              <input value={sForm.password} onChange={(e) => setSForm({ ...sForm, password: e.target.value })} placeholder="비밀번호 *" type="password" style={{ ...inp, marginBottom: 14 }} />

              {error && <div style={{ fontSize: 12.5, color: C.red, marginBottom: 10, fontWeight: 600 }}>{error}</div>}

              <button onClick={doSignup} disabled={busy} style={{ width: "100%", padding: "12px 0", border: "none", borderRadius: 5, background: C.blue, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", opacity: busy ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <UserPlus size={15} /> {busy ? "처리 중..." : "회원가입 신청"}
              </button>
            </>}
          </div>
        </div>
      </div>

      {/* 비밀번호 찾기 모달 */}
      {showReset && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 1000 }} onClick={() => setShowReset(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 8, padding: 28, width: "90%", maxWidth: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}><KeyRound size={18} color={C.blue} /> 비밀번호 재설정 요청</div>
              <button onClick={() => setShowReset(false)} style={{ border: "none", background: "none", cursor: "pointer", color: C.sub }}><X size={18} /></button>
            </div>
            <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6, marginBottom: 14 }}>
              가입하신 이메일을 입력하시면 관리자에게 재설정 요청이 전달됩니다.<br/>
              관리자 승인 후 임시 비밀번호가 발급되며, 담당자에게 별도 연락드립니다.
            </div>
            <input value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="가입 이메일" style={{ ...inp, marginBottom: 10 }} onKeyDown={(e) => e.key === "Enter" && submitReset()} />
            {resetMsg && <div style={{ fontSize: 12.5, color: resetMsg.startsWith("실패") ? C.red : C.green, marginBottom: 10, fontWeight: 600 }}>{resetMsg}</div>}
            <button onClick={submitReset} disabled={resetBusy || !resetEmail} style={{ width: "100%", padding: "11px 0", border: "none", borderRadius: 5, background: C.blue, color: "#fff", fontSize: 13.5, fontWeight: 800, cursor: "pointer", opacity: resetBusy ? 0.6 : 1 }}>
              {resetBusy ? "요청 중..." : "재설정 요청"}
            </button>
            <div style={{ fontSize: 11.5, color: C.faint, textAlign: "center", marginTop: 10 }}>
              긴급한 경우 시스템 관리자에게 직접 문의해 주세요.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
