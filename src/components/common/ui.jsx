import React, { useState, useRef } from "react";
import { Home, ChevronRight, Search, RotateCcw, Upload, FileText, X } from "lucide-react";
import { C, STATUS } from "../../lib/theme.js";

/* 공통 테이블 셀 스타일 */
export const th = (a = "left") => ({ textAlign: a, padding: "9px 11px", fontSize: 12, fontWeight: 700, color: C.text, background: C.thead, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" });
export const td = (a = "left") => ({ textAlign: a, padding: "9px 11px", fontSize: 12.5, color: C.text, borderBottom: `1px solid ${C.lineSoft}` });
export const numCell = { fontVariantNumeric: "tabular-nums" };
export const inp = { padding: "6px 10px", border: `1px solid ${C.line}`, borderRadius: 3, fontSize: 12.5, outline: "none", background: "#fff", color: C.text };

export function Tag({ text, color }) { return <span style={{ display: "inline-block", fontSize: 11.5, fontWeight: 700, color, background: `${color}14`, border: `1px solid ${color}40`, padding: "1px 7px", borderRadius: 3, whiteSpace: "nowrap", lineHeight: 1.7 }}>{text}</span>; }
export function Status({ s }) { return <Tag text={s} color={STATUS[s] || C.gray} />; }
export function Btn({ children, kind = "default", onClick, disabled, sm }) {
  const base = { display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 4, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontSize: sm ? 12 : 13, padding: sm ? "5px 10px" : "8px 14px", opacity: disabled ? 0.45 : 1 };
  const styles = {
    primary: { ...base, background: C.blue, color: "#fff", border: `1px solid ${C.blue}` },
    default: { ...base, background: "#fff", color: C.text, border: `1px solid ${C.line}` },
    danger: { ...base, background: "#fff", color: C.red, border: `1px solid ${C.red}55` },
    warn: { ...base, background: "#fff", color: C.amber, border: `1px solid ${C.amber}55` },
    ok: { ...base, background: C.green, color: "#fff", border: `1px solid ${C.green}` },
  };
  return <button onClick={disabled ? undefined : onClick} style={styles[kind]}>{children}</button>;
}
export function Panel({ title, sub, extra, children, pad = true }) {
  return <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 3, marginBottom: 14 }}>
    {title && <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 16px", borderBottom: `1px solid ${C.lineSoft}` }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text, display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 4, height: 14, background: C.blue, borderRadius: 1, display: "inline-block" }} />{title}
        {sub && <span style={{ fontSize: 12, fontWeight: 500, color: C.sub }}>{sub}</span>}
      </h3>{extra}
    </header>}
    <div style={{ padding: pad ? 16 : 0 }}>{children}</div>
  </section>;
}
export function Breadcrumb({ items }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.sub, marginBottom: 8 }}>
    <Home size={12} />{items.map((x, i) => <React.Fragment key={i}><ChevronRight size={11} color={C.faint} /><span style={{ color: i === items.length - 1 ? C.text : C.sub, fontWeight: i === items.length - 1 ? 700 : 400 }}>{x}</span></React.Fragment>)}
  </div>;
}
export function PageHead({ title, actions }) {
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: C.text }}>{title}</h2>
    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>{actions}</div>
  </div>;
}
export function SearchBox({ children, onSearch }) {
  return <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 14, padding: "13px 16px", background: "#F8F9FB", border: `1px solid ${C.line}`, borderRadius: 3, marginBottom: 14 }}>
    {children}<div style={{ marginLeft: "auto", display: "flex", gap: 6 }}><Btn kind="primary" sm onClick={onSearch}><Search size={13} /> 검색</Btn><Btn kind="default" sm><RotateCcw size={13} /> 초기화</Btn></div>
  </div>;
}
export const Field = ({ label, children }) => <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 12.5, fontWeight: 700, color: C.text, whiteSpace: "nowrap" }}>{label}</span>{children}</div>;
export function Kpi({ label, value, unit, sub, accent }) {
  return <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderLeft: `3px solid ${accent}`, borderRadius: 3, padding: "14px 16px" }}>
    <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 600 }}>{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 8 }}><span style={{ fontSize: 26, fontWeight: 800, ...numCell }}>{value}</span>{unit && <span style={{ fontSize: 13, color: C.sub, fontWeight: 600 }}>{unit}</span>}</div>
    {sub && <div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>{sub}</div>}
  </div>;
}
export function Toast({ text }) { return <div style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", background: C.navy, color: "#fff", padding: "11px 18px", borderRadius: 4, fontSize: 13, fontWeight: 600, boxShadow: "0 6px 18px rgba(0,0,0,0.25)", zIndex: 60 }}>{text}</div>; }
export function MiniBar({ v, color }) { return <div style={{ display: "inline-block", width: 70, height: 6, background: C.lineSoft, borderRadius: 2, overflow: "hidden", verticalAlign: "middle" }}><div style={{ width: `${Math.min(v, 100)}%`, height: "100%", background: color }} /></div>; }
export const TableWrap = ({ children }) => <div style={{ border: `1px solid ${C.line}`, borderTop: `2px solid ${C.blue}`, borderRadius: 2, overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>{children}</table></div>;
export const InfoBar = ({ rows }) => <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 28px", padding: "11px 16px", background: C.blueLt, border: `1px solid ${C.blue}33`, borderRadius: 3, marginBottom: 14, fontSize: 12.5 }}>{rows.map(([k, v]) => <span key={k}><b style={{ color: C.blueDk }}>{k}</b> <span style={{ color: C.text, marginLeft: 5 }}>{v}</span></span>)}</div>;

export function DropZone({ files, setFiles, maxFiles = 5, accept = ".pdf,.hwp,.docx,image/*", label = "첨부파일 (선택)", hint = "변경계획서, 견적서 등 관련 서류를 첨부하세요." }) {
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (fileList) => {
    const newFiles = Array.from(fileList).slice(0, maxFiles - files.length).map((f) => ({ name: f.name, file: f, url: URL.createObjectURL(f) }));
    if (newFiles.length) setFiles([...files, ...newFiles]);
  };

  const onDrop = (e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); };
  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onChange = (e) => { if (e.target.files.length) addFiles(e.target.files); e.target.value = ""; };

  return <div style={{ border: `1px solid ${C.line}`, borderRadius: 4, padding: 16 }}>
    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><FileText size={15} color={C.blue} /> {label}</div>
    <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 10 }}>{hint}</div>

    {files.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
      {files.map((f, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 12px", border: `1px solid ${C.line}`, borderRadius: 4, background: "#FAFBFC" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><FileText size={14} color={C.blue} /><span style={{ fontSize: 13, fontWeight: 600 }}>{f.name}</span></div>
          <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} style={{ border: "none", background: "none", cursor: "pointer", color: C.red }}><X size={14} /></button>
        </div>
      ))}
    </div>}

    <div onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onClick={() => files.length < maxFiles && ref.current && ref.current.click()}
      style={{ border: `2px dashed ${dragging ? C.blue : C.line}`, borderRadius: 6, padding: "16px 12px", textAlign: "center", cursor: files.length >= maxFiles ? "not-allowed" : "pointer", background: dragging ? C.blueLt : "#FAFBFC", transition: "all 0.15s" }}>
      <Upload size={20} color={dragging ? C.blue : C.faint} style={{ marginBottom: 4 }} />
      <div style={{ fontSize: 12.5, fontWeight: 600, color: dragging ? C.blue : C.sub }}>{dragging ? "여기에 놓으세요" : "파일을 드래그하거나 클릭하여 첨부"}</div>
      <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2 }}>최대 {maxFiles}개</div>
      <input ref={ref} type="file" accept={accept} multiple style={{ display: "none" }} onChange={onChange} />
    </div>
  </div>;
}
