import React from "react";
import { C } from "../../lib/theme.js";

export function Shell({ menu, active, onNav, orgLabel, sub, children }) {
  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, background: C.bg }}>
      <aside style={{ width: 220, background: "#fff", borderRight: `1px solid ${C.line}`, flexShrink: 0 }}>
        <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.lineSoft}` }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: C.text }}>{orgLabel}</div>
          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 3 }}>{sub}</div>
        </div>
        <nav style={{ padding: "8px 0" }}>{menu.map((m) => {
          const on = active === m.k;
          return <button key={m.k} onClick={() => onNav(m.k)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", cursor: "pointer", padding: "11px 18px", fontSize: 13.5, fontWeight: on ? 700 : 500, border: "none", borderLeft: `3px solid ${on ? C.blue : "transparent"}`, background: on ? C.blueLt : "transparent", color: on ? C.blueDk : C.text }}>
            <m.icon size={16} color={on ? C.blue : C.sub} /> <span style={{ flex: 1 }}>{m.label}</span>
            {m.badge ? <span style={{ background: C.red, color: "#fff", fontSize: 10.5, fontWeight: 800, borderRadius: 999, padding: "1px 6px", minWidth: 17, textAlign: "center" }}>{m.badge}</span> : null}
          </button>;
        })}</nav>
      </aside>
      <main style={{ flex: 1, padding: "20px 24px", minWidth: 0, overflowX: "auto" }}>{children}</main>
    </div>
  );
}

