"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n";
import { Mail, Phone, Bell, Globe, LogOut, ChevronRight, Download, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const supabase = createBrowserClient();
  const router = useRouter();
  const { t } = useI18n();

  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [subscription, setSubscription] = useState<{ plan: string; status: string } | null>(null);
  // Notification prefs state
  const [prefs, setPrefs] = useState({
    daily_score_reminder: true,
    anomaly_alerts: true,
    weekly_report: true,
    health_tips: false,
    email_enabled: true,
    whatsapp_phone: "",
    whatsapp_enabled: false,
    reminder_hour: 20,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const [subRes, prefsRes] = await Promise.all([
        supabase.from("subscriptions").select("plan, status").eq("user_id", user.id).single(),
        fetch("/api/notifications/preferences").then((r) => r.json()),
      ]);

      if (subRes.data) setSubscription(subRes.data);
      if (prefsRes && !prefsRes.error) {
        setPrefs((p) => ({ ...p, ...prefsRes }));
      }
    }
    load();
  }, [supabase]);

  async function savePrefs(updates: Partial<typeof prefs>) {
    setSavingPrefs(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Save failed");
      setPrefs((p) => ({ ...p, ...updates }));
      toast.success(t.common.success);
    } catch {
      toast.error(t.common.error);
    } finally {
      setSavingPrefs(false);
    }
  }

  function handleUpgrade() {
    router.push("/upgrade");
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/account/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pet-health-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('データをエクスポートしました');
    } catch {
      toast.error('エクスポートに失敗しました');
    } finally {
      setExporting(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isPro = subscription?.plan === "pro" && subscription?.status !== "cancelled";

  const HOURS = [6, 7, 8, 9, 18, 19, 20, 21, 22];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">{t.settings.title}</h1>

      {/* Account */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
            <span>👤</span> {t.settings.account}
          </h2>
          <div className="text-sm text-zinc-500">{t.settings.email}</div>
          <div className="text-sm font-medium text-zinc-900">{user?.email}</div>
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-sm text-zinc-500">{t.settings.plan}</div>
              <div className={`text-sm font-semibold mt-0.5 ${isPro ? "text-emerald-600" : "text-zinc-700"}`}>
                {isPro ? t.settings.pro : t.settings.free}
              </div>
            </div>
            {!isPro && (
              <Button size="sm" onClick={handleUpgrade}>
                {t.settings.upgrade}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
            <Globe className="h-4 w-4" /> {t.settings.language}
          </h2>
          <LanguageSwitcher />
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
            <Bell className="h-4 w-4" /> {t.settings.notifications}
          </h2>
          {[
            { key: "daily_score_reminder" as const, label: t.settings.dailyReminder },
            { key: "anomaly_alerts" as const, label: t.settings.anomalyAlerts },
            { key: "weekly_report" as const, label: t.settings.weeklyReport },
            { key: "health_tips" as const, label: t.settings.healthTips },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="text-sm text-zinc-700 cursor-pointer">{label}</Label>
              <Switch
                checked={prefs[key]}
                onCheckedChange={(v) => savePrefs({ [key]: v })}
              />
            </div>
          ))}
          <div className="pt-2 border-t border-zinc-100">
            <Label className="text-sm text-zinc-500 mb-2 block">{t.settings.reminderTime}</Label>
            <div className="flex flex-wrap gap-2">
              {HOURS.map((h) => (
                <button
                  key={h}
                  onClick={() => savePrefs({ reminder_hour: h })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    prefs.reminder_hour === h
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  {h}:00
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-500" /> {t.settings.emailNotif}
          </h2>
          <p className="text-xs text-zinc-500">
            {t.settings.emailHint}（{user?.email}）
          </p>
          <div className="flex items-center justify-between">
            <Label className="text-sm text-zinc-700">{t.settings.emailEnabled}</Label>
            <Switch
              checked={prefs.email_enabled}
              onCheckedChange={(v) => savePrefs({ email_enabled: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
            <Phone className="h-4 w-4 text-green-600" /> {t.settings.whatsapp}
          </h2>
          <div className="space-y-2">
            <Label className="text-sm text-zinc-600">{t.settings.whatsappPhone}</Label>
            <Input
              type="tel"
              placeholder="+819012345678"
              value={prefs.whatsapp_phone ?? ""}
              onChange={(e) => setPrefs((p) => ({ ...p, whatsapp_phone: e.target.value }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm text-zinc-700">{t.settings.whatsappEnabled}</Label>
            <Switch
              checked={prefs.whatsapp_enabled}
              onCheckedChange={(v) => {
                setPrefs((p) => ({ ...p, whatsapp_enabled: v }));
                savePrefs({ whatsapp_phone: prefs.whatsapp_phone, whatsapp_enabled: v });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card>
        <CardContent className="pt-5 divide-y divide-zinc-100">
          {[
            { label: t.settings.privacy, href: "/privacy" },
            { label: t.settings.terms, href: "/terms" },
            { label: t.settings.contact, href: "mailto:support@pethealthos.com" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="flex items-center justify-between py-3 text-sm text-zinc-700 hover:text-zinc-900"
            >
              {label}
              <ChevronRight className="h-4 w-4 text-zinc-400" />
            </a>
          ))}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          <h2 className="font-semibold text-zinc-900">データ管理</h2>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-zinc-700"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download className="h-4 w-4" />
            {exporting ? 'エクスポート中...' : 'データをエクスポート'}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={() => router.push('/account/delete')}
          >
            <Trash2 className="h-4 w-4" />
            アカウントを削除
          </Button>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Button
        variant="outline"
        className="w-full text-zinc-600"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4" />
        {t.settings.signOut}
      </Button>
    </div>
  );
}
