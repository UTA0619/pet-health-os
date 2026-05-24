"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { METRIC_LABELS, type MetricKey } from "@/lib/ai/health-score";
import { metricLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const METRICS = Object.keys(METRIC_LABELS) as MetricKey[];

const METRIC_DESCRIPTIONS: Record<MetricKey, string> = {
  activity_level: "散歩や遊びの量",
  appetite: "食欲と食事量",
  stool_quality: "排便の状態",
  coat_condition: "被毛の艶と清潔感",
  eye_clarity: "目の輝きと清潔感",
  energy_level: "全体的な元気さ",
};

export default function LogPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [petId, setPetId] = useState<string | null>(null);
  const [petName, setPetName] = useState<string>("");
  const [values, setValues] = useState<Record<MetricKey, number>>({
    activity_level: 3,
    appetite: 3,
    stool_quality: 3,
    coat_condition: 3,
    eye_clarity: 3,
    energy_level: 3,
  });
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [todayLogged, setTodayLogged] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pets } = await supabase
        .from("pets")
        .select("id, name")
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (!pets) {
        router.push("/onboarding");
        return;
      }
      setPetId(pets.id);
      setPetName(pets.name);

      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("health_logs")
        .select("*")
        .eq("pet_id", pets.id)
        .eq("log_date", today)
        .single();

      if (existing) {
        setTodayLogged(true);
        setValues({
          activity_level: existing.activity_level ?? 3,
          appetite: existing.appetite ?? 3,
          stool_quality: existing.stool_quality ?? 3,
          coat_condition: existing.coat_condition ?? 3,
          eye_clarity: existing.eye_clarity ?? 3,
          energy_level: existing.energy_level ?? 3,
        });
        setNotes(existing.notes ?? "");
      }
    }
    load();
  }, [supabase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!petId) return;
    setLoading(true);

    const today = new Date().toISOString().split("T")[0];
    try {
      const res = await fetch("/api/health-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pet_id: petId,
          log_date: today,
          activity_level: values.activity_level,
          appetite: values.appetite,
          stool_quality: values.stool_quality,
          coat_condition: values.coat_condition,
          eye_clarity: values.eye_clarity,
          energy_level: values.energy_level,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
      toast.success("今日の健康記録を保存しました！");
      router.push("/dashboard");
    } catch {
      toast.error("記録の保存に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-900">
          {petName ? `${petName}の` : ""}今日の健康記録
        </h1>
        <p className="text-sm text-zinc-500 mt-1">各項目を1〜5で評価してください</p>
      </div>

      {todayLogged && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 mb-4">
          <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm text-emerald-700">今日はすでに記録済みです。更新できます。</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {METRICS.map((metric) => (
          <Card key={metric}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {METRIC_LABELS[metric]}
                <span className="ml-2 text-sm font-normal text-zinc-500">
                  {METRIC_DESCRIPTIONS[metric]}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2" role="group" aria-label={`${METRIC_LABELS[metric]}のレベル選択`}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-label={`${METRIC_LABELS[metric]} ${v}: ${metricLabel(v)}`}
                    aria-pressed={values[metric] === v}
                    onClick={() => {
                      setValues((prev) => ({ ...prev, [metric]: v }));
                      // Haptic feedback on mobile
                      if ("vibrate" in navigator) navigator.vibrate(10);
                    }}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      values[metric] === v
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-zinc-100 hover:border-zinc-200"
                    }`}
                  >
                    <span className="text-xl" aria-hidden="true">{metricLabel(v).split(" ")[0]}</span>
                    <span className="text-xs text-zinc-500">{v}</span>
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-zinc-600 mt-2 h-5">
                {metricLabel(values[metric])}
              </p>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">メモ（任意）</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="気になること、特記事項など..."
              maxLength={500}
              rows={3}
              aria-label="メモ（任意）"
              aria-describedby="notes-count"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 resize-none"
            />
            <p id="notes-count" className="text-xs text-zinc-400 text-right mt-1">{notes.length}/500</p>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          記録を保存してスコアを計算
        </Button>
      </form>
    </div>
  );
}
