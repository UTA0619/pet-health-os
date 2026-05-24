import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  computeHealthScore,
  METRIC_LABELS,
  DISCLAIMER,
  type HealthLog,
} from "@/lib/ai/health-score";

export default async function ReportPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check Pro subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier")
    .eq("user_id", user.id)
    .maybeSingle();

  const isPro = subscription?.tier === "pro";

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Fetch all active pets
  const { data: pets } = await supabase
    .from("pets")
    .select("*")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const petIds = (pets ?? []).map((p: { id: string }) => p.id);

  // Fetch health logs (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().slice(0, 10);

  const { data: healthLogsRaw } =
    petIds.length > 0
      ? await supabase
          .from("health_logs")
          .select("*")
          .in("pet_id", petIds)
          .gte("log_date", ninetyDaysAgoStr)
          .order("log_date", { ascending: false })
      : { data: [] };

  // Fetch unresolved anomalies
  const { data: anomalies } =
    petIds.length > 0
      ? await supabase
          .from("anomaly_detections")
          .select("*")
          .in("pet_id", petIds)
          .is("resolved_at", null)
          .order("detected_at", { ascending: false })
      : { data: [] };

  const healthLogs = healthLogsRaw ?? [];

  const generatedAt = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const speciesLabel: Record<string, string> = {
    dog: "犬",
    cat: "猫",
    rabbit: "うさぎ",
    bird: "鳥",
    reptile: "爬虫類",
    other: "その他",
  };

  return (
    <>
      <style>{`@media print { body { -webkit-print-color-adjust: exact; } }`}</style>
      <div className="max-w-3xl mx-auto px-6 py-8 font-sans text-zinc-900">
        {/* Print Button */}
        <div className="print:hidden mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-700">健康レポート</h1>
          {isPro ? (
            <button
              onClick={() => window.print()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              印刷 / PDF保存
            </button>
          ) : (
            <div className="text-sm text-zinc-500 bg-zinc-100 px-4 py-2 rounded-lg">
              Proプランでレポートを出力できます
            </div>
          )}
        </div>

        {!isPro ? (
          <div className="print:hidden text-center py-16 border-2 border-dashed border-zinc-200 rounded-2xl">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-lg font-semibold text-zinc-800">Proプラン限定機能</p>
            <p className="text-sm text-zinc-500 mt-2">
              健康レポートのPDF出力はProプランでご利用いただけます
            </p>
            <a
              href="/upgrade"
              className="mt-4 inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              アップグレード
            </a>
          </div>
        ) : (
          <>
            {/* Report Header */}
            <div className="border-b-2 border-emerald-600 pb-6 mb-8">
              <h1 className="text-3xl font-black text-zinc-900">ペット健康レポート</h1>
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-zinc-500">
                  オーナー: {profile?.display_name ?? profile?.full_name ?? user.email}
                </p>
                <p className="text-sm text-zinc-500">作成日: {generatedAt}</p>
              </div>
            </div>

            {(pets ?? []).length === 0 ? (
              <p className="text-zinc-500 text-center py-12">ペットが登録されていません</p>
            ) : (
              (pets ?? []).map((pet: {
                id: string;
                name: string;
                species: string;
                breed?: string | null;
                birth_date?: string | null;
                photo_url?: string | null;
              }) => {
                const petLogs: HealthLog[] = healthLogs
                  .filter((l: { pet_id: string }) => l.pet_id === pet.id)
                  .map((l: HealthLog) => ({
                    log_date: l.log_date,
                    activity_level: l.activity_level,
                    appetite: l.appetite,
                    stool_quality: l.stool_quality,
                    coat_condition: l.coat_condition,
                    eye_clarity: l.eye_clarity,
                    energy_level: l.energy_level,
                  }));

                const last30Logs = petLogs.slice(0, 30);
                const score = computeHealthScore(last30Logs);

                const petAnomalies = (anomalies ?? []).filter(
                  (a: { pet_id: string }) => a.pet_id === pet.id
                );

                // Build 30-day score trend table (last 10 entries for readability)
                const trendRows = petLogs.slice(0, 10).map((log) => {
                  const s = computeHealthScore([log]);
                  return {
                    date: log.log_date,
                    overall: s ? Math.round(s.overall) : null,
                    components: s?.components,
                  };
                });

                return (
                  <div key={pet.id} className="mb-12 break-inside-avoid">
                    {/* Pet Profile */}
                    <section className="mb-6">
                      <div className="flex items-center gap-4">
                        {pet.photo_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={pet.photo_url}
                            alt={pet.name}
                            className="h-16 w-16 rounded-full object-cover border-2 border-emerald-200"
                          />
                        )}
                        <div>
                          <h2 className="text-2xl font-bold text-zinc-900">{pet.name}</h2>
                          <p className="text-sm text-zinc-500">
                            {speciesLabel[pet.species] ?? pet.species}
                            {pet.breed ? ` · ${pet.breed}` : ""}
                            {pet.birth_date
                              ? ` · 誕生日: ${new Date(pet.birth_date + "T00:00:00").toLocaleDateString("ja-JP")}`
                              : ""}
                          </p>
                        </div>
                        {score && (
                          <div className="ml-auto text-right">
                            <p className="text-xs text-zinc-500 mb-0.5">現在のスコア</p>
                            <p
                              className={`text-4xl font-black ${
                                score.overall >= 80
                                  ? "text-emerald-600"
                                  : score.overall >= 60
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {Math.round(score.overall)}
                            </p>
                            <p className="text-xs text-zinc-400">/100</p>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* 30-day Score Trend Table */}
                    <section className="mb-6">
                      <h3 className="text-base font-semibold text-zinc-800 border-b border-zinc-200 pb-1 mb-3">
                        スコアトレンド（直近10件）
                      </h3>
                      {trendRows.length === 0 ? (
                        <p className="text-sm text-zinc-400">記録がありません</p>
                      ) : (
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-zinc-50">
                              <th className="text-left p-2 border border-zinc-200 font-semibold">日付</th>
                              <th className="text-center p-2 border border-zinc-200 font-semibold">総合</th>
                              {Object.keys(METRIC_LABELS).map((k) => (
                                <th key={k} className="text-center p-2 border border-zinc-200 font-semibold">
                                  {METRIC_LABELS[k as keyof typeof METRIC_LABELS]}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {trendRows.map((row) => (
                              <tr key={row.date} className="even:bg-zinc-50">
                                <td className="p-2 border border-zinc-200">{row.date}</td>
                                <td
                                  className={`text-center p-2 border border-zinc-200 font-semibold ${
                                    row.overall !== null && row.overall >= 80
                                      ? "text-emerald-700"
                                      : row.overall !== null && row.overall >= 60
                                      ? "text-yellow-700"
                                      : "text-red-700"
                                  }`}
                                >
                                  {row.overall ?? "—"}
                                </td>
                                {Object.keys(METRIC_LABELS).map((k) => (
                                  <td key={k} className="text-center p-2 border border-zinc-200">
                                    {row.components?.[k as keyof typeof METRIC_LABELS] !== undefined
                                      ? Math.round(row.components[k as keyof typeof METRIC_LABELS])
                                      : "—"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </section>

                    {/* Anomaly History */}
                    <section className="mb-6">
                      <h3 className="text-base font-semibold text-zinc-800 border-b border-zinc-200 pb-1 mb-3">
                        異常検知履歴
                      </h3>
                      {petAnomalies.length === 0 ? (
                        <p className="text-sm text-zinc-400">未解決の異常はありません ✓</p>
                      ) : (
                        <div className="space-y-2">
                          {petAnomalies.map((a: {
                            id: string;
                            detected_at: string;
                            severity: string;
                            anomaly_type?: string;
                          }) => (
                            <div
                              key={a.id}
                              className={`p-3 rounded-lg border text-sm ${
                                a.severity === "severe"
                                  ? "bg-red-50 border-red-200 text-red-800"
                                  : a.severity === "moderate"
                                  ? "bg-amber-50 border-amber-200 text-amber-800"
                                  : "bg-yellow-50 border-yellow-200 text-yellow-800"
                              }`}
                            >
                              <span className="font-semibold">
                                {a.severity === "severe"
                                  ? "重度"
                                  : a.severity === "moderate"
                                  ? "中度"
                                  : "軽度"}
                              </span>{" "}
                              — {new Date(a.detected_at).toLocaleDateString("ja-JP")}
                              {a.anomaly_type && (
                                <span className="text-xs ml-2 opacity-70">({a.anomaly_type})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    {/* Recommendations */}
                    <section className="mb-6">
                      <h3 className="text-base font-semibold text-zinc-800 border-b border-zinc-200 pb-1 mb-3">
                        推奨事項
                      </h3>
                      <ul className="space-y-1.5 text-sm text-zinc-700">
                        {score && score.overall >= 80 && (
                          <li className="flex gap-2">
                            <span className="text-emerald-500 mt-0.5">✓</span>
                            <span>健康状態は良好です。引き続き毎日の記録を続けてください。</span>
                          </li>
                        )}
                        {score && score.overall < 60 && (
                          <li className="flex gap-2">
                            <span className="text-red-500 mt-0.5">!</span>
                            <span>スコアが低下しています。獣医師への相談をご検討ください。</span>
                          </li>
                        )}
                        {score && score.trend === "declining" && (
                          <li className="flex gap-2">
                            <span className="text-amber-500 mt-0.5">↓</span>
                            <span>スコアが低下傾向にあります。食欲・活動量の変化に注意してください。</span>
                          </li>
                        )}
                        {petAnomalies.length > 0 && (
                          <li className="flex gap-2">
                            <span className="text-red-500 mt-0.5">⚠</span>
                            <span>未解決の異常が{petAnomalies.length}件あります。獣医師への相談を推奨します。</span>
                          </li>
                        )}
                        {petLogs.length < 7 && (
                          <li className="flex gap-2">
                            <span className="text-zinc-400 mt-0.5">→</span>
                            <span>記録が少ないため、スコアの精度を上げるために毎日の記録をお勧めします。</span>
                          </li>
                        )}
                        <li className="flex gap-2">
                          <span className="text-zinc-400 mt-0.5">·</span>
                          <span>このレポートはAI分析に基づくものであり、獣医師の診断に代わるものではありません。</span>
                        </li>
                      </ul>
                    </section>
                  </div>
                );
              })
            )}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-zinc-200 text-xs text-zinc-400 text-center">
              <p>{DISCLAIMER}</p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
