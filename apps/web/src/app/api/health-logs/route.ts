import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const logSchema = z.object({
  pet_id: z.string().uuid(),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  activity_level: z.number().int().min(1).max(5).nullable().optional(),
  appetite: z.number().int().min(1).max(5).nullable().optional(),
  stool_quality: z.number().int().min(1).max(5).nullable().optional(),
  coat_condition: z.number().int().min(1).max(5).nullable().optional(),
  eye_clarity: z.number().int().min(1).max(5).nullable().optional(),
  energy_level: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const petId = searchParams.get("pet_id");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 90);

  if (!petId) return NextResponse.json({ error: "pet_id required" }, { status: 400 });

  const { data: pet } = await supabase
    .from("pets")
    .select("id")
    .eq("id", petId)
    .eq("owner_id", user.id)
    .single();

  if (!pet) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("health_logs")
    .select("*")
    .eq("pet_id", petId)
    .order("log_date", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = logSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: pet } = await supabase
    .from("pets")
    .select("id")
    .eq("id", parsed.data.pet_id)
    .eq("owner_id", user.id)
    .single();

  if (!pet) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("health_logs")
    .upsert(
      { ...parsed.data, logged_by: user.id },
      { onConflict: "pet_id,log_date" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
