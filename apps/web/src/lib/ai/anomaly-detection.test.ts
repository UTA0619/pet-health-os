import { describe, it, expect } from 'vitest';
import { detectAnomalies, type AnomalyDetectionResult } from './anomaly-detection';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function baseline(metric_name: string, mean: number, std: number, q1?: number, q3?: number) {
  return { metric_name, baseline_value: mean, std_deviation: std, q1, q3 };
}

// ---------------------------------------------------------------------------
// No anomaly
// ---------------------------------------------------------------------------
describe('detectAnomalies — no anomaly', () => {
  it('returns empty anomalies when value equals mean', () => {
    const result = detectAnomalies(
      { activity_level: 3.5 },
      [baseline('activity_level', 3.5, 0.8, 2.7, 4.3)]
    );
    expect(result.anomalies).toHaveLength(0);
    expect(result.overallSeverity).toBe('none');
  });

  it('returns empty anomalies when value is within 2.5σ and within IQR bounds', () => {
    const result = detectAnomalies(
      { activity_level: 4.0 },
      [baseline('activity_level', 3.5, 0.8, 2.7, 4.3)]
    );
    // z = 0.5/0.8 = 0.625, not triggered
    expect(result.anomalies).toHaveLength(0);
    expect(result.overallSeverity).toBe('none');
  });

  it('skips metrics missing from currentValues', () => {
    const result = detectAnomalies(
      {},
      [baseline('activity_level', 3.5, 0.8)]
    );
    expect(result.anomalies).toHaveLength(0);
  });

  it('skips baselines with std <= 0', () => {
    const result = detectAnomalies(
      { activity_level: 1 },
      [baseline('activity_level', 3.5, 0)]
    );
    expect(result.anomalies).toHaveLength(0);
  });

  it('skips baselines with negative std', () => {
    const result = detectAnomalies(
      { activity_level: 1 },
      [baseline('activity_level', 3.5, -1)]
    );
    expect(result.anomalies).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// MILD (only one method triggers — z-score > 2.5 but IQR not triggered)
// ---------------------------------------------------------------------------
describe('detectAnomalies — MILD severity', () => {
  it('detects mild when only z-score triggered (no q1/q3)', () => {
    // z = (1 - 3.5) / 0.8 = -3.125, absZ > 2.5 but <= 3.5; no IQR
    const result = detectAnomalies(
      { activity_level: 1 },
      [baseline('activity_level', 3.5, 0.8)]
    );
    expect(result.anomalies).toHaveLength(1);
    expect(result.anomalies[0].severity).toBe('mild');
    expect(result.overallSeverity).toBe('mild');
  });

  it('detects mild when only IQR triggered (z-score not triggered)', () => {
    // mean=3.5, std=5 (so z threshold is very high), but value outside IQR fence
    // q1=3.4, q3=3.6, IQR=0.2, lower=3.1, upper=3.9
    // value=2.5: z = (2.5-3.5)/5 = -0.2 (< 2.5 threshold), IQR: 2.5 < 3.1 => triggered
    const result = detectAnomalies(
      { activity_level: 2.5 },
      [baseline('activity_level', 3.5, 5, 3.4, 3.6)]
    );
    expect(result.anomalies).toHaveLength(1);
    expect(result.anomalies[0].severity).toBe('mild');
    expect(result.overallSeverity).toBe('mild');
  });

  it('builds correct message for mild anomaly (en)', () => {
    const result = detectAnomalies(
      { activity_level: 1 },
      [baseline('activity_level', 3.5, 0.8)]
    );
    expect(result.anomalies[0].message_en).toContain('mild');
    expect(result.anomalies[0].message_en).toContain('activity level');
  });

  it('builds correct message for mild anomaly (ja)', () => {
    const result = detectAnomalies(
      { activity_level: 1 },
      [baseline('activity_level', 3.5, 0.8)]
    );
    expect(result.anomalies[0].message_ja).toContain('軽度');
    expect(result.anomalies[0].message_ja).toContain('活動量');
  });
});

// ---------------------------------------------------------------------------
// MODERATE (both z-score and IQR triggered, but absZ <= 3.5)
// ---------------------------------------------------------------------------
describe('detectAnomalies — MODERATE severity', () => {
  it('detects moderate when both z-score and IQR triggered', () => {
    // value=1, mean=3.5, std=0.8 => z = -3.125 (>2.5, <=3.5)
    // q1=3.0, q3=4.0, IQR=1.0, lower=1.5, upper=5.5 => 1 < 1.5 => IQR triggered
    const result = detectAnomalies(
      { appetite: 1 },
      [baseline('appetite', 3.5, 0.8, 3.0, 4.0)]
    );
    expect(result.anomalies).toHaveLength(1);
    expect(result.anomalies[0].severity).toBe('moderate');
    expect(result.overallSeverity).toBe('moderate');
  });

  it('message_en contains "moderate"', () => {
    const result = detectAnomalies(
      { appetite: 1 },
      [baseline('appetite', 3.5, 0.8, 3.0, 4.0)]
    );
    expect(result.anomalies[0].message_en).toContain('moderate');
  });

  it('message_ja contains "中程度"', () => {
    const result = detectAnomalies(
      { appetite: 1 },
      [baseline('appetite', 3.5, 0.8, 3.0, 4.0)]
    );
    expect(result.anomalies[0].message_ja).toContain('中程度');
  });
});

// ---------------------------------------------------------------------------
// SEVERE (absZ > 3.5)
// ---------------------------------------------------------------------------
describe('detectAnomalies — SEVERE severity', () => {
  it('detects severe when absZ > 3.5', () => {
    // value=1, mean=3.5, std=0.5 => z = -5.0 > 3.5
    const result = detectAnomalies(
      { energy_level: 1 },
      [baseline('energy_level', 3.5, 0.5, 3.0, 4.0)]
    );
    expect(result.anomalies).toHaveLength(1);
    expect(result.anomalies[0].severity).toBe('severe');
    expect(result.overallSeverity).toBe('severe');
  });

  it('severe above normal (positive z)', () => {
    // value=6, mean=3.5, std=0.5 => z = +5.0 > 3.5
    const result = detectAnomalies(
      { energy_level: 6 },
      [baseline('energy_level', 3.5, 0.5)]
    );
    expect(result.anomalies[0].severity).toBe('severe');
    expect(result.anomalies[0].message_en).toContain('above normal');
    expect(result.anomalies[0].message_ja).toContain('上昇');
  });

  it('message_en contains "severe"', () => {
    const result = detectAnomalies(
      { energy_level: 1 },
      [baseline('energy_level', 3.5, 0.5)]
    );
    expect(result.anomalies[0].message_en).toContain('severe');
  });

  it('message_ja contains "重大"', () => {
    const result = detectAnomalies(
      { energy_level: 1 },
      [baseline('energy_level', 3.5, 0.5)]
    );
    expect(result.anomalies[0].message_ja).toContain('重大');
  });
});

// ---------------------------------------------------------------------------
// Overall severity priority
// ---------------------------------------------------------------------------
describe('detectAnomalies — overall severity priority', () => {
  it('overallSeverity is severe when mix includes a severe', () => {
    const result = detectAnomalies(
      { activity_level: 1, energy_level: 1 },
      [
        baseline('activity_level', 3.5, 0.8, 3.0, 4.0),  // moderate
        baseline('energy_level', 3.5, 0.5),               // severe
      ]
    );
    expect(result.overallSeverity).toBe('severe');
  });

  it('overallSeverity is moderate when mix is moderate + mild', () => {
    const result = detectAnomalies(
      { appetite: 1, coat_condition: 1 },
      [
        baseline('appetite', 3.5, 0.8, 3.0, 4.0),   // moderate (both triggers, absZ<=3.5)
        baseline('coat_condition', 3.5, 0.8),         // mild (z only)
      ]
    );
    expect(result.overallSeverity).toBe('moderate');
  });

  // ---------------------------------------------------------------------------
  // AnomalyResult fields
  // ---------------------------------------------------------------------------
  it('z_score is rounded to 2 decimal places', () => {
    const result = detectAnomalies(
      { activity_level: 1 },
      [baseline('activity_level', 3.5, 0.8)]
    );
    const z = result.anomalies[0].z_score;
    expect(Number.isFinite(z)).toBe(true);
    const str = String(Math.abs(z));
    const decimals = str.includes('.') ? str.split('.')[1].length : 0;
    expect(decimals).toBeLessThanOrEqual(2);
  });

  it('exposes correct metric, value, baseline_mean, baseline_std', () => {
    const result = detectAnomalies(
      { activity_level: 1 },
      [baseline('activity_level', 3.5, 0.8)]
    );
    const a = result.anomalies[0];
    expect(a.metric).toBe('activity_level');
    expect(a.value).toBe(1);
    expect(a.baseline_mean).toBe(3.5);
    expect(a.baseline_std).toBe(0.8);
  });
});

// ---------------------------------------------------------------------------
// Multiple metrics
// ---------------------------------------------------------------------------
describe('detectAnomalies — multiple metrics', () => {
  it('detects multiple anomalies and picks highest severity', () => {
    const result = detectAnomalies(
      { activity_level: 1, appetite: 5 },
      [
        baseline('activity_level', 3.5, 0.8),
        baseline('appetite', 3.5, 0.8),
      ]
    );
    expect(result.anomalies.length).toBeGreaterThanOrEqual(1);
  });

  it('returns no anomaly metric not in baselines list', () => {
    const result = detectAnomalies(
      { unknown_metric: 1 },
      [baseline('activity_level', 3.5, 0.8)]
    );
    expect(result.anomalies).toHaveLength(0);
  });
});
