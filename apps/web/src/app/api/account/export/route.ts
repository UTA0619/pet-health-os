import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 1 export per hour per user
  const limitResult = await rateLimit(`export:${user.id}`, 1, 60 * 60 * 1000);
  if (!limitResult.success) {
    logger.warn("gdpr_export_rate_limited", { user_id: user.id });
    return NextResponse.json(
      {
        error: "Export rate limit exceeded. Try again in 1 hour.",
        resetAt: limitResult.resetAt,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((limitResult.resetAt - Date.now()) / 1000)
          ),
        },
      }
    );
  }

  try {
    // Fetch profile and pets first
    const [{ data: profile }, { data: pets, error: petsError }] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("pets").select("*").eq("owner_id", user.id),
      ]);

    if (petsError) {
      logger.error("gdpr_export_pets_error", {
        user_id: user.id,
        error: petsError.message,
      });
    }

    const petIds = (pets ?? []).map((p: { id: string }) => p.id);

    const since365 = new Date();
    since365.setDate(since365.getDate() - 365);
    const since365Str = since365.toISOString().slice(0, 10);

    const [
      { data: healthLogs },
      { data: healthScores },
      { data: anomalyDetections },
    ] = await (petIds.length > 0
      ? Promise.all([
          supabase
            .from("health_logs")
            .select("*")
            .in("pet_id", petIds)
            .gte("log_date", since365Str)
            .order("log_date", { ascending: false }),
          supabase
            .from("health_scores")
            .select("*")
            .in("pet_id", petIds)
            .order("score_date", { ascending: false }),
          supabase
            .from("anomaly_detections")
            .select("*")
            .in("pet_id", petIds)
            .order("detected_at", { ascending: false }),
        ])
      : Promise.resolve([{ data: [] }, { data: [] }, { data: [] }]));

    const exportPayload = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profile ?? null,
      pets: pets ?? [],
      health_logs: healthLogs ?? [],
      health_scores: healthScores ?? [],
      anomaly_detections: anomalyDetections ?? [],
    };

    logger.info("gdpr_export_completed", {
      user_id: user.id,
      pets_count: (pets ?? []).length,
      health_logs_count: (healthLogs ?? []).length,
    });

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="pet-health-data-${user.id}.json"`,
      },
    });
  } catch (err) {
    logger.error("gdpr_export_failed", {
      user_id: user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Export failed. Please try again later." },
      { status: 500 }
    );
  }
}
