/**
 * Email notifications via Resend API
 * Free tier: 100 emails/day, 3000/month
 * Sign up at resend.com — get API key instantly
 * Env var: RESEND_API_KEY
 */

export interface EmailResult {
  success: boolean;
  error?: string;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not configured");
    return { success: false, error: "Email not configured" };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Pet Health OS <noreply@pethealthos.com>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text ?? params.subject,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message ?? "Resend API error" };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export function buildHealthAlertEmail(petName: string, alertType: string, severity: string): { subject: string; html: string } {
  return {
    subject: `🚨 ${petName}の健康アラート — ${severity}レベル`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⚠️ 健康アラート</h2>
        <p><strong>${petName}</strong>の健康データに異常が検知されました。</p>
        <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
          <tr>
            <td style="padding:8px; background:#fee2e2; font-weight:bold;">重症度</td>
            <td style="padding:8px; background:#fee2e2;">${severity}</td>
          </tr>
          <tr>
            <td style="padding:8px;">異常タイプ</td>
            <td style="padding:8px;">${alertType}</td>
          </tr>
        </table>
        <p>Pet Health OSで詳細を確認してください。</p>
        <p style="color:#6b7280; font-size:12px;">
          ※ このアラートはAI分析による参考情報です。医療診断ではありません。
          ペットの健康に不安がある場合は、獣医師にご相談ください。
        </p>
      </div>
    `,
  };
}

export function buildReminderEmailHtml(petName: string, locale: "ja" | "en" = "ja"): string {
  if (locale === "en") {
    return `
<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
  <h2 style="color:#10b981">🐾 Pet Health OS</h2>
  <p>Hi! You haven't logged <strong>${petName}</strong>'s health today.</p>
  <p>Daily logs help our AI detect health changes early — just 30 seconds!</p>
  <a href="https://web-utastudents-projects.vercel.app/log"
     style="display:inline-block;background:#10b981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px">
    Log Now →
  </a>
  <p style="color:#9ca3af;font-size:12px;margin-top:24px">
    You're receiving this because you enabled email reminders in Pet Health OS settings.
    <a href="https://web-utastudents-projects.vercel.app/settings">Unsubscribe</a>
  </p>
</div>`;
  }
  return `
<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
  <h2 style="color:#10b981">🐾 Pet Health OS</h2>
  <p>今日の<strong>${petName}</strong>の健康記録がまだです。</p>
  <p>毎日たった30秒の記録で、AIが健康変化を早期に検出できます！</p>
  <a href="https://web-utastudents-projects.vercel.app/log"
     style="display:inline-block;background:#10b981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px">
    今すぐ記録する →
  </a>
  <p style="color:#9ca3af;font-size:12px;margin-top:24px">
    Pet Health OSのメールリマインダーを有効にしているため送信されています。
    <a href="https://web-utastudents-projects.vercel.app/settings">配信停止</a>
  </p>
</div>`;
}

export function buildScoreEmailHtml(params: {
  petName: string;
  score: number;
  trend: string;
  locale?: "ja" | "en";
}): string {
  const { petName, score, trend, locale = "ja" } = params;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#eab308" : "#ef4444";
  const trendEmoji = trend === "improving" ? "📈" : trend === "declining" ? "📉" : "➡️";

  if (locale === "en") {
    return `
<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
  <h2 style="color:#10b981">🐾 ${petName}'s Daily Health Score</h2>
  <div style="text-align:center;margin:24px 0">
    <span style="font-size:72px;font-weight:900;color:${color}">${score}</span>
    <span style="font-size:24px;color:#9ca3af">/100</span>
    <p style="margin:8px 0">${trendEmoji} ${trend === "improving" ? "Improving" : trend === "declining" ? "Declining" : "Stable"}</p>
  </div>
  <a href="https://web-utastudents-projects.vercel.app/dashboard"
     style="display:inline-block;background:#10b981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
    View Full Report →
  </a>
</div>`;
  }
  return `
<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
  <h2 style="color:#10b981">🐾 ${petName}の本日のヘルススコア</h2>
  <div style="text-align:center;margin:24px 0">
    <span style="font-size:72px;font-weight:900;color:${color}">${score}</span>
    <span style="font-size:24px;color:#9ca3af">/100</span>
    <p style="margin:8px 0">${trendEmoji} ${trend === "improving" ? "改善中" : trend === "declining" ? "低下傾向" : "安定"}</p>
  </div>
  <a href="https://web-utastudents-projects.vercel.app/dashboard"
     style="display:inline-block;background:#10b981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
    詳細を確認する →
  </a>
  <p style="color:#9ca3af;font-size:12px;margin-top:24px">
    <a href="https://web-utastudents-projects.vercel.app/settings">配信停止</a>
  </p>
</div>`;
}
