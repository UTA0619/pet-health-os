import { sendLineNotify } from "./line";
import { sendWhatsApp } from "./whatsapp";

export type NotificationChannel = "line" | "whatsapp" | "email";

export interface UserNotificationPrefs {
  line_enabled: boolean;
  line_notify_token: string | null;
  whatsapp_enabled: boolean;
  whatsapp_phone: string | null;
  email_enabled: boolean;
}

export interface NotificationPayload {
  petName: string;
  message: string;
  locale?: "ja" | "en";
}

export async function sendNotification(
  prefs: UserNotificationPrefs,
  payload: NotificationPayload
): Promise<{ sent: NotificationChannel[]; failed: NotificationChannel[] }> {
  const sent: NotificationChannel[] = [];
  const failed: NotificationChannel[] = [];

  const text = `🐾 ${payload.petName}\n${payload.message}`;

  // LINE
  if (prefs.line_enabled && prefs.line_notify_token) {
    const result = await sendLineNotify(prefs.line_notify_token, `\n${text}`);
    if (result.status === 200) {
      sent.push("line");
    } else {
      console.error(`LINE notify failed: ${result.message}`);
      failed.push("line");
    }
  }

  // WhatsApp
  if (prefs.whatsapp_enabled && prefs.whatsapp_phone) {
    const result = await sendWhatsApp(prefs.whatsapp_phone, text);
    if (result.success) {
      sent.push("whatsapp");
    } else {
      console.error(`WhatsApp failed: ${result.error}`);
      failed.push("whatsapp");
    }
  }

  return { sent, failed };
}

export function buildReminderMessage(petName: string, locale: "ja" | "en" = "ja"): string {
  if (locale === "en") {
    return `Hi! Don't forget to log ${petName}'s health today 📊\nDaily logs help AI detect health changes early.`;
  }
  return `${petName}の今日の健康記録をまだ入力していません 📊\n毎日記録することでAIが早期に異常を検出できます。`;
}

export function buildScoreMessage(
  petName: string,
  score: number,
  trend: "improving" | "stable" | "declining",
  locale: "ja" | "en" = "ja"
): string {
  const trendEmoji = trend === "improving" ? "📈" : trend === "declining" ? "📉" : "➡️";
  if (locale === "en") {
    return `${petName}'s health score today: ${score}/100 ${trendEmoji}\nCheck the app for details.`;
  }
  return `${petName}の本日のヘルススコア: ${score}/100 ${trendEmoji}\nアプリで詳細を確認しましょう。`;
}
