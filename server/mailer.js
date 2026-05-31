import nodemailer from "nodemailer";

// 환경변수: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE
const CONFIG = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM || process.env.SMTP_USER,
};

export const mailEnabled = !!(CONFIG.host && CONFIG.user && CONFIG.pass);

let transporter = null;
function getTransporter() {
  if (!mailEnabled) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: CONFIG.host,
      port: CONFIG.port,
      secure: CONFIG.secure,
      auth: { user: CONFIG.user, pass: CONFIG.pass },
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  if (!mailEnabled) return { sent: false, reason: "SMTP not configured" };
  try {
    const info = await getTransporter().sendMail({
      from: CONFIG.from,
      to, subject, text, html,
    });
    return { sent: true, messageId: info.messageId };
  } catch (e) {
    console.error("[mailer] send failed:", e.message);
    return { sent: false, reason: e.message };
  }
}

export async function sendTempPasswordMail(to, name, tempPassword) {
  return sendMail({
    to,
    subject: "[지원기업 사업비 정산 모니터링] 임시 비밀번호 발급 안내",
    text: `${name || to}님,\n\n관리자가 비밀번호 재설정 요청을 승인하였습니다.\n\n임시 비밀번호: ${tempPassword}\n\n로그인 후 [비밀번호 변경] 메뉴에서 새 비밀번호로 변경해 주세요.\n\n— 경북AI혁신본부 정산 모니터링 시스템`,
    html: `
      <div style="font-family: Pretendard, -apple-system, sans-serif; max-width: 520px; margin: 0 auto; color: #1A2B3C;">
        <div style="background: #1A2B3C; color: #fff; padding: 18px 24px; font-weight: 800; font-size: 15px;">지원기업 사업비 정산 모니터링</div>
        <div style="padding: 28px 24px; background: #fff; border: 1px solid #E5E9F0;">
          <p style="font-size: 14px; margin-top: 0;"><b>${name || to}</b>님,</p>
          <p style="font-size: 13.5px; line-height: 1.7;">관리자가 비밀번호 재설정 요청을 승인하였습니다.<br/>아래 임시 비밀번호로 로그인하신 후, <b>비밀번호 변경 메뉴</b>에서 새 비밀번호로 변경해 주세요.</p>
          <div style="background: #F0F7FF; border: 1px solid #2563EB33; border-left: 4px solid #2563EB; border-radius: 4px; padding: 16px 20px; margin: 18px 0;">
            <div style="font-size: 12px; color: #6B7280; margin-bottom: 6px;">임시 비밀번호</div>
            <div style="font-size: 18px; font-family: 'Courier New', monospace; font-weight: 800; color: #2563EB; letter-spacing: 1px;">${tempPassword}</div>
          </div>
          <p style="font-size: 12px; color: #6B7280; line-height: 1.6;">본인이 요청하지 않은 경우 즉시 관리자에게 문의해 주세요.</p>
        </div>
        <div style="padding: 12px 24px; background: #F8F9FB; font-size: 11.5px; color: #6B7280; border: 1px solid #E5E9F0; border-top: none;">경북AI혁신본부 정산 모니터링 시스템</div>
      </div>
    `,
  });
}

console.log(`[mailer] SMTP ${mailEnabled ? "활성" : "비활성"} ${mailEnabled ? `(${CONFIG.host}:${CONFIG.port})` : "— 환경변수 미설정"}`);
