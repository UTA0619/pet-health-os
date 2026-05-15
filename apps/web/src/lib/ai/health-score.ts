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

export function computeHealthScore(logs: HealthLog[]): ScoreResult {
  if (logs.length === 0) {
    return {
      overall: 0,
      components: Object.fromEntries(Object.keys(WEIGHTS).map((k) => [k, 50])) as Record<MetricKey, number>,
      trend: "stable",
      trendDelta: 0,
      confidence: 0,
    };
  }

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
