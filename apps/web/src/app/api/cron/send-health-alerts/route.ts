import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendReminderNotification, sendScoreNotification } from "@/lib/notifications";
import { computeHealthScore } from "@/lib/ai/health-score";
import { sendPushNotification } from "@/lib/push/sender";
import { sendEmail, buildHealthAlertEmail } from "@/lib/notifications/email";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().split("T")[0];
  let reminders = 0, scores = 0;

  // Get users with email or whatsapp notifications enabled
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("user_id, daily_score_reminder, email_enabled, whatsapp_phone, whatsapp_enabled, reminder_hour")
    .or("email_enabled.eq.true,whatsapp_enabled.eq.true");

  if (!prefs?.length) return NextResponse.json({ reminders: 0, scores: 0 });

  const nowHour = (new Date().getUTCHours() + 9) % 24;

  for (const pref of prefs) {
    if (Math.abs((pref.reminder_hour ?? 20) - nowHour) > 1) continue;

    // Get user email
    const { data: authUser } = await supabase.auth.admin.getUserById(pref.user_id);
    const userEmail = authUser?.user?.email ?? null;

    const { data: pets } = await supabase
      .from("pets").select("id, name").eq("owner_id", pref.user_id).eq("is_active", true).limit(1);
    if (!pets?.length) continue;
    const pet = pets[0];

    const { data: profile } = await supabase.from("profiles").select("preferred_language").eq("id", pref.user_id).single();
    const locale = (profile?.preferred_language ?? "ja") as "ja" | "en";

    const { data: todayLog } = await supabase.from("health_logs").select("id").eq("pet_id", pet.id).eq("log_date", today).single();

    const notifPrefs = {
      email: userEmail,
      email_enabled: pref.email_enabled ?? false,
      whatsapp_enabled: pref.whatsapp_enabled ?? false,
      whatsapp_phone: pref.whatsapp_phone,
    };

    // Fetch push subscriptions for this user
    const { data: pushSubs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", pref.user_id);

    if (!todayLog && pref.daily_score_reminder) {
      const result = await sendReminderNotification(notifPrefs, pet.name, locale);
      if (result.sent.length > 0) reminders++;

      // Send push notifications for reminder
      if (pushSubs?.length) {
        for (const sub of pushSubs) {
          const pushResult = await sendPushNotification(sub, {
            title: "🐾 健康記録の時間です",
            body: `${pet.name}の今日の健康を記録しましょう！`,
            url: "/log",
          });
          if (pushResult.gone) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          }
        }
      }
    } else if (todayLog) {
      const { data: logs } = await supabase.from("health_logs").select("*").eq("pet_id", pet.id).order("log_date", { ascending: false }).limit(7);
      if (logs?.length) {
        const score = computeHealthScore(logs);
        if (score) {
          const roundedScore = Math.round(score.overall);
          const result = await sendScoreNotification(notifPrefs, pet.name, roundedScore, score.trend, locale);
          if (result.sent.length > 0) scores++;

          // Send push notifications for score
          const trendEmoji = score.trend === "improving" ? "↑" : score.trend === "declining" ? "↓" : "→";
          if (pushSubs?.length) {
            for (const sub of pushSubs) {
              const pushResult = await sendPushNotification(sub, {
                title: `🐾 ${pet.name}の健康スコア: ${roundedScore}/100`,
                body: `今日のスコア: ${roundedScore}/100 ${trendEmoji}`,
                url: "/dashboard",
              });
              if (pushResult.gone) {
                await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
              }
            }
          }
        }
      }
    }
  }

  // --- Anomaly alert emails ---
  let anomalyAlertsSent = 0;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: unsent } = await supabase
    .from("anomaly_detections")
    .select("id, pet_id, anomaly_type, severity")
    .eq("alert_sent", false)
    .gte("detected_at", oneDayAgo);

  if (unsent?.length) {
    for (const anomaly of unsent) {
      // Get pet name and owner id
      const { data: pet } = await supabase
        .from("pets")
        .select("name, owner_id")
        .eq("id", anomaly.pet_id)
        .single();

      if (!pet) continue;

      // Get owner profile (notification prefs + email)
      const { data: profile } = await supabase
        .from("profiles")
        .select("notification_prefs")
        .eq("id", pet.owner_id)
        .single();

      const notifPrefs = (profile?.notification_prefs ?? {}) as Record<string, unknown>;
      if (notifPrefs.anomaly_alerts === false) {
        // Mark sent to avoid re-processing
        await supabase
          .from("anomaly_detections")
          .update({ alert_sent: true })
          .eq("id", anomaly.id);
        continue;
      }

      const { data: authUser } = await supabase.auth.admin.getUserById(pet.owner_id);
      const ownerEmail = authUser?.user?.email ?? null;

      if (ownerEmail) {
        const { subject, html } = buildHealthAlertEmail(pet.name, anomaly.anomaly_type, anomaly.severity);
        await sendEmail({ to: ownerEmail, subject, html });
        anomalyAlertsSent++;
      }

      await supabase
        .from("anomaly_detections")
        .update({ alert_sent: true })
        .eq("id", anomaly.id);
    }
  }

  return NextResponse.json({ reminders, scores, sent: anomalyAlertsSent });
}
