import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendLineNotify } from "@/lib/notifications/line";

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await request.json().catch(() => ({}));
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const result = await sendLineNotify(
    token,
    "\nPet Health OSからのテスト通知です🐾\nLINE通知が正常に設定されました！"
  );

  if (result.status === 200) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: result.message }, { status: 400 });
}
