import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { computeHealthScore, METRIC_LABELS, DISCLAIMER, type HealthLog } from "@/lib/ai/health-score";
import { scoreToColor, scoreToGradient, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Camera, PlusSquare } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pets } = await supabase
    .from("pets")
    .select("*")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (!pets || pets.length === 0) {
    redirect("/onboarding");
  }

  const pet = pets[0];

  const { data: logsRaw } = await supabase
    .from("health_logs")
    .select("*")
    .eq("pet_id", pet.id)
    .order("log_date", { ascending: false })
    .limit(30);

  const logs: HealthLog[] = (logsRaw ?? []).map((l) => ({
    log_date: l.log_date,
    activity_level: l.activity_level,
    appetite: l.appetite,
    stool_quality: l.stool_quality,
    coat_condition: l.coat_condition,
    eye_clarity: l.eye_clarity,
    energy_level: l.energy_level,
  }));

  const score = computeHealthScore(logs);

  const { data: anomalies } = await supabase
    .from("anomaly_detections")
    .select("*")
    .eq("pet_id", pet.id)
    .eq("alert_sent", false)
    .is("resolved_at", null)
    .order("detected_at", { ascending: false })
    .limit(3);

  const trendIcon = score.trend === "improving"
    ? <TrendingUp className="h-5 w-5 text-emerald-500" />
    : score.trend === "declining"
    ? <TrendingDown className="h-5 w-5 text-red-500" />
    : <Minus className="h-5 w-5 text-zinc-400" />;

  const trendLabel = score.trend === "improving" ? "改善中" : score.trend === "declining" ? "低下傾向" : "安定";
  const todayLogged = logs.length > 0 && logs[0].log_date === new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">{pet.name}の健康ダッシュボード</h1>
          <p className="text-sm text-zinc-500">{formatDate(new Date())}</p>
        </div>
        {pet.photo_url && (
          <img
            src={pet.photo_url}
            alt={pet.name}
            className="h-12 w-12 rounded-full object-cover border-2 border-emerald-200"
          />
        )}
      </div>

      {anomalies && anomalies.length > 0 && (
        <div className="space-y-2">
          {anomalies.map((a) => (
            <div
              key={a.id}
              className={`flex items-start gap-3 rounded-xl border p-3 ${
                a.severity === "severe" ? "border-red-200 bg-red-50" :
                a.severity === "moderate" ? "border-amber-200 bg-amber-50" :
                "border-yellow-200 bg-yellow-50"
              }`}
            >
              <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                a.severity === "severe" ? "text-red-500" :
                a.severity === "moderate" ? "text-amber-500" : "text-yellow-500"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900">
                  {a.anomaly_type === "z_score" ? "統計的異常" : "外れ値"} を検出
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">
                  獣医師への相談をご検討ください
                </p>
              </div>
              <Badge variant={a.severity === "severe" ? "destructive" : "warning"} className="flex-shrink-0">
                {a.severity === "severe" ? "重度" : a.severity === "moderate" ? "中度" : "軽度"}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="text-center mb-4">
            <div className={`text-7xl font-black ${scoreToColor(score.overall)} transition-all`}>
              {score.overall}
            </div>
            <div className="text-sm text-zinc-400 mt-1">/ 100</div>
            <div className="flex items-center justify-center gap-2 mt-2">
              {trendIcon}
              <span className="text-sm font-medium text-zinc-600">{trendLabel}</span>
              {score.trendDelta !== 0 && (
                <span className={`text-sm ${score.trendDelta > 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {score.trendDelta > 0 ? "+" : ""}{score.trendDelta}
                </span>
              )}
            </div>
            <div className="mt-2">
              <div className={`inline-block h-2 w-full max-w-[200px] rounded-full bg-gradient-to-r ${scoreToGradient(score.overall)}`} />
            </div>
            {score.confidence < 0.5 && (
              <p className="text-xs text-zinc-400 mt-2">
                データが不足しています。毎日記録することで精度が上がります
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            {Object.entries(score.components).map(([key, value]) => (
              <div key={key} className="text-center p-2 rounded-lg bg-zinc-50">
                <div className={`text-lg font-bold ${scoreToColor(value)}`}>{value}</div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {METRIC_LABELS[key as keyof typeof METRIC_LABELS]}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/log">
          <Button className="w-full" variant={todayLogged ? "secondary" : "default"}>
            <PlusSquare className="h-4 w-4" />
            {todayLogged ? "今日記録済み" : "今日の記録"}
          </Button>
        </Link>
        <Link href="/camera">
          <Button className="w-full" variant="outline">
            <Camera className="h-4 w-4" />
            カメラスキャン
          </Button>
        </Link>
      </div>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">最近の記録</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {logs.slice(0, 5).map((log) => {
              const s = computeHealthScore([log]);
              return (
                <div key={log.log_date} className="flex items-center justify-between py-1">
                  <span className="text-sm text-zinc-600">{formatDate(log.log_date)}</span>
                  <span className={`text-sm font-semibold ${scoreToColor(s.overall)}`}>
                    {s.overall}点
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-zinc-400 text-center leading-relaxed">{DISCLAIMER}</p>
    </div>
  );
}
