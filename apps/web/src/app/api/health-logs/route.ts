import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { computeBaselines } from "@/lib/ai/baselines";
import { detectAnomalies } from "@/lib/ai/anomaly-detection";
import type { HealthLog } from "@/lib/ai/health-score";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { trackEvent, EVENTS } from "@/lib/analytics";

const logSchema = z.object({
  pet_id: z.string().uuid(),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  activity_level: z.number().int().min(1).max(5).nullable().optional(),
  appetite: z.number().int().min(1).max(5).nullable().optional(),
  stool_quality: z.number().int().min(1).max(5).nullable().optional(),
  coat_condition: z.number().int().min(1).max(5).nullable().optional(),
  eye_clarity: z.number().int().min(1).max(5).nullable().optional(),
  energy_level: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = await Promise.resolve(request.nextUrl.searchParams);
  const petId = searchParams.get("pet_id");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30", 10), 90);

  if (!petId) return NextResponse.json({ error: "pet_id required" }, { status: 400 });

  const { data: pet } = await supabase
    .from("pets")
    .select("id")
    .eq("id", petId)
    .eq("owner_id", user.id)
    .single();

  if (!pet) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("health_logs")
    .select("*")
    .eq("pet_id", petId)
    .order("log_date", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: max 3 health logs per day per user
  const today = new Date().toISOString().slice(0, 10);
  const limitResult = await rateLimit(
    `${user.id}:health-log:${today}`,
    3,
    24 * 60 * 60 * 1000
  );

  if (!limitResult.success) {
    logger.warn("health_log_rate_limited", { user_id: user.id });
    return NextResponse.json(
      { error: "Daily health log limit reached (3 per day)", resetAt: limitResult.resetAt },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "3",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(limitResult.resetAt / 1000)),
          "Retry-After": String(Math.ceil((limitResult.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = logSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: pet } = await supabase
    .from("pets")
    .select("id")
    .eq("id", parsed.data.pet_id)
    .eq("owner_id", user.id)
    .single();

  if (!pet) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("health_logs")
    .upsert(
      { ...parsed.data, logged_by: 'owner' },
      { onConflict: "pet_id,log_date" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logger.info("health_log_submitted", {
    pet_id: parsed.data.pet_id,
    user_id: user.id,
    log_date: parsed.data.log_date,
  });

  trackEvent(EVENTS.HEALTH_LOG_SUBMITTED, { pet_id: parsed.data.pet_id });

  // Inline anomaly detection — runs after successful insert, non-blocking on failure
  try {
    const serviceClient = createServiceClient();
    const petId = parsed.data.pet_id;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    const { data: logs } = await serviceClient
      .from("health_logs")
      .select("log_date, activity_level, appetite, stool_quality, coat_condition, eye_clarity, energy_level")
      .eq("pet_id", petId)
      .gte("log_date", thirtyDaysAgoStr)
      .order("log_date", { ascending: false });

    if (logs && logs.length > 0) {
      const baselines = computeBaselines(logs as HealthLog[]);
      const latestLog = logs[0] as HealthLog;
      const currentValues: Record<string, number> = {};
      for (const key of ["activity_level", "appetite", "stool_quality", "coat_condition", "eye_clarity", "energy_level"] as const) {
        const v = latestLog[key];
        if (v !== null && v !== undefined) {
          currentValues[key] = v;
        }
      }

      const { anomalies, overallSeverity } = detectAnomalies(currentValues, baselines);

      if (overallSeverity === 'severe' && anomalies.length > 0) {
        const affectedMetrics = anomalies.map((a) => ({
          metric: a.metric,
          severity: a.severity,
          value: a.value,
          baseline_mean: a.baseline_mean,
          z_score: a.z_score,
          message_ja: a.message_ja,
          message_en: a.message_en,
        }));

        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: existing } = await serviceClient
          .from("anomaly_detections")
          .select("id")
          .eq("pet_id", petId)
          .gte("detected_at", oneDayAgo)
          .limit(1);

        if (!existing || existing.length === 0) {
          await serviceClient.from("anomaly_detections").insert({
            pet_id: petId,
            detected_at: new Date().toISOString(),
            anomaly_type: 'statistical',
            severity: 'severe',
            confidence: 0.9,
            affected_metrics: affectedMetrics,
            alert_sent: false,
          });
        }
      }
    }
  } catch (anomalyErr) {
    console.error("[health-logs POST] Anomaly detection failed:", anomalyErr);
  }

  return NextResponse.json(data, { status: 201 });
}
