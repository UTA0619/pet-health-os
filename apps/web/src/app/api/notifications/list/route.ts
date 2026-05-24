import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all pets owned by user
  const { data: pets, error: petsError } = await supabase
    .from("pets")
    .select("id, name")
    .eq("owner_id", user.id)
    .eq("is_active", true);

  if (petsError) return NextResponse.json({ error: petsError.message }, { status: 500 });
  if (!pets || pets.length === 0) return NextResponse.json([]);

  const petIds = pets.map((p) => p.id);
  const petMap: Record<string, string> = Object.fromEntries(pets.map((p) => [p.id, p.name]));

  const { data, error } = await supabase
    .from("anomaly_detections")
    .select("id, pet_id, anomaly_type, severity, affected_metrics, detected_at, alert_sent")
    .in("pet_id", petIds)
    .order("detected_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const notifications = (data ?? []).map((row) => ({
    id: row.id,
    pet_id: row.pet_id,
    pet_name: petMap[row.pet_id] ?? "不明",
    anomaly_type: row.anomaly_type,
    severity: row.severity,
    affected_metrics: row.affected_metrics,
    detected_at: row.detected_at,
    alert_sent: row.alert_sent,
  }));

  return NextResponse.json(notifications);
}
