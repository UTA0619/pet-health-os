export const WEIGHTS = {
  activity_level: 0.20,
  appetite: 0.20,
  stool_quality: 0.15,
  coat_condition: 0.15,
  eye_clarity: 0.15,
  energy_level: 0.15,
} as const;

export type MetricKey = keyof typeof WEIGHTS;

export interface HealthLog {
  log_date: string;
  activity_level: number | null;
  appetite: number | null;
  stool_quality: number | null;
  coat_condition: number | null;
  eye_clarity: number | null;
  energy_level: number | null;
}

export interface ScoreResult {
  overall: number;
  components: Record<MetricKey, number>;
  trend: "improving" | "stable" | "declining";
  trendDelta: number;
  confidence: number;
}

export function computeHealthScore(logs: HealthLog[]): ScoreResult | null {
  if (logs.length === 0) return null;

  const latest = logs[0];
  const components = {} as Record<MetricKey, number>;
  let filledCount = 0;

  for (const metric of Object.keys(WEIGHTS) as MetricKey[]) {
    const value = latest[metric];
    if (value !== null && value !== undefined) {
      components[metric] = Math.round(((value - 1) / 4) * 100);
      filledCount++;
    } else {
      components[metric] = 50;
    }
  }

  const overall = Object.entries(WEIGHTS).reduce(
    (sum, [metric, weight]) => sum + components[metric as MetricKey] * weight,
    0
  );

  const confidence = Math.min(
    1,
    (filledCount / 6) * (Math.min(logs.length, 14) / 14)
  );

  // Trend: compare latest 3 logs vs previous 3 logs
  let trend: ScoreResult["trend"] = "stable";
  let trendDelta = 0;

  if (logs.length >= 3) {
    const scoreOf = (log: HealthLog) =>
      Object.entries(WEIGHTS).reduce((s, [m, w]) => {
        const v = log[m as MetricKey];
        return s + ((v ?? 3) - 1) / 4 * 100 * w;
      }, 0);

    const recent = logs.slice(0, Math.min(3, logs.length));
    const older = logs.slice(Math.min(3, logs.length), Math.min(6, logs.length));

    if (older.length > 0) {
      const recentAvg = recent.reduce((s, l) => s + scoreOf(l), 0) / recent.length;
      const olderAvg = older.reduce((s, l) => s + scoreOf(l), 0) / older.length;
      trendDelta = recentAvg - olderAvg;
      if (trendDelta > 5) trend = "improving";
      else if (trendDelta < -5) trend = "declining";
    }
  }

  return {
    overall: Math.round(overall * 10) / 10,
    components,
    trend,
    trendDelta: Math.round(trendDelta * 10) / 10,
    confidence: Math.round(confidence * 1000) / 1000,
  };
}

export const METRIC_LABELS: Record<MetricKey, string> = {
  activity_level: "活動量",
  appetite: "食欲",
  stool_quality: "排便",
  coat_condition: "被毛",
  eye_clarity: "目の状態",
  energy_level: "元気度",
};

export const DISCLAIMER =
  "※ このスコアはAIによる参考情報です。医療診断ではありません。異常を感じたら獣医師にご相談ください。";

/**
 * Compute current logging streak from sorted health logs (most recent first)
 */
export function computeStreak(logDates: string[]): number {
  if (!logDates.length) return 0;

  const today = new Date();
  // Use JST (UTC+9)
  const todayStr = new Date(today.getTime() + 9 * 60 * 60 * 1000)
    .toISOString().split("T")[0];
  const yesterdayDate = new Date(today.getTime() + 9 * 60 * 60 * 1000 - 86400000);
  const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

  const dateSet = new Set(logDates);

  // Start from today if logged, else from yesterday (still counts as active streak)
  const startDate: string | null = dateSet.has(todayStr) ? todayStr :
                                   dateSet.has(yesterdayStr) ? yesterdayStr : null;

  if (!startDate) return 0;

  let checkDate: string = startDate;
  let streak = 0;
  while (dateSet.has(checkDate)) {
    streak++;
    const d = new Date(checkDate + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() - 1);
    checkDate = d.toISOString().split("T")[0];
    if (streak > 365) break; // safety cap
  }
  return streak;
}

/**
 * Compute achievements based on logs and scores
 */
export function computeAchievements(params: {
  streak: number;
  totalLogs: number;
  maxScore: number;
  hasCameraScan: boolean;
}): { id: string; emoji: string; label: string; earned: boolean }[] {
  const { streak, totalLogs, maxScore, hasCameraScan } = params;
  return [
    { id: "first_log",   emoji: "📝", label: "初めての記録",       earned: totalLogs >= 1 },
    { id: "streak3",     emoji: "🔥", label: "3日連続記録",        earned: streak >= 3 },
    { id: "streak7",     emoji: "🔥🔥", label: "1週間連続記録",   earned: streak >= 7 },
    { id: "streak30",    emoji: "🏆", label: "30日連続記録",       earned: streak >= 30 },
    { id: "high_score",  emoji: "⭐", label: "スコア80以上達成",   earned: maxScore >= 80 },
    { id: "perfect",     emoji: "💎", label: "パーフェクトスコア", earned: maxScore >= 98 },
    { id: "camera",      emoji: "📸", label: "AIカメラ診断",       earned: hasCameraScan },
    { id: "logs10",      emoji: "📊", label: "10回記録達成",        earned: totalLogs >= 10 },
    { id: "logs30",      emoji: "🌟", label: "30回記録達成",        earned: totalLogs >= 30 },
  ];
}
