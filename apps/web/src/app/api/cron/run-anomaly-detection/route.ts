import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { computeBaselines } from "@/lib/ai/baselines";
import { detectAnomalies } from "@/lib/ai/anomaly-detection";
import type { HealthLog } from "@/lib/ai/health-score";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Get today's date in UTC
  const todayStr = new Date().toISOString().split("T")[0];

  // Get all pets that have logged health today
  const { data: todayPets, error: petsError } = await supabase
    .from("health_logs")
    .select("pet_id")
    .eq("log_date", todayStr);

  if (petsError) {
    console.error("[run-anomaly-detection] Failed to fetch today's pets:", petsError);
    return NextResponse.json({ error: petsError.message }, { status: 500 });
  }

  const petIds = [...new Set((todayPets ?? []).map((r) => r.pet_id as string))];

  let checked = 0;
  let anomaliesFound = 0;
  let inserted = 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  for (const petId of petIds) {
    checked++;

    // Fetch last 30 days of logs
    const { data: logs, error: logsError } = await supabase
      .from("health_logs")
      .select("log_date, activity_level, appetite, stool_quality, coat_condition, eye_clarity, energy_level")
      .eq("pet_id", petId)
      .gte("log_date", thirtyDaysAgoStr)
      .order("log_date", { ascending: false });

    if (logsError || !logs || logs.length === 0) continue;

    const baselines = computeBaselines(logs as HealthLog[]);

    // Build current values from today's log (most recent)
    const latestLog = logs[0] as HealthLog;
    const currentValues: Record<string, number> = {};
    for (const key of ["activity_level", "appetite", "stool_quality", "coat_condition", "eye_clarity", "energy_level"] as const) {
      const v = latestLog[key];
      if (v !== null && v !== undefined) {
        currentValues[key] = v;
      }
    }

    const { anomalies, overallSeverity } = detectAnomalies(currentValues, baselines);

    if (overallSeverity === 'none' || anomalies.length === 0) continue;
    anomaliesFound++;

    // Deduplication: skip if same pet already has an anomaly detected within 24h
    const { data: existing } = await supabase
      .from("anomaly_detections")
      .select("id")
      .eq("pet_id", petId)
      .gte("detected_at", oneDayAgo)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const affectedMetrics = anomalies.map((a) => ({
      metric: a.metric,
      severity: a.severity,
      value: a.value,
      baseline_mean: a.baseline_mean,
      z_score: a.z_score,
      message_ja: a.message_ja,
      message_en: a.message_en,
    }));

    const confidence = overallSeverity === 'severe' ? 0.9
      : overallSeverity === 'moderate' ? 0.75
      : 0.6;

    const { error: insertError } = await supabase
      .from("anomaly_detections")
      .insert({
        pet_id: petId,
        detected_at: new Date().toISOString(),
        anomaly_type: 'statistical',
        severity: overallSeverity,
        confidence,
        affected_metrics: affectedMetrics,
        alert_sent: false,
      });

    if (insertError) {
      console.error(`[run-anomaly-detection] Insert failed for pet ${petId}:`, insertError);
      continue;
    }

    inserted++;
  }

  return NextResponse.json({ checked, anomalies_found: anomaliesFound, inserted });
}
