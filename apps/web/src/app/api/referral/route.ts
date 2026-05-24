import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/referral — fetch current user's referral code + stats
 * POST /api/referral/generate — (same route, handled via GET upsert logic)
 */
export async function GET(request: NextRequest) {
  void request;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch profile — referral_code may or may not exist yet
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("referral_code, referral_count, email")
    .eq("id", user.id)
    .single();

  if (error) {
    logger.error("referral GET: profile fetch failed", { error: error.message });
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Generate code if missing
  if (!profile.referral_code) {
    const code = generateReferralCode(user.id);
    const service = createServiceClient();
    await service
      .from("profiles")
      .update({ referral_code: code })
      .eq("id", user.id);
    profile.referral_code = code;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
  const referralUrl = `${baseUrl}/?ref=${profile.referral_code}`;

  return NextResponse.json({
    code: profile.referral_code,
    url: referralUrl,
    count: profile.referral_count ?? 0,
  });
}

/** POST /api/referral — record a referral attribution on sign-up */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as { newUserId: string; referralCode: string };
  const { newUserId, referralCode } = body;

  if (!newUserId || !referralCode) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const service = createServiceClient();

  // Find referrer by code
  const { data: referrer } = await service
    .from("profiles")
    .select("id, referral_count")
    .eq("referral_code", referralCode)
    .single();

  if (!referrer) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
  }

  // Prevent self-referral
  if (referrer.id === newUserId) {
    return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
  }

  // Record attribution on new user's profile
  await service
    .from("profiles")
    .update({ referred_by: referrer.id })
    .eq("id", newUserId);

  // Increment referral count on referrer
  await service
    .from("profiles")
    .update({ referral_count: (referrer.referral_count ?? 0) + 1 })
    .eq("id", referrer.id);

  logger.info("referral attributed", { referrerId: referrer.id, newUserId });

  return NextResponse.json({ ok: true });
}

// ─── helpers ────────────────────────────────────────────────────────────────

function generateReferralCode(userId: string): string {
  // 8-char alphanumeric derived from userId + timestamp
  const seed = userId.replace(/-/g, "").slice(0, 8) + Date.now().toString(36);
  return seed
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("")
    .toUpperCase()
    .slice(0, 8);
}
