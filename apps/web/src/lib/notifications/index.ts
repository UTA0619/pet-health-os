import { sendWhatsApp } from "./whatsapp";
import { sendEmail, buildReminderEmailHtml, buildScoreEmailHtml } from "./email";

export type NotificationChannel = "email" | "whatsapp";

export interface UserNotificationPrefs {
  email?: string | null;
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  whatsapp_phone: string | null;
}

export async function sendReminderNotification(
  prefs: UserNotificationPrefs & { email?: string | null },
  petName: string,
  locale: "ja" | "en" = "ja"
): Promise<{ sent: NotificationChannel[] }> {
  const sent: NotificationChannel[] = [];

  if (prefs.email_enabled && prefs.email) {
    const subject = locale === "en"
      ? `🐾 Log ${petName}'s health today!`
      : `🐾 ${petName}の今日の記録をしましょう！`;
    const html = buildReminderEmailHtml(petName, locale);
    const result = await sendEmail({ to: prefs.email, subject, html });
    if (result.success) sent.push("email");
  }

  if (prefs.whatsapp_enabled && prefs.whatsapp_phone) {
    const msg = locale === "en"
      ? `🐾 Pet Health OS\nDon't forget to log ${petName}'s health today!\nhttps://web-utastudents-projects.vercel.app/log`
      : `🐾 Pet Health OS\n${petName}の今日の健康記録をお忘れなく！\nhttps://web-utastudents-projects.vercel.app/log`;
    const result = await sendWhatsApp(prefs.whatsapp_phone, msg);
    if (result.success) sent.push("whatsapp");
  }

  return { sent };
}

export async function sendScoreNotification(
  prefs: UserNotificationPrefs & { email?: string | null },
  petName: string,
  score: number,
  trend: string,
  locale: "ja" | "en" = "ja"
): Promise<{ sent: NotificationChannel[] }> {
  const sent: NotificationChannel[] = [];

  if (prefs.email_enabled && prefs.email) {
    const subject = locale === "en"
      ? `🐾 ${petName}'s health score: ${score}/100`
      : `🐾 ${petName}のヘルススコア: ${score}/100`;
    const html = buildScoreEmailHtml({ petName, score, trend, locale });
    const result = await sendEmail({ to: prefs.email, subject, html });
    if (result.success) sent.push("email");
  }

  if (prefs.whatsapp_enabled && prefs.whatsapp_phone) {
    const trendEmoji = trend === "improving" ? "📈" : trend === "declining" ? "📉" : "➡️";
    const msg = locale === "en"
      ? `🐾 ${petName}'s health score: ${score}/100 ${trendEmoji}\nhttps://web-utastudents-projects.vercel.app/dashboard`
      : `🐾 ${petName}のスコア: ${score}/100 ${trendEmoji}\nhttps://web-utastudents-projects.vercel.app/dashboard`;
    const result = await sendWhatsApp(prefs.whatsapp_phone, msg);
    if (result.success) sent.push("whatsapp");
  }

  return { sent };
}
