import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { computeBaselines } from "@/lib/ai/baselines";
import type { HealthLog } from "@/lib/ai/health-score";

export const maxDuration = 300; // 5 minutes — runs weekly, processes all pets

/**
 * GET /api/cron/sync-baseline-models
 * Scheduled: Sunday 02:00 UTC (weekly)
 * Recomputes per-pet baseline statistics for all active pets that have
 * 14+ days of health logs. Stores results in the pet_baselines table.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const startTime = Date.now();

  console.log("[cron/sync-baseline-models] starting weekly baseline sync");

  // Get all active pets
  const { data: pets, error: petsError } = await supabase
    .from("pets")
    .select("id, name, species")
    .eq("is_active", true);

  if (petsError) {
    console.error("[cron/sync-baseline-models] failed to fetch pets", petsError);
    return NextResponse.json({ error: "Failed to fetch pets" }, { status: 500 });
  }

  if (!pets || pets.length === 0) {
    return NextResponse.json({ processed: 0, skipped: 0, errors: 0, duration_ms: 0 });
  }

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const pet of pets) {
    try {
      // Fetch last 60 days of health logs
      const since = new Date();
      since.setDate(since.getDate() - 60);
      const sinceStr = since.toISOString().split("T")[0];

      const { data: logs, error: logsError } = await supabase
        .from("health_logs")
        .select(
          "id, pet_id, log_date, activity_level, appetite, stool_quality, coat_condition, eye_clarity, energy_level, weight_kg, notes, logged_by, created_at"
        )
        .eq("pet_id", pet.id)
        .gte("log_date", sinceStr)
        .order("log_date", { ascending: true });

      if (logsError) {
        console.error(`[cron/sync-baseline-models] logs error for pet ${pet.id}`, logsError);
        errors++;
        continue;
      }

      // Skip pets with < 14 days of data
      if (!logs || logs.length < 14) {
        skipped++;
        continue;
      }

      // computeBaselines expects HealthLog[] and returns BaselineResult[]
      const baselineResults = computeBaselines(logs as HealthLog[]);

      // Map BaselineResult[] → database upsert rows
      const baselineRows = baselineResults.map((b) => ({
        pet_id: pet.id,
        metric_name: b.metric_name,
        baseline_mean: b.baseline_value,
        baseline_std: b.std_deviation,
        q1: b.q1,
        q3: b.q3,
        sample_count: b.sample_count,
        computed_at: new Date().toISOString(),
        model_version: "statistical-v1.0",
      }));

      // Upsert baselines
      const { error: upsertError } = await supabase
        .from("pet_baselines")
        .upsert(baselineRows, { onConflict: "pet_id,metric_name" });

      if (upsertError) {
        console.error(`[cron/sync-baseline-models] upsert error for pet ${pet.id}`, upsertError);
        errors++;
      } else {
        processed++;
      }
    } catch (err) {
      console.error(`[cron/sync-baseline-models] unexpected error for pet ${pet.id}`, err);
      errors++;
    }
  }

  const duration_ms = Date.now() - startTime;
  console.log(
    `[cron/sync-baseline-models] completed — processed:${processed} skipped:${skipped} errors:${errors} duration:${duration_ms}ms`
  );

  return NextResponse.json({
    processed,
    skipped,
    errors,
    total: pets.length,
    duration_ms,
  });
}
