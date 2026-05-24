import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify the notification belongs to the authenticated user via pet ownership
  const { data: anomaly, error: fetchError } = await supabase
    .from("anomaly_detections")
    .select("id, pet_id")
    .eq("id", id)
    .single();

  if (fetchError || !anomaly) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check that the pet belongs to this user
  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("id")
    .eq("id", anomaly.pet_id)
    .eq("owner_id", user.id)
    .single();

  if (petError || !pet) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from("anomaly_detections")
    .update({ alert_sent: true })
    .eq("id", id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
