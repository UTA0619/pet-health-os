import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  void request;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check subscription tier — report is Pro only
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscription?.tier !== "pro") {
    return NextResponse.json({ error: "Pro機能です" }, { status: 403 });
  }

  // Rate limit: 5 report exports per day
  const today = new Date().toISOString().slice(0, 10);
  const limitResult = await rateLimit(
    `${user.id}:report:${today}`,
    5,
    24 * 60 * 60 * 1000
  );

  if (!limitResult.success) {
    return NextResponse.json(
      { error: "Daily report limit reached (5 per day)", resetAt: limitResult.resetAt },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(limitResult.resetAt / 1000)),
          "Retry-After": String(Math.ceil((limitResult.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Fetch all active pets
  const { data: pets } = await supabase
    .from("pets")
    .select("*")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const petIds = (pets ?? []).map((p) => p.id);

  // Fetch health logs (last 90 days) for all pets
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().slice(0, 10);

  const { data: healthLogs } =
    petIds.length > 0
      ? await supabase
          .from("health_logs")
          .select("*")
          .in("pet_id", petIds)
          .gte("log_date", ninetyDaysAgoStr)
          .order("log_date", { ascending: false })
      : { data: [] };

  // Fetch health scores (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

  const { data: healthScores } =
    petIds.length > 0
      ? await supabase
          .from("health_scores")
          .select("*")
          .in("pet_id", petIds)
          .gte("score_date", thirtyDaysAgoStr)
          .order("score_date", { ascending: false })
      : { data: [] };

  // Fetch unresolved anomaly detections
  const { data: anomalies } =
    petIds.length > 0
      ? await supabase
          .from("anomaly_detections")
          .select("*")
          .in("pet_id", petIds)
          .is("resolved_at", null)
          .order("detected_at", { ascending: false })
      : { data: [] };

  return NextResponse.json({
    profile,
    pets: pets ?? [],
    healthLogs: healthLogs ?? [],
    healthScores: healthScores ?? [],
    anomalies: anomalies ?? [],
    generatedAt: new Date().toISOString(),
  });
}
