import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { computeHealthScore } from "@/lib/ai/health-score";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Get all active pets
  const { data: pets } = await supabase
    .from("pets")
    .select("id, owner_id")
    .eq("is_active", true);

  if (!pets?.length) return NextResponse.json({ processed: 0 });

  const today = new Date().toISOString().split("T")[0];
  let processed = 0;

  for (const pet of pets) {
    const { data: logs } = await supabase
      .from("health_logs")
      .select("*")
      .eq("pet_id", pet.id)
      .order("log_date", { ascending: false })
      .limit(30);

    if (!logs?.length) continue;

    const score = computeHealthScore(logs);
    if (!score) continue;

    await supabase.from("health_scores").upsert({
      pet_id: pet.id,
      score_date: today,
      overall_score: score.overall,
      component_scores: score.components,
      trend_direction: score.trend,
      confidence: score.confidence,
      model_version: "v1",
    }, { onConflict: "pet_id,score_date" });

    processed++;
  }

  return NextResponse.json({ processed });
}
