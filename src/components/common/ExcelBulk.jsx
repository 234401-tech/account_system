import React, { useRef } from "react";
import { Download, Upload } from "lucide-react";
import { Btn } from "./ui.jsx";
import { downloadXlsx, parseXlsx } from "../../lib/xlsx.js";

// 양식 다운로드 + 엑셀 업로드 묶음 버튼
export function ExcelBulk({ template, onRows }) {
  const ref = useRef(null);
  return (
    <div style={{ display: "flex", gap: 7 }}>
      <Btn kind="default" sm onClick={() => downloadXlsx(template.name, template.rows)}>
        <Download size={13} /> 양식 다운로드
      </Btn>
      <Btn kind="default" sm onClick={() => ref.current && ref.current.click()}>
        <Upload size={13} /> 엑셀 업로드
      </Btn>
      <input
        ref={ref}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files && e.target.files[0];
          if (f) parseXlsx(f, (rows) => { onRows(rows); e.target.value = ""; });
        }}
      />
    </div>
  );
}
