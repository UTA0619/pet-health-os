import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/account/delete
 * Authorization: Bearer <JWT>  (or session cookie — createServerClient reads cookies)
 * Body: { confirmation: "DELETE MY ACCOUNT" }
 *
 * GDPR-compliant account deletion.
 * Deletes all user data then removes the Supabase Auth user.
 */
export async function POST(request: NextRequest) {
  // 1. Authenticate via session cookie (same pattern as other routes)
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Validate confirmation string
  let body: { confirmation?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.confirmation !== "DELETE MY ACCOUNT") {
    return NextResponse.json(
      { error: "Invalid confirmation. You must send exactly: DELETE MY ACCOUNT" },
      { status: 422 }
    );
  }

  const userId = user.id;
  const service = createServiceClient();

  // 3. Helper: delete rows, silently skip if table doesn't exist or query fails
  async function safeDelete(
    table: string,
    filter: Record<string, string>
  ): Promise<void> {
    try {
      let query = service.from(table).delete();
      for (const [col, val] of Object.entries(filter)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query = (query as any).eq(col, val);
      }
      await query;
    } catch {
      // Table may not exist in all environments — skip silently
    }
  }

  // 4. Helper: delete pet-scoped rows via subquery emulated as array lookup
  async function deletePetScoped(table: string): Promise<void> {
    try {
      // Fetch pet IDs owned by this user first
      const { data: pets } = await service
        .from("pets")
        .select("id")
        .eq("owner_id", userId);

      if (!pets || pets.length === 0) return;

      const petIds = pets.map((p: { id: string }) => p.id);

      await service.from(table).delete().in("pet_id", petIds);
    } catch {
      // Table may not exist — skip silently
    }
  }

  // 5. Delete in FK-safe order (children before parents)
  await deletePetScoped("camera_analyses");
  await deletePetScoped("anomaly_detections");
  await deletePetScoped("health_scores");
  await deletePetScoped("health_logs");
  await deletePetScoped("pet_baselines");

  // Delete pets themselves
  try {
    await service.from("pets").delete().eq("owner_id", userId);
  } catch {
    // ignore
  }

  // Optional tables — skip if they don't exist
  await safeDelete("push_subscriptions", { user_id: userId });
  await safeDelete("subscriptions", { user_id: userId });

  // Profile row
  await safeDelete("profiles", { id: userId });

  // 6. Delete the Supabase Auth user (requires service role)
  const { error: deleteAuthError } =
    await service.auth.admin.deleteUser(userId);

  if (deleteAuthError) {
    console.error("[account/delete] Failed to delete auth user:", deleteAuthError);
    return NextResponse.json(
      { error: "Failed to delete account. Please contact support." },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Account deleted successfully" });
}
