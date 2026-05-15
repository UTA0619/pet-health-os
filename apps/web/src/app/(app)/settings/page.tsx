"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LogOut, ChevronRight, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [email, setEmail] = useState<string>("");
  const [isPro, setIsPro] = useState(false);
  const [notifications, setNotifications] = useState({
    daily_score: true,
    anomaly_alerts: true,
    weekly_report: false,
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", user.id)
        .single();
      if (sub?.plan === "pro" && sub?.status === "active") setIsPro(true);

      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (prefs) {
        setNotifications({
          daily_score: prefs.daily_score_reminder ?? true,
          anomaly_alerts: prefs.anomaly_alerts ?? true,
          weekly_report: prefs.weekly_report ?? false,
        });
      }
    }
    load();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function updateNotification(key: keyof typeof notifications, value: boolean) {
    setNotifications((prev) => ({ ...prev, [key]: value }));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const field = key === "daily_score" ? "daily_score_reminder" : key === "anomaly_alerts" ? "anomaly_alerts" : "weekly_report";
    await supabase.from("notification_preferences").upsert(
      { user_id: user.id, [field]: value },
      { onConflict: "user_id" }
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <h1 className="text-xl font-bold text-zinc-900">設定</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">アカウント</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-zinc-600">メールアドレス</span>
            <span className="text-sm font-medium text-zinc-900 truncate ml-4 max-w-[200px]">{email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-zinc-100">
            <span className="text-sm text-zinc-600">プラン</span>
            {isPro ? (
              <Badge className="flex items-center gap-1">
                <Crown className="h-3 w-3" /> Pro
              </Badge>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Free</Badge>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  アップグレード
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">通知設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "daily_score" as const, label: "毎日の健康スコア", desc: "毎朝8時に通知" },
            { key: "anomaly_alerts" as const, label: "異常検出アラート", desc: "問題を検出したらすぐに通知" },
            { key: "weekly_report" as const, label: "週次レポート", desc: "毎週月曜日にサマリー通知" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">{label}</Label>
                <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
              </div>
              <Switch
                checked={notifications[key]}
                onCheckedChange={(v) => updateNotification(key, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 space-y-1">
          {[
            { label: "プライバシーポリシー", href: "#" },
            { label: "利用規約", href: "#" },
            { label: "お問い合わせ", href: "#" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="flex items-center justify-between py-3 text-sm text-zinc-700 hover:text-zinc-900 border-b border-zinc-100 last:border-0"
            >
              {label}
              <ChevronRight className="h-4 w-4 text-zinc-400" />
            </a>
          ))}
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200" onClick={handleSignOut}>
        <LogOut className="h-4 w-4" />
        ログアウト
      </Button>

      <p className="text-xs text-zinc-400 text-center">Pet Health OS v1.0.0</p>
    </div>
  );
}
