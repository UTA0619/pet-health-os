import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { UpgradeToast } from "./upgrade-toast";
import {
  computeHealthScore,
  computeStreak,
  computeAchievements,
  METRIC_LABELS,
  DISCLAIMER,
  type HealthLog,
} from "@/lib/ai/health-score";
import { scoreToColor } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedScore } from "@/components/animated-score";

// Simple SVG sparkline — no recharts dependency
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 120, h = 40;
  const points = values.map((v, i) => ({
    x: (i / (values.length - 1)) * w,
    y: h - ((v - min) / range) * h,
  }));
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load all active pets
  const { data: pets } = await supabase
    .from("pets")
    .select("id, name, species, breed, photo_url")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (!pets?.length) redirect("/onboarding");

  const pet = pets[0];

  // Load last 30 health logs
  const { data: logsRaw } = await supabase
    .from("health_logs")
    .select("*")
    .eq("pet_id", pet.id)
    .order("log_date", { ascending: false })
    .limit(30);

  // Load unresolved anomalies
  const { data: anomalies } = await supabase
    .from("anomaly_detections")
    .select("*")
    .eq("pet_id", pet.id)
    .is("resolved_at", null)
    .order("detected_at", { ascending: false })
    .limit(3);

  // All log dates for streak computation (last 365 days)
  const { data: allLogDates } = await supabase
    .from("health_logs")
    .select("log_date")
    .eq("pet_id", pet.id)
    .order("log_date", { ascending: false })
    .limit(365);

  // Camera scan count
  const { count: cameraScanCount } = await supabase
    .from("camera_analyses")
    .select("id", { count: "exact", head: true })
    .eq("pet_id", pet.id);

  const logs: HealthLog[] = (logsRaw ?? []).map((l) => ({
    log_date: l.log_date,
    activity_level: l.activity_level,
    appetite: l.appetite,
    stool_quality: l.stool_quality,
    coat_condition: l.coat_condition,
    eye_clarity: l.eye_clarity,
    energy_level: l.energy_level,
  }));

  // Streak & achievements computation
  const logDatesList = (allLogDates ?? []).map((l) => l.log_date);
  const streak = computeStreak(logDatesList);
  const totalLogs = logDatesList.length;

  const maxScore =
    logs.length > 0
      ? Math.max(...logs.map((l) => computeHealthScore([l])?.overall ?? 0))
      : 0;

  const achievements = computeAchievements({
    streak,
    totalLogs,
    maxScore,
    hasCameraScan: (cameraScanCount ?? 0) > 0,
  });

  // Only compute score when we have real data
  const score = logs.length > 0 ? computeHealthScore(logs) : null;
  const recentLogs = logs.slice(0, 5);

  const today = new Date().toISOString().split("T")[0];
  const todayLogged = recentLogs.some((l) => l.log_date === today);

  const speciesEmoji: Record<string, string> = {
    dog: "🐕",
    cat: "🐈",
    rabbit: "🐰",
    bird: "🐦",
    reptile: "🦎",
    other: "🐾",
  };

  const sparklineValues = logs
    .slice(0, 14)
    .reverse()
    .map((l) => computeHealthScore([l])?.overall ?? 50);

  const sparkColor =
    score === null
      ? "#a1a1aa"
      : score.overall >= 80
      ? "#10b981"
      : score.overall >= 60
      ? "#eab308"
      : "#ef4444";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">
      <Suspense>
        <UpgradeToast />
      </Suspense>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">
            {speciesEmoji[pet.species] ?? "🐾"} {pet.name}のダッシュボード
          </h1>
          <p className="text-sm text-zinc-500">今日も元気に過ごせますように</p>
        </div>
        <div className="flex items-center gap-3">
          {pets.length > 1 && (
            <Link href="/pets" className="text-sm text-emerald-600 font-medium">
              ペット切替
            </Link>
          )}
          {pet.photo_url && (
            <img
              src={pet.photo_url}
              alt={pet.name}
              className="h-11 w-11 rounded-full object-cover border-2 border-emerald-200 flex-shrink-0"
            />
          )}
        </div>
      </div>

      {/* Streak Banner */}
      {streak > 0 && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl ${
            streak >= 7
              ? "bg-gradient-to-r from-orange-400 to-red-500"
              : streak >= 3
              ? "bg-gradient-to-r from-orange-300 to-orange-500"
              : "bg-gradient-to-r from-amber-200 to-orange-300"
          } text-white shadow-sm`}
        >
          <div>
            <p className="text-sm font-medium opacity-90">連続記録中 🔥</p>
            <p className="text-3xl font-black">{streak}日</p>
          </div>
          <div className="text-right">
            <p className="text-4xl">{streak >= 30 ? "🏆" : streak >= 7 ? "🔥🔥" : "🔥"}</p>
            <p className="text-xs opacity-75 mt-1">
              {streak >= 30
                ? "伝説的！"
                : streak >= 7
                ? "素晴らしい！"
                : streak >= 3
                ? "いい調子！"
                : "継続しよう！"}
            </p>
          </div>
        </div>
      )}

      {/* Anomaly Alerts */}
      {anomalies && anomalies.length > 0 && (
        <div className="space-y-2">
          {anomalies.map((a) => (
            <div
              key={a.id}
              className={`flex items-start gap-3 p-3 rounded-xl border ${
                a.severity === "severe"
                  ? "bg-red-50 border-red-200"
                  : a.severity === "moderate"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-yellow-50 border-yellow-200"
              }`}
            >
              <AlertTriangle
                className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                  a.severity === "severe"
                    ? "text-red-500"
                    : a.severity === "moderate"
                    ? "text-amber-500"
                    : "text-yellow-500"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900">
                  {a.severity === "severe"
                    ? "重大な異常"
                    : a.severity === "moderate"
                    ? "要注意の変化"
                    : "軽度の変化"}
                  を検出
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">
                  {new Date(a.detected_at).toLocaleDateString("ja-JP")} —
                  獣医師への相談をご検討ください
                </p>
              </div>
              <Badge
                variant={
                  a.severity === "severe"
                    ? "destructive"
                    : a.severity === "moderate"
                    ? "warning"
                    : "outline"
                }
                className="flex-shrink-0"
              >
                {a.severity === "severe" ? "重度" : a.severity === "moderate" ? "中度" : "軽度"}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Health Score Card */}
      <Card className="overflow-hidden animate-fade-in-up">
        <CardContent className="pt-6">
          {score ? (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">AIヘルススコア</p>
                  <div className="flex items-end gap-2">
                    <AnimatedScore
                      score={Math.round(score.overall)}
                      className={`text-6xl font-black tabular-nums ${scoreToColor(score.overall)}`}
                    />
                    <span className="text-2xl text-zinc-400 mb-1">/100</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    {score.trend === "improving" ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : score.trend === "declining" ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <Minus className="h-4 w-4 text-zinc-400" />
                    )}
                    <span className="text-xs text-zinc-500">
                      {score.trend === "improving"
                        ? "改善中"
                        : score.trend === "declining"
                        ? "低下傾向"
                        : "安定"}
                      {score.trendDelta !== 0 && (
                        <span
                          className={score.trendDelta > 0 ? "text-emerald-500" : "text-red-500"}
                        >
                          {" "}
                          ({score.trendDelta > 0 ? "+" : ""}
                          {score.trendDelta.toFixed(1)})
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-zinc-400 ml-1">
                      · 信頼度 {Math.round(score.confidence * 100)}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <Sparkline values={sparklineValues} color={sparkColor} />
                  <p className="text-xs text-zinc-400 mt-1">直近{sparklineValues.length}日</p>
                </div>
              </div>

              {/* Component scores */}
              <div className="mt-5 grid grid-cols-3 gap-2">
                {(Object.entries(score.components) as [string, number][]).map(([key, val]) => (
                  <div key={key} className="text-center p-2 rounded-lg bg-zinc-50">
                    <p className="text-xs text-zinc-500 mb-1">
                      {METRIC_LABELS[key as keyof typeof METRIC_LABELS]}
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        val >= 70
                          ? "text-emerald-600"
                          : val >= 50
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {Math.round(val)}
                    </p>
                  </div>
                ))}
              </div>

              {score.confidence < 0.5 && (
                <p className="text-xs text-zinc-400 mt-3 text-center">
                  毎日記録するとスコアの精度が上がります
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">📊</div>
              <p className="font-semibold text-zinc-900">まだデータがありません</p>
              <p className="text-sm text-zinc-500 mt-1">毎日記録するとAIスコアが計算されます</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in-up">
        <Link
          href="/log"
          className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-colors ${
            todayLogged
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-zinc-200 hover:border-emerald-300 text-zinc-700"
          }`}
        >
          <span className="text-2xl mb-1">{todayLogged ? "✅" : "📝"}</span>
          <span className="text-sm font-medium">
            {todayLogged ? "今日記録済み" : "今日の記録"}
          </span>
        </Link>
        <Link
          href="/camera"
          className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-zinc-200 hover:border-emerald-300 text-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="カメラ診断"
        >
          <Camera className="h-6 w-6 mb-1" aria-hidden="true" />
          <span className="text-sm font-medium">カメラ診断</span>
        </Link>
      </div>

      {/* Recent Logs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-zinc-900">最近の記録</h2>
          <Link href="/log" className="text-sm text-emerald-600">
            すべて見る
          </Link>
        </div>
        {recentLogs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-zinc-500 text-sm">まだ記録がありません</p>
              <Link
                href="/log"
                className="text-emerald-600 text-sm font-medium mt-2 inline-block"
              >
                最初の記録を追加 →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => {
              const logScore = computeHealthScore([log]);
              return (
                <Card key={log.log_date}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {new Date(log.log_date + "T00:00:00").toLocaleDateString("ja-JP", {
                          month: "long",
                          day: "numeric",
                          weekday: "short",
                        })}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        活動: {log.activity_level}/5 · 食欲: {log.appetite}/5 · 元気:{" "}
                        {log.energy_level}/5
                      </p>
                    </div>
                    <span className={`text-lg font-bold ${scoreToColor(logScore?.overall ?? 50)}`}>
                      {logScore ? Math.round(logScore.overall) : "-"}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Achievements */}
      <div>
        <h2 className="font-semibold text-zinc-900 mb-3">実績バッジ</h2>
        <div className="grid grid-cols-3 gap-2">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all ${
                a.earned
                  ? "bg-gradient-to-b from-amber-50 to-yellow-50 border border-amber-200 shadow-sm"
                  : "bg-zinc-50 border border-zinc-100 opacity-40"
              }`}
            >
              <span className="text-2xl">{a.emoji}</span>
              <span className="text-[10px] font-medium leading-tight text-zinc-700">{a.label}</span>
              {a.earned && <span className="text-[9px] text-amber-600 font-semibold">✓ 達成</span>}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-zinc-400 text-center leading-relaxed">{DISCLAIMER}</p>
    </div>
  );
}
