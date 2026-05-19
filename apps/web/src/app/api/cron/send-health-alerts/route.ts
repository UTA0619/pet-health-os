import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendReminderNotification, sendScoreNotification } from "@/lib/notifications";
import { computeHealthScore } from "@/lib/ai/health-score";

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

    if (!todayLog && pref.daily_score_reminder) {
      const result = await sendReminderNotification(notifPrefs, pet.name, locale);
      if (result.sent.length > 0) reminders++;
    } else if (todayLog) {
      const { data: logs } = await supabase.from("health_logs").select("*").eq("pet_id", pet.id).order("log_date", { ascending: false }).limit(7);
      if (logs?.length) {
        const score = computeHealthScore(logs);
        if (score) {
          const result = await sendScoreNotification(notifPrefs, pet.name, Math.round(score.overall), score.trend, locale);
          if (result.sent.length > 0) scores++;
        }
      }
    }
  }

  return NextResponse.json({ reminders, scores });
}
