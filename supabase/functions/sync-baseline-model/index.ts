import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const METRICS = [
  "activity_level",
  "appetite",
  "stool_quality",
  "coat_condition",
  "eye_clarity",
  "energy_level",
] as const;

const MODEL_VERSION = "statistical-v1.0";
const WINDOW_DAYS = 30;

function computeStatistics(values: number[]): {
  mean: number;
  std: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
} {
  if (values.length === 0) {
    return { mean: 3, std: 1, min: 1, max: 5, q1: 2, q3: 4 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const mean = values.reduce((s, v) => s + v, 0) / n;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
  const std = Math.sqrt(variance);

  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];

  return {
    mean: Math.round(mean * 1000) / 1000,
    std: Math.round(std * 1000) / 1000,
    min: sorted[0],
    max: sorted[n - 1],
    q1,
    q3,
  };
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

  // Fetch all active pets
  const { data: pets } = await supabase
    .from("pets")
    .select("id")
    .eq("is_active", true);

  if (!pets?.length) {
    return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
  }

  const results = { processed: 0, updated: 0, errors: 0 };
  const windowStart = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString().split("T")[0];

  // Process in batches of 20
  const batchSize = 20;
  for (let i = 0; i < pets.length; i += batchSize) {
    const batch = pets.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (pet) => {
        try {
          const { data: logs } = await supabase
            .from("health_logs")
            .select(METRICS.join(", "))
            .eq("pet_id", pet.id)
            .gte("log_date", windowStart)
            .order("log_date", { ascending: false });

          if (!logs?.length) return;

          const upserts = METRICS.map((metric) => {
            const values = logs
              .map((log: Record<string, number | null>) => log[metric])
              .filter((v): v is number => v !== null && v !== undefined);

            if (values.length === 0) return null;

            const stats = computeStatistics(values);

            return {
              pet_id: pet.id,
              metric_name: metric,
              baseline_mean: stats.mean,
              baseline_std: stats.std,
              baseline_min: stats.min,
              baseline_max: stats.max,
              q1: stats.q1,
              q3: stats.q3,
              sample_count: values.length,
              computed_at: new Date().toISOString(),
              model_version: MODEL_VERSION,
            };
          }).filter(Boolean);

          if (upserts.length > 0) {
            const { error } = await supabase
              .from("pet_baselines")
              .upsert(upserts, { onConflict: "pet_id,metric_name" });

            if (!error) results.updated += upserts.length;
          }

          results.processed++;
        } catch {
          results.errors++;
        }
      })
    );

    // Respect Supabase rate limits between batches
    if (i + batchSize < pets.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(JSON.stringify({ ...results, timestamp: new Date().toISOString() }));

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
