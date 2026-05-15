import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const ONESIGNAL_APP_ID = Deno.env.get("NEXT_PUBLIC_ONESIGNAL_APP_ID")!;
const ONESIGNAL_API_KEY = Deno.env.get("ONESIGNAL_API_KEY")!;

interface AlertPayload {
  pet_id: string;
  severity?: "mild" | "moderate" | "severe";
  alert_type?: "anomaly" | "daily_score" | "streak_reminder";
}

async function sendPushNotification(playerIds: string[], title: string, body: string, data: Record<string, string>) {
  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${ONESIGNAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: playerIds,
      headings: { en: title },
      contents: { en: body },
      data,
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
      ttl: 3600,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(JSON.stringify({ error: "OneSignal error", detail: err }));
    throw new Error(`OneSignal failed: ${err}`);
  }

  return res.json();
}

const SEVERITY_MESSAGES: Record<string, { title: string; body: (petName: string) => string }> = {
  mild: {
    title: "Health Notice",
    body: (name) => `${name} has a slight change in their health pattern. Check today's report.`,
  },
  moderate: {
    title: "Health Alert",
    body: (name) => `${name} shows some unusual health patterns today. Review their dashboard.`,
  },
  severe: {
    title: "🚨 Health Warning",
    body: (name) => `${name} has significant health changes. Consider contacting your vet.`,
  },
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const cronSecret = req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("authorization");
  if (
    cronSecret !== Deno.env.get("CRON_SECRET") &&
    authHeader !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload: AlertPayload = await req.json().catch(() => ({}));
  const { pet_id, severity = "mild", alert_type = "anomaly" } = payload;

  if (!pet_id) {
    return new Response(JSON.stringify({ error: "pet_id required" }), { status: 400 });
  }

  // Fetch pet + owner notification preferences
  const { data: pet } = await supabase
    .from("pets")
    .select("id, name, owner_id")
    .eq("id", pet_id)
    .single();

  if (!pet) {
    return new Response(JSON.stringify({ error: "Pet not found" }), { status: 404 });
  }

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("push_enabled, anomaly_alerts, onesignal_player_id")
    .eq("user_id", pet.owner_id)
    .single();

  if (!prefs?.push_enabled || !prefs.anomaly_alerts || !prefs.onesignal_player_id) {
    return new Response(JSON.stringify({ sent: false, reason: "notifications disabled or not registered" }), { status: 200 });
  }

  const msg = SEVERITY_MESSAGES[severity] ?? SEVERITY_MESSAGES.mild;

  try {
    await sendPushNotification(
      [prefs.onesignal_player_id],
      msg.title,
      msg.body(pet.name),
      { pet_id, alert_type, severity, deep_link: `/pets/${pet_id}/health` }
    );

    // Mark anomaly as alert_sent
    await supabase
      .from("anomaly_detections")
      .update({ alert_sent: true, alert_sent_at: new Date().toISOString() })
      .eq("pet_id", pet_id)
      .eq("alert_sent", false);

    return new Response(JSON.stringify({ sent: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(JSON.stringify({ error: String(err), pet_id }));
    return new Response(JSON.stringify({ error: "Failed to send alert" }), { status: 500 });
  }
});
