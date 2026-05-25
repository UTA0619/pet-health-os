import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Download, Trash2, User } from "lucide-react";

export default async function AccountPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", user.id)
    .single();

  const isPro =
    subscription?.plan === "pro" && subscription?.status !== "cancelled";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">アカウント</h1>

      {/* Account info */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
            <User className="h-4 w-4" /> アカウント情報
          </h2>
          <div className="space-y-1">
            <div className="text-xs text-zinc-500">メールアドレス</div>
            <div className="text-sm font-medium text-zinc-900">{user.email}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs text-zinc-500">プラン</div>
              <div
                className={`text-sm font-semibold ${
                  isPro ? "text-emerald-600" : "text-zinc-700"
                }`}
              >
                {isPro ? "Proプラン" : "フリープラン"}
              </div>
            </div>
            {!isPro && (
              <Button size="sm" asChild>
                <Link href="/upgrade">プランをアップグレード</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data management */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          <h2 className="font-semibold text-zinc-900">データ管理</h2>
          <Link
            href="/api/account/export"
            className="flex items-center justify-between py-3 text-sm text-zinc-700 hover:text-zinc-900 border-b border-zinc-100"
          >
            <span className="flex items-center gap-2">
              <Download className="h-4 w-4 text-zinc-400" />
              データをエクスポート
            </span>
            <ChevronRight className="h-4 w-4 text-zinc-400" />
          </Link>
          <Link
            href="/account/delete"
            className="flex items-center justify-between py-3 text-sm text-red-600 hover:text-red-700"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              アカウントを削除
            </span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
