import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  daily_score_reminder: z.boolean().optional(),
  anomaly_alerts: z.boolean().optional(),
  weekly_report: z.boolean().optional(),
  health_tips: z.boolean().optional(),
  line_notify_token: z.string().max(200).optional().nullable(),
  line_enabled: z.boolean().optional(),
  whatsapp_phone: z.string().max(20).optional().nullable(),
  whatsapp_enabled: z.boolean().optional(),
  reminder_hour: z.number().int().min(0).max(23).optional(),
});

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json(data ?? {});
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("notification_preferences")
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
