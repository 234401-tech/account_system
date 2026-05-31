import React, { useState } from "react";
import { Upload, Plus, Trash2, FileText, Download, Edit2, Check, X, Paperclip } from "lucide-react";
import { C } from "../../lib/theme.js";
import { Tag, Btn, Panel, TableWrap, th, td, inp, DropZone } from "../common/ui.jsx";

const DEFAULT_ITEMS = [
  { id: 1, item: "기관 자체 연구비 사용규정", content: "미등록 → 공무원 여비·집행 기준 자동 적용", status: "미등록" },
  { id: 2, item: "국내출장 여비", content: "공무원 여비규정 준용 (일비·숙박비 상한)", status: "기본적용" },
  { id: 3, item: "연구활동비 식비 한도", content: "1인 1식 기준 한도", status: "기본적용" },
  { id: 4, item: "비목별 전용 한도", content: "비목 간 전용 시 협약변경 절차 적용", status: "기본적용" },
];

const statusColors = { 등록: C.green, 기본적용: C.blue, 미등록: C.amber, 수정중: C.gray };

export function PolicyMockup() {
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [regFile, setRegFile] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editRow, setEditRow] = useState({});
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState({ item: "", content: "", status: "등록" });

  const startEdit = (row) => { setEditId(row.id); setEditRow(row); };
  const saveEdit = () => { setItems(items.map((i) => i.id === editId ? editRow : i)); setEditId(null); };
  const cancelEdit = () => { setEditId(null); setEditRow({}); };
  const removeItem = (id) => { if (confirm("이 기준 항목을 삭제하시겠습니까?")) setItems(items.filter((i) => i.id !== id)); };
  const addItem = () => {
    if (!newRow.item || !newRow.content) return;
    setItems([...items, { ...newRow, id: Math.max(0, ...items.map((i) => i.id)) + 1 }]);
    setNewRow({ item: "", content: "", status: "등록" });
    setAdding(false);
  };

  return <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "Pretendard, sans-serif", background: "#F5F7FA", minHeight: "100vh" }}>
    <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>연구비 사용기준 — 목업</div>
    <div style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>기관 자체 규정 첨부 및 기준 항목 등록 기능</div>

    {/* 1. 기관 자체 규정 파일 업로드 */}
    <Panel title="① 기관 자체 연구비 사용규정 (파일)" sub="PDF / HWP / DOCX 등 자체규정 문서를 첨부하세요" pad={true}>
      {regFile ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: C.greenLt, border: `1px solid ${C.green}55`, borderRadius: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 999, background: C.green, color: "#fff", display: "grid", placeItems: "center" }}><FileText size={18} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>{regFile.name}</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{(regFile.size / 1024).toFixed(1)}KB · {regFile.uploadedAt}</div>
          </div>
          <Btn kind="default" sm><Download size={12} /> 다운로드</Btn>
          <Btn kind="danger" sm onClick={() => setRegFile(null)}><Trash2 size={12} /></Btn>
        </div>
      ) : (
        <DropZoneSimple onFile={(f) => setRegFile({ name: f.name, size: f.size, uploadedAt: new Date().toISOString().slice(0, 10) })} />
      )}
      <div style={{ marginTop: 12, padding: "10px 14px", background: C.amberLt, border: `1px solid ${C.amber}40`, borderRadius: 4, fontSize: 12.5, color: C.text }}>
        ⓘ 자체규정 미등록 시 <b>공무원 여비·집행 기준이 자동 적용</b>됩니다.
      </div>
    </Panel>

    {/* 2. 기준 항목 표 */}
    <Panel title="② 기준 항목 관리" sub="기관별 적용 기준을 추가/수정할 수 있습니다" pad={false}
      extra={<Btn kind="primary" sm onClick={() => setAdding(true)}><Plus size={12} /> 기준 추가</Btn>}>
      <TableWrap>
        <thead><tr>{["기준 항목", "적용 내용", "상태", "관리"].map((h) => <th key={h} style={th()}>{h}</th>)}</tr></thead>
        <tbody>
          {items.map((row) => editId === row.id ? (
            <tr key={row.id}>
              <td style={td()}><input value={editRow.item} onChange={(e) => setEditRow({ ...editRow, item: e.target.value })} style={{ ...inp, width: "100%" }} /></td>
              <td style={td()}><input value={editRow.content} onChange={(e) => setEditRow({ ...editRow, content: e.target.value })} style={{ ...inp, width: "100%" }} /></td>
              <td style={td()}>
                <select value={editRow.status} onChange={(e) => setEditRow({ ...editRow, status: e.target.value })} style={{ ...inp, padding: "4px 6px" }}>
                  <option>등록</option><option>기본적용</option><option>미등록</option>
                </select>
              </td>
              <td style={td()}>
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn kind="primary" sm onClick={saveEdit}><Check size={11} /></Btn>
                  <Btn kind="default" sm onClick={cancelEdit}><X size={11} /></Btn>
                </div>
              </td>
            </tr>
          ) : (
            <tr key={row.id}>
              <td style={{ ...td(), fontWeight: 700 }}>{row.item}</td>
              <td style={{ ...td(), color: C.text }}>{row.content}</td>
              <td style={td()}><Tag text={row.status} color={statusColors[row.status]} /></td>
              <td style={td()}>
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn kind="default" sm onClick={() => startEdit(row)}><Edit2 size={11} /></Btn>
                  <Btn kind="danger" sm onClick={() => removeItem(row.id)}><Trash2 size={11} /></Btn>
                </div>
              </td>
            </tr>
          ))}
          {adding && (
            <tr style={{ background: C.blueLt }}>
              <td style={td()}><input value={newRow.item} onChange={(e) => setNewRow({ ...newRow, item: e.target.value })} placeholder="예: 도서구입비 한도" style={{ ...inp, width: "100%" }} /></td>
              <td style={td()}><input value={newRow.content} onChange={(e) => setNewRow({ ...newRow, content: e.target.value })} placeholder="예: 1인 연 50만원" style={{ ...inp, width: "100%" }} /></td>
              <td style={td()}>
                <select value={newRow.status} onChange={(e) => setNewRow({ ...newRow, status: e.target.value })} style={{ ...inp, padding: "4px 6px" }}>
                  <option>등록</option><option>기본적용</option><option>미등록</option>
                </select>
              </td>
              <td style={td()}>
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn kind="primary" sm onClick={addItem}><Check size={11} /></Btn>
                  <Btn kind="default" sm onClick={() => { setAdding(false); setNewRow({ item: "", content: "", status: "등록" }); }}><X size={11} /></Btn>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </TableWrap>
    </Panel>

    <div style={{ marginTop: 18, padding: "12px 16px", background: "#F8F9FB", border: `1px solid ${C.line}`, borderRadius: 4, fontSize: 12.5, color: C.sub }}>
      <b>구현 시 추가 사항:</b>
      <ul style={{ margin: "6px 0 0 18px", lineHeight: 1.7 }}>
        <li>파일은 기업별 폴더(<code>uploads/&#123;기업번호&#125;_&#123;기업명&#125;/policy/</code>)에 저장</li>
        <li>여러 파일 첨부 가능 (개정본 이력 관리)</li>
        <li>기준 항목은 DB 저장 (policy_items 테이블)</li>
        <li>관리자/회계사 화면에서도 조회 가능 (읽기 전용)</li>
      </ul>
    </div>
  </div>;
}

function DropZoneSimple({ onFile }) {
  const ref = React.useRef(null);
  const [drag, setDrag] = useState(false);
  return <div
    onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
    onDragLeave={() => setDrag(false)}
    onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
    onClick={() => ref.current && ref.current.click()}
    style={{ border: `2px dashed ${drag ? C.blue : C.line}`, borderRadius: 6, padding: "30px 20px", textAlign: "center", cursor: "pointer", background: drag ? C.blueLt : "#FAFBFC" }}>
    <Upload size={28} style={{ color: C.sub, marginBottom: 8 }} />
    <div style={{ fontSize: 14, fontWeight: 700 }}>규정 파일 업로드</div>
    <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>드래그하거나 클릭 · PDF, HWP, DOCX</div>
    <input ref={ref} type="file" accept=".pdf,.hwpx,.docx,.doc" style={{ display: "none" }} onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
  </div>;
}
