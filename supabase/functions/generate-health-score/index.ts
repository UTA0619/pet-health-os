import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

const WEIGHTS = {
  activity_level: 0.20,
  appetite: 0.20,
  stool_quality: 0.15,
  coat_condition: 0.15,
  eye_clarity: 0.15,
  energy_level: 0.15,
};

const MODEL_VERSION = "v1.0";

interface HealthLog {
  log_date: string;
  activity_level: number | null;
  appetite: number | null;
  stool_quality: number | null;
  coat_condition: number | null;
  eye_clarity: number | null;
  energy_level: number | null;
}

function computeScore(logs: HealthLog[]): {
  overall: number;
  components: Record<string, number>;
  confidence: number;
  trend: "improving" | "stable" | "declining";
  trendDelta: number;
} {
  const latest = logs[0];
  const components: Record<string, number> = {};
  let filledMetrics = 0;

  for (const [metric, weight] of Object.entries(WEIGHTS)) {
    const value = latest[metric as keyof HealthLog] as number | null;
    if (value !== null && value !== undefined) {
      // Normalize 1–5 to 0–100
      components[metric] = ((value - 1) / 4) * 100;
      filledMetrics++;
    } else {
      components[metric] = 50; // neutral fallback
    }
  }

  const overall = Object.entries(WEIGHTS).reduce(
    (sum, [metric, weight]) => sum + components[metric] * weight,
    0
  );

  const confidence = Math.min(1, (filledMetrics / 6) * (Math.min(logs.length, 14) / 14));

  // Trend: linear regression on last 7 days of overall scores
  let trend: "improving" | "stable" | "declining" = "stable";
  let trendDelta = 0;

  if (logs.length >= 3) {
    const recentLogs = logs.slice(0, 7);
    const scores = recentLogs.map((log, i) => {
      const score = Object.entries(WEIGHTS).reduce((sum, [metric, w]) => {
        const v = log[metric as keyof HealthLog] as number | null;
        return sum + ((v ?? 3) - 1) / 4 * 100 * w;
      }, 0);
      return { i, score };
    });

    if (scores.length >= 2) {
      trendDelta = scores[0].score - scores[scores.length - 1].score;
      if (trendDelta > 5) trend = "improving";
      else if (trendDelta < -5) trend = "declining";
    }
  }

  return { overall: Math.round(overall * 10) / 10, components, confidence, trend, trendDelta };
}

async function generateExplanation(
  petName: string,
  score: number,
  components: Record<string, number>,
  trend: string
): Promise<string> {
  const weakMetrics = Object.entries(components)
    .filter(([, v]) => v < 60)
    .map(([k]) => k.replace(/_/g, " "))
    .slice(0, 2);

  if (weakMetrics.length === 0) {
    return `${petName} is doing great today! All health metrics are in the healthy range.`;
  }

  const prompt = `You are a pet health assistant. In 1–2 warm, non-alarmist sentences, explain why ${petName}'s health score is ${Math.round(score)}/100 today. The weaker areas are: ${weakMetrics.join(" and ")}. Trend is ${trend}. Do NOT give medical diagnoses. Recommend consulting a vet only if score < 40. Be encouraging.`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: `<system>Pet health assistant</system>\n<request>${prompt}</request>` }],
    max_tokens: 128,
    temperature: 0.7,
  });

  return res.choices[0]?.message?.content?.trim() ?? `${petName}'s health score is ${Math.round(score)}/100.`;
}

serve(async (req) => {
  // Called by DB webhook on health_log INSERT or by cron
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const cronSecret = req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("authorization");

  // Accept either cron secret or service role JWT
  if (
    cronSecret !== Deno.env.get("CRON_SECRET") &&
    authHeader !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const petId: string | undefined = body.pet_id ?? body.record?.pet_id;

  if (!petId) {
    return new Response(JSON.stringify({ error: "pet_id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch pet info
    const { data: pet } = await supabase
      .from("pets")
      .select("id, name, owner_id")
      .eq("id", petId)
      .single();

    if (!pet) {
      return new Response(JSON.stringify({ error: "Pet not found" }), { status: 404 });
    }

    // Fetch last 30 health logs
    const { data: logs } = await supabase
      .from("health_logs")
      .select("log_date, activity_level, appetite, stool_quality, coat_condition, eye_clarity, energy_level")
      .eq("pet_id", petId)
      .order("log_date", { ascending: false })
      .limit(30);

    if (!logs || logs.length === 0) {
      return new Response(JSON.stringify({ error: "No health logs found" }), { status: 404 });
    }

    const { overall, components, confidence, trend, trendDelta } = computeScore(logs);

    const explanation = confidence > 0.3
      ? await generateExplanation(pet.name, overall, components, trend)
      : `${pet.name} needs more health logs for a complete score. Keep logging daily!`;

    const today = new Date().toISOString().split("T")[0];

    const { data: score, error } = await supabase
      .from("health_scores")
      .upsert({
        pet_id: petId,
        score_date: today,
        overall_score: overall,
        component_scores: components,
        trend_direction: trend,
        trend_delta: trendDelta,
        confidence,
        explanation,
        model_version: MODEL_VERSION,
      }, { onConflict: "pet_id,score_date" })
      .select()
      .single();

    if (error) throw error;

    // Broadcast via Supabase Realtime
    await supabase.channel(`pet:${petId}`).send({
      type: "broadcast",
      event: "health_score_updated",
      payload: { score },
    });

    return new Response(JSON.stringify({ score }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(JSON.stringify({ error: String(err), pet_id: petId }));
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});
