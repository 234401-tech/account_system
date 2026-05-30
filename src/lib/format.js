// 숫자/금액 포맷 유틸 (모든 금액은 원 단위)
export const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
export const won = (t) => t.toLocaleString("ko-KR");                     // 원 표기
export const eok = (t) => (t / 100000000).toFixed(2);                    // 원 → 억원
export const rate = (e, b) => (b === 0 ? 0 : Math.round((e / b) * 1000) / 10);
