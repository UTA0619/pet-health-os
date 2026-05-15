import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const ZSCORE_THRESHOLD = parseFloat(Deno.env.get("ANOMALY_ZSCORE_THRESHOLD") ?? "2.5");
const IQR_MULTIPLIER = parseFloat(Deno.env.get("ANOMALY_IQR_MULTIPLIER") ?? "1.5");
const MIN_BASELINE_DAYS = parseInt(Deno.env.get("ANOMALY_MIN_BASELINE_DAYS") ?? "14");
const MODEL_VERSION = "statistical-v1.0";

type Severity = "mild" | "moderate" | "severe";

interface AnomalyResult {
  metric: string;
  value: number;
  baseline_mean: number;
  z_score: number;
  iqr_outlier: boolean;
  severity: Severity;
}

function detectAnomalies(
  latest: Record<string, number | null>,
  baselines: Array<{ metric_name: string; baseline_mean: number; baseline_std: number; q1: number; q3: number; sample_count: number }>
): AnomalyResult[] {
  const anomalies: AnomalyResult[] = [];

  for (const baseline of baselines) {
    const value = latest[baseline.metric_name];
    if (value === null || value === undefined) continue;
    if (baseline.sample_count < MIN_BASELINE_DAYS) continue;

    const zScore = baseline.baseline_std > 0
      ? Math.abs((value - baseline.baseline_mean) / baseline.baseline_std)
      : 0;

    const iqr = baseline.q3 - baseline.q1;
    const iqrOutlier = iqr > 0
      ? value < baseline.q1 - IQR_MULTIPLIER * iqr || value > baseline.q3 + IQR_MULTIPLIER * iqr
      : false;

    const zAnomaly = zScore >= ZSCORE_THRESHOLD;

    if (!zAnomaly && !iqrOutlier) continue;

    let severity: Severity = "mild";
    if (zAnomaly && iqrOutlier) severity = "moderate";
    if (zScore >= ZSCORE_THRESHOLD + 1.0) severity = "severe";

    anomalies.push({
      metric: baseline.metric_name,
      value,
      baseline_mean: baseline.baseline_mean,
      z_score: Math.round(zScore * 100) / 100,
      iqr_outlier: iqrOutlier,
      severity,
    });
  }

  return anomalies;
}

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

  const body = await req.json().catch(() => ({}));

  // Pet-specific run or full sweep
  const petIdFilter: string | undefined = body.pet_id;

  let query = supabase
    .from("pets")
    .select("id, name, owner_id")
    .eq("is_active", true);

  if (petIdFilter) {
    query = query.eq("id", petIdFilter);
  }

  const { data: pets } = await query;
  if (!pets?.length) {
    return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
  }

  const results = { processed: 0, anomalies_found: 0, errors: 0 };

  for (const pet of pets) {
    try {
      // Fetch today's health log
      const today = new Date().toISOString().split("T")[0];
      const { data: log } = await supabase
        .from("health_logs")
        .select("activity_level, appetite, stool_quality, coat_condition, eye_clarity, energy_level")
        .eq("pet_id", pet.id)
        .eq("log_date", today)
        .single();

      if (!log) continue;

      // Fetch baselines
      const { data: baselines } = await supabase
        .from("pet_baselines")
        .select("metric_name, baseline_mean, baseline_std, q1, q3, sample_count")
        .eq("pet_id", pet.id);

      if (!baselines?.length) continue;

      const anomalies = detectAnomalies(log as Record<string, number | null>, baselines);

      if (anomalies.length === 0) {
        results.processed++;
        continue;
      }

      // Dedup: don't create same anomaly type within 24h
      const { data: existing } = await supabase
        .from("anomaly_detections")
        .select("anomaly_type")
        .eq("pet_id", pet.id)
        .gte("detected_at", new Date(Date.now() - 86400000).toISOString());

      const existingTypes = new Set(existing?.map((e: { anomaly_type: string }) => e.anomaly_type) ?? []);

      const newAnomalies = anomalies.filter(
        (a) => !existingTypes.has(`${a.metric}_${a.severity}`)
      );

      if (newAnomalies.length === 0) {
        results.processed++;
        continue;
      }

      // Determine overall severity
      const maxSeverity = newAnomalies.reduce((max, a) => {
        const order = { mild: 0, moderate: 1, severe: 2 };
        return order[a.severity] > order[max] ? a.severity : max;
      }, "mild" as Severity);

      const anomalyType = newAnomalies.map((a) => `${a.metric}_${a.severity}`).join(",");

      const { error } = await supabase.from("anomaly_detections").insert({
        pet_id: pet.id,
        anomaly_type: anomalyType,
        severity: maxSeverity,
        confidence: Math.min(1, newAnomalies.length * 0.3 + 0.4),
        affected_metrics: newAnomalies,
        model_version: MODEL_VERSION,
      });

      if (!error) {
        results.anomalies_found++;
        // Trigger alert sending
        await supabase.functions.invoke("send-health-alerts", {
          body: { pet_id: pet.id, severity: maxSeverity },
        });
      }

      results.processed++;
    } catch {
      results.errors++;
    }
  }

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
