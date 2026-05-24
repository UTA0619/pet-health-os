import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { computeHealthScore, type HealthLog, type ScoreResult } from "@/lib/ai/health-score";
import { computeConfidence, confidenceLabel } from "@/lib/ai/confidence";
import { cache, CACHE_TTL } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = await Promise.resolve(request.nextUrl.searchParams);
  const petId = searchParams.get("pet_id");
  const baselineAgeDaysParam = searchParams.get("baseline_age_days");
  const baselineAgeDays = baselineAgeDaysParam !== null
    ? Math.max(0, parseInt(baselineAgeDaysParam, 10) || 0)
    : 0;

  if (!petId) return NextResponse.json({ error: "pet_id required" }, { status: 400 });

  const { data: pet } = await supabase
    .from("pets")
    .select("id")
    .eq("id", petId)
    .eq("owner_id", user.id)
    .single();

  if (!pet) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const dateStr = new Date().toISOString().slice(0, 10);
  const cacheKey = `health-score:${petId}:${dateStr}`;
  const cached = cache.get<ScoreResult & { confidence: number; confidenceLabel: string }>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const { data: logsRaw } = await supabase
    .from("health_logs")
    .select("log_date,activity_level,appetite,stool_quality,coat_condition,eye_clarity,energy_level")
    .eq("pet_id", petId)
    .order("log_date", { ascending: false })
    .limit(30);

  const logs: HealthLog[] = logsRaw ?? [];
  const score = computeHealthScore(logs);

  if (!score) return NextResponse.json({ noData: true }, { status: 200 });

  const confidenceScore = computeConfidence(logs, baselineAgeDays);
  const result = {
    ...score,
    confidence: confidenceScore,
    confidenceLabel: confidenceLabel(confidenceScore),
  };
  cache.set(cacheKey, result, CACHE_TTL.HEALTH_SCORE);
  return NextResponse.json(result);
}
