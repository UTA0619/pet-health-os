import type { HealthLog, MetricKey } from './health-score';

export interface BaselineResult {
  metric_name: string;
  baseline_value: number;
  std_deviation: number;
  q1: number;
  q3: number;
  sample_count: number;
}

// Fallback defaults used when fewer than 7 days of data are available.
// Values represent the middle of the 1-5 scale with moderate variance.
export const DEFAULT_BASELINES: Record<MetricKey, { mean: number; std: number }> = {
  activity_level: { mean: 3.5, std: 0.8 },
  appetite:       { mean: 3.5, std: 0.8 },
  stool_quality:  { mean: 3.5, std: 0.8 },
  coat_condition: { mean: 3.5, std: 0.8 },
  eye_clarity:    { mean: 3.5, std: 0.8 },
  energy_level:   { mean: 3.5, std: 0.8 },
};

const METRICS: MetricKey[] = [
  'activity_level',
  'appetite',
  'stool_quality',
  'coat_condition',
  'eye_clarity',
  'energy_level',
];

const MIN_SAMPLE_DAYS = 7;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

export function computeBaselines(logs: HealthLog[]): BaselineResult[] {
  const results: BaselineResult[] = [];

  for (const metric of METRICS) {
    const values = logs
      .map((l) => l[metric])
      .filter((v): v is number => v !== null && v !== undefined);

    // Unique log dates to count distinct days
    const distinctDays = new Set(logs.filter((l) => l[metric] !== null && l[metric] !== undefined).map((l) => l.log_date)).size;

    if (distinctDays < MIN_SAMPLE_DAYS) {
      const def = DEFAULT_BASELINES[metric];
      results.push({
        metric_name: metric,
        baseline_value: def.mean,
        std_deviation: def.std,
        q1: def.mean - def.std,
        q3: def.mean + def.std,
        sample_count: values.length,
      });
      continue;
    }

    const n = values.length;
    const mean = values.reduce((s, v) => s + v, 0) / n;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
    const std = Math.sqrt(variance);

    const sorted = [...values].sort((a, b) => a - b);
    const q1 = percentile(sorted, 25);
    const q3 = percentile(sorted, 75);

    results.push({
      metric_name: metric,
      baseline_value: Math.round(mean * 1000) / 1000,
      std_deviation: Math.round(std * 1000) / 1000,
      q1: Math.round(q1 * 1000) / 1000,
      q3: Math.round(q3 * 1000) / 1000,
      sample_count: n,
    });
  }

  return results;
}
