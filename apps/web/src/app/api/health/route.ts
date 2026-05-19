import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const checks = { status: "ok", timestamp: new Date().toISOString(), services: {} as Record<string, string> };

  try {
    const supabase = await createServerClient();
    await supabase.from("profiles").select("id").limit(1);
    checks.services.database = "ok";
  } catch {
    checks.services.database = "error";
    checks.status = "degraded";
  }

  checks.services.openai = process.env.OPENAI_API_KEY ? "configured" : "missing";
  checks.services.stripe = process.env.STRIPE_SECRET_KEY ? "configured" : "missing";

  return NextResponse.json(checks, {
    status: checks.status === "ok" ? 200 : 503
  });
}
