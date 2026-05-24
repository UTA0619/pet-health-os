"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const CONFIRMATION_PHRASE = "アカウントを削除する";

export default function DeleteAccountPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = inputValue === CONFIRMATION_PHRASE;

  async function handleDelete() {
    if (!isConfirmed) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE MY ACCOUNT" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "削除に失敗しました"
        );
      }

      // Sign out locally and redirect to home
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0" />
        <h1 className="text-xl font-bold text-zinc-900">アカウント削除</h1>
      </div>

      <Card className="border-red-200">
        <CardContent className="pt-5 space-y-4">
          {/* Warning message */}
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 space-y-2">
            <p className="text-sm font-semibold text-red-700">
              ⚠️ この操作は取り消せません。全てのデータが完全に削除されます。
            </p>
            <ul className="text-xs text-red-600 list-disc list-inside space-y-1">
              <li>ペットの健康記録・スコア・分析データ</li>
              <li>プロフィールおよびサブスクリプション情報</li>
              <li>プッシュ通知の設定</li>
              <li>アカウント情報（ログイン不可になります）</li>
            </ul>
          </div>

          {/* Confirmation input */}
          <div className="space-y-2">
            <p className="text-sm text-zinc-600">
              削除を確認するには、下のフィールドに{" "}
              <span className="font-semibold text-zinc-900">
                {CONFIRMATION_PHRASE}
              </span>{" "}
              と入力してください。
            </p>
            <Input
              type="text"
              placeholder={CONFIRMATION_PHRASE}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className={
                inputValue.length > 0 && !isConfirmed
                  ? "border-red-300 focus-visible:ring-red-400"
                  : isConfirmed
                  ? "border-emerald-400 focus-visible:ring-emerald-400"
                  : ""
              }
              disabled={loading}
              autoComplete="off"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="destructive"
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40"
              onClick={handleDelete}
              disabled={!isConfirmed || loading}
            >
              {loading ? "削除中…" : "アカウントを完全に削除する"}
            </Button>
            <Button
              variant="outline"
              className="w-full text-zinc-600 border-zinc-200 hover:bg-zinc-50"
              onClick={() => router.back()}
              disabled={loading}
            >
              キャンセル
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
