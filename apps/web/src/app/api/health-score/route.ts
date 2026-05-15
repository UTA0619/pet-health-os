import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { computeHealthScore, type HealthLog } from "@/lib/ai/health-score";

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const petId = searchParams.get("pet_id");
  if (!petId) return NextResponse.json({ error: "pet_id required" }, { status: 400 });

  const { data: pet } = await supabase
    .from("pets")
    .select("id")
    .eq("id", petId)
    .eq("owner_id", user.id)
    .single();

  if (!pet) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: logsRaw } = await supabase
    .from("health_logs")
    .select("log_date,activity_level,appetite,stool_quality,coat_condition,eye_clarity,energy_level")
    .eq("pet_id", petId)
    .order("log_date", { ascending: false })
    .limit(30);

  const logs: HealthLog[] = logsRaw ?? [];
  const score = computeHealthScore(logs);

  return NextResponse.json(score);
}
