import { BIMOK } from "./theme.js";
import { rate } from "./format.js";

// 자동 집행점검 규칙 (연구비카드 미연동 환경)
//  - 비목 초과집행: 집행액 > 배정액
//  - 참여율 초과: 개인 참여율 100% 초과
export function runChecks(co) {
  const flags = [];
  BIMOK.forEach((b) => {
    const bb = co.budget[b.key] || 0, ee = co.exec[b.key] || 0;
    if (ee > bb) flags.push({ rule: "비목 초과집행", sev: "high", detail: `${b.key} ${rate(ee, bb)}% (배정 초과)` });
  });
  (co.researchers || []).filter((r) => r.rate > 100).forEach((r) =>
    flags.push({ rule: "참여율 초과", sev: "high", detail: `${r.name} 참여율 ${r.rate}% (100% 초과)` })
  );
  return flags;
}
