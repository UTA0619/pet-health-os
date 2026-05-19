import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { language } = await request.json().catch(() => ({}));
  if (!["ja", "en"].includes(language)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ preferred_language: language })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ language });
}
