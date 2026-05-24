import { describe, it, expect } from 'vitest';
import { computeBaselines, DEFAULT_BASELINES, type BaselineResult } from './baselines';
import type { HealthLog } from './health-score';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const METRICS = [
  'activity_level', 'appetite', 'stool_quality',
  'coat_condition', 'eye_clarity', 'energy_level',
] as const;

function makeLog(date: string, value: number | null = 3): HealthLog {
  return {
    log_date: date,
    activity_level: value,
    appetite: value,
    stool_quality: value,
    coat_condition: value,
    eye_clarity: value,
    energy_level: value,
  };
}

// 7 distinct logs on different dates
function sevenDayLogs(value = 3): HealthLog[] {
  return Array.from({ length: 7 }, (_, i) =>
    makeLog(`2026-05-${String(i + 1).padStart(2, '0')}`, value)
  );
}

// ---------------------------------------------------------------------------
// DEFAULT_BASELINES
// ---------------------------------------------------------------------------
describe('DEFAULT_BASELINES', () => {
  it('has an entry for every metric', () => {
    for (const m of METRICS) {
      expect(DEFAULT_BASELINES).toHaveProperty(m);
    }
  });

  it('all defaults have positive std', () => {
    for (const m of METRICS) {
      expect(DEFAULT_BASELINES[m].std).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// computeBaselines — fallback (< 7 distinct days)
// ---------------------------------------------------------------------------
describe('computeBaselines — fallback path (< 7 days)', () => {
  it('returns defaults for empty logs', () => {
    const results = computeBaselines([]);
    expect(results).toHaveLength(METRICS.length);
    for (const r of results) {
      const def = DEFAULT_BASELINES[r.metric_name as keyof typeof DEFAULT_BASELINES];
      expect(r.baseline_value).toBe(def.mean);
      expect(r.std_deviation).toBe(def.std);
    }
  });

  it('returns 6 results (one per metric)', () => {
    expect(computeBaselines([])).toHaveLength(6);
  });

  it('uses defaults when fewer than 7 distinct days', () => {
    const logs = Array.from({ length: 6 }, (_, i) =>
      makeLog(`2026-05-${String(i + 1).padStart(2, '0')}`)
    );
    const results = computeBaselines(logs);
    const activityResult = results.find((r) => r.metric_name === 'activity_level')!;
    expect(activityResult.baseline_value).toBe(DEFAULT_BASELINES.activity_level.mean);
    expect(activityResult.std_deviation).toBe(DEFAULT_BASELINES.activity_level.std);
  });

  it('sample_count reflects actual non-null values even in fallback', () => {
    const logs = [makeLog('2026-05-01', 3), makeLog('2026-05-02', null)];
    const results = computeBaselines(logs);
    const actResult = results.find((r) => r.metric_name === 'activity_level')!;
    // Only 1 non-null value for activity_level
    expect(actResult.sample_count).toBe(1);
  });

  it('uses fallback when metric is all null across logs', () => {
    const logs: HealthLog[] = Array.from({ length: 10 }, (_, i) => ({
      log_date: `2026-05-${String(i + 1).padStart(2, '0')}`,
      activity_level: null,
      appetite: 3,
      stool_quality: 3,
      coat_condition: 3,
      eye_clarity: 3,
      energy_level: 3,
    }));
    const results = computeBaselines(logs);
    const actResult = results.find((r) => r.metric_name === 'activity_level')!;
    // 0 distinct days for activity_level, should use fallback
    expect(actResult.baseline_value).toBe(DEFAULT_BASELINES.activity_level.mean);
  });
});

// ---------------------------------------------------------------------------
// computeBaselines — computed path (>= 7 distinct days)
// ---------------------------------------------------------------------------
describe('computeBaselines — computed path (>= 7 days)', () => {
  it('computes correct mean for uniform values', () => {
    const logs = sevenDayLogs(4);
    const results = computeBaselines(logs);
    const actResult = results.find((r) => r.metric_name === 'activity_level')!;
    expect(actResult.baseline_value).toBeCloseTo(4, 3);
  });

  it('computes std = 0 for uniform values', () => {
    const logs = sevenDayLogs(3);
    const results = computeBaselines(logs);
    const actResult = results.find((r) => r.metric_name === 'activity_level')!;
    expect(actResult.std_deviation).toBe(0);
  });

  it('computes correct mean for varied values', () => {
    // Values: 1,2,3,4,5,3,3 on 7 distinct days — mean = 21/7 = 3
    const values = [1, 2, 3, 4, 5, 3, 3];
    const logs: HealthLog[] = values.map((v, i) => ({
      log_date: `2026-05-${String(i + 1).padStart(2, '0')}`,
      activity_level: v,
      appetite: v,
      stool_quality: v,
      coat_condition: v,
      eye_clarity: v,
      energy_level: v,
    }));
    const results = computeBaselines(logs);
    const actResult = results.find((r) => r.metric_name === 'activity_level')!;
    expect(actResult.baseline_value).toBeCloseTo(3, 3);
  });

  it('q1 <= baseline_value <= q3 for varied data', () => {
    const logs = sevenDayLogs(3);
    // Add variety
    const variedLogs: HealthLog[] = [
      makeLog('2026-05-01', 1),
      makeLog('2026-05-02', 2),
      makeLog('2026-05-03', 3),
      makeLog('2026-05-04', 4),
      makeLog('2026-05-05', 5),
      makeLog('2026-05-06', 2),
      makeLog('2026-05-07', 4),
    ];
    const results = computeBaselines(variedLogs);
    const r = results.find((r) => r.metric_name === 'activity_level')!;
    expect(r.q1).toBeLessThanOrEqual(r.baseline_value);
    expect(r.q3).toBeGreaterThanOrEqual(r.baseline_value);
  });

  it('sample_count matches number of non-null values', () => {
    const logs = sevenDayLogs(3);
    const results = computeBaselines(logs);
    const actResult = results.find((r) => r.metric_name === 'activity_level')!;
    expect(actResult.sample_count).toBe(7);
  });

  it('values are rounded to 3 decimal places', () => {
    const values = [1, 2, 3, 4, 5, 3, 2];
    const logs: HealthLog[] = values.map((v, i) => ({
      log_date: `2026-05-${String(i + 1).padStart(2, '0')}`,
      activity_level: v,
      appetite: v,
      stool_quality: v,
      coat_condition: v,
      eye_clarity: v,
      energy_level: v,
    }));
    const results = computeBaselines(logs);
    for (const r of results) {
      for (const field of ['baseline_value', 'std_deviation', 'q1', 'q3'] as const) {
        const val = r[field];
        const str = String(val);
        const decimals = str.includes('.') ? str.split('.')[1].length : 0;
        expect(decimals).toBeLessThanOrEqual(3);
      }
    }
  });

  it('multiple logs on same date are included in sample_count but not distinct days', () => {
    // 6 distinct dates + 2 logs on same date = 7 logs, but only 6 distinct days
    const logs: HealthLog[] = [
      makeLog('2026-05-01', 3),
      makeLog('2026-05-01', 4), // duplicate date
      makeLog('2026-05-02', 3),
      makeLog('2026-05-03', 3),
      makeLog('2026-05-04', 3),
      makeLog('2026-05-05', 3),
      makeLog('2026-05-06', 3),
    ];
    // Only 6 distinct dates → fallback
    const results = computeBaselines(logs);
    const actResult = results.find((r) => r.metric_name === 'activity_level')!;
    expect(actResult.baseline_value).toBe(DEFAULT_BASELINES.activity_level.mean);
  });

  it('7 distinct dates triggers computed path', () => {
    const logs: HealthLog[] = [
      makeLog('2026-05-01', 3),
      makeLog('2026-05-01', 4), // duplicate date — doesn't count
      makeLog('2026-05-02', 3),
      makeLog('2026-05-03', 3),
      makeLog('2026-05-04', 3),
      makeLog('2026-05-05', 3),
      makeLog('2026-05-06', 3),
      makeLog('2026-05-07', 3), // now 7 distinct dates
    ];
    const results = computeBaselines(logs);
    const actResult = results.find((r) => r.metric_name === 'activity_level')!;
    // Should be computed, not default
    expect(actResult.baseline_value).not.toBe(DEFAULT_BASELINES.activity_level.mean);
  });
});

// ---------------------------------------------------------------------------
// percentile (internal) — tested via q1/q3
// ---------------------------------------------------------------------------
describe('computeBaselines — percentile correctness', () => {
  it('q1 and q3 of [1,2,3,4,5,3,4] are reasonable', () => {
    const values = [1, 2, 3, 4, 5, 3, 4];
    const sorted = [...values].sort((a, b) => a - b); // [1,2,3,3,4,4,5]
    const logs: HealthLog[] = values.map((v, i) => ({
      log_date: `2026-05-${String(i + 1).padStart(2, '0')}`,
      activity_level: v,
      appetite: v,
      stool_quality: v,
      coat_condition: v,
      eye_clarity: v,
      energy_level: v,
    }));
    const results = computeBaselines(logs);
    const r = results.find((x) => x.metric_name === 'activity_level')!;
    expect(r.q1).toBeLessThan(r.q3);
    expect(r.q1).toBeGreaterThanOrEqual(1);
    expect(r.q3).toBeLessThanOrEqual(5);
  });
});
