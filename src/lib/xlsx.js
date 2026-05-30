import * as XLSX from "xlsx";

// 2차원 배열(rows)을 .xlsx로 즉시 다운로드
export function downloadXlsx(filename, rows) {
  try {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "양식");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([out], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  } catch (e) { console.error("downloadXlsx", e); }
}

// 업로드 파일의 첫 시트를 2차원 배열로 파싱 (헤더 포함)
export function parseXlsx(file, cb) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const wb = XLSX.read(new Uint8Array(ev.target.result), { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      cb(XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false }));
    } catch (e) { console.error("parseXlsx", e); cb([]); }
  };
  reader.readAsArrayBuffer(file);
}
