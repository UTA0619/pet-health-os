import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  computeHealthScore,
  computeStreak,
  computeAchievements,
  WEIGHTS,
  METRIC_LABELS,
  DISCLAIMER,
  type HealthLog,
} from './health-score';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeLog(overrides: Partial<HealthLog> = {}): HealthLog {
  return {
    log_date: '2026-05-24',
    activity_level: 3,
    appetite: 3,
    stool_quality: 3,
    coat_condition: 3,
    eye_clarity: 3,
    energy_level: 3,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// WEIGHTS
// ---------------------------------------------------------------------------
describe('WEIGHTS', () => {
  it('sums to 1.0', () => {
    const total = Object.values(WEIGHTS).reduce((s, w) => s + w, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });

  it('has all 6 metric keys', () => {
    expect(Object.keys(WEIGHTS)).toHaveLength(6);
  });
});

// ---------------------------------------------------------------------------
// computeHealthScore
// ---------------------------------------------------------------------------
describe('computeHealthScore', () => {
  it('returns null for empty logs array', () => {
    expect(computeHealthScore([])).toBeNull();
  });

  it('computes correct score for all metrics at min value (1)', () => {
    const log = makeLog({
      activity_level: 1, appetite: 1, stool_quality: 1,
      coat_condition: 1, eye_clarity: 1, energy_level: 1,
    });
    const result = computeHealthScore([log]);
    expect(result).not.toBeNull();
    expect(result!.overall).toBe(0);
  });

  it('computes correct score for all metrics at max value (5)', () => {
    const log = makeLog({
      activity_level: 5, appetite: 5, stool_quality: 5,
      coat_condition: 5, eye_clarity: 5, energy_level: 5,
    });
    const result = computeHealthScore([log]);
    expect(result).not.toBeNull();
    expect(result!.overall).toBe(100);
  });

  it('computes correct score for midpoint value (3)', () => {
    const log = makeLog({
      activity_level: 3, appetite: 3, stool_quality: 3,
      coat_condition: 3, eye_clarity: 3, energy_level: 3,
    });
    const result = computeHealthScore([log]);
    // (3-1)/4 * 100 = 50 for each metric, weighted sum = 50
    expect(result!.overall).toBe(50);
  });

  it('uses default 50 for null metrics', () => {
    const log = makeLog({ activity_level: null, appetite: null });
    const result = computeHealthScore([log]);
    expect(result).not.toBeNull();
    // null metrics contribute 50 to components
    expect(result!.components.activity_level).toBe(50);
    expect(result!.components.appetite).toBe(50);
  });

  it('computes correct component values', () => {
    const log = makeLog({
      activity_level: 5, appetite: 1, stool_quality: 3,
      coat_condition: 3, eye_clarity: 3, energy_level: 3,
    });
    const result = computeHealthScore([log]);
    expect(result!.components.activity_level).toBe(100);
    expect(result!.components.appetite).toBe(0);
    expect(result!.components.stool_quality).toBe(50);
  });

  it('has confidence 0 when no filled metrics (all null)', () => {
    const log: HealthLog = {
      log_date: '2026-05-24',
      activity_level: null,
      appetite: null,
      stool_quality: null,
      coat_condition: null,
      eye_clarity: null,
      energy_level: null,
    };
    const result = computeHealthScore([log]);
    // filledCount = 0, so confidence = 0
    expect(result!.confidence).toBe(0);
  });

  it('has confidence proportional to filled metrics and logs count', () => {
    const log = makeLog(); // all 6 filled
    const result = computeHealthScore([log]);
    // filledCount=6, logs.length=1; confidence = (6/6) * (1/14)
    expect(result!.confidence).toBeCloseTo(1 / 14, 3);
  });

  it('has confidence capped at 1.0 with 14+ logs', () => {
    const logs = Array.from({ length: 14 }, (_, i) =>
      makeLog({ log_date: `2026-05-${String(i + 1).padStart(2, '0')}` })
    );
    const result = computeHealthScore(logs);
    expect(result!.confidence).toBe(1);
  });

  // Trend tests
  it('returns stable trend with only 2 logs', () => {
    const logs = [makeLog({ log_date: '2026-05-24' }), makeLog({ log_date: '2026-05-23' })];
    const result = computeHealthScore(logs);
    expect(result!.trend).toBe('stable');
    expect(result!.trendDelta).toBe(0);
  });

  it('detects improving trend', () => {
    // recent 3 logs high, older 3 logs low
    const highLog = makeLog({ activity_level: 5, appetite: 5, stool_quality: 5, coat_condition: 5, eye_clarity: 5, energy_level: 5 });
    const lowLog = makeLog({ activity_level: 1, appetite: 1, stool_quality: 1, coat_condition: 1, eye_clarity: 1, energy_level: 1 });
    const logs = [
      { ...highLog, log_date: '2026-05-24' },
      { ...highLog, log_date: '2026-05-23' },
      { ...highLog, log_date: '2026-05-22' },
      { ...lowLog, log_date: '2026-05-21' },
      { ...lowLog, log_date: '2026-05-20' },
      { ...lowLog, log_date: '2026-05-19' },
    ];
    const result = computeHealthScore(logs);
    expect(result!.trend).toBe('improving');
    expect(result!.trendDelta).toBeGreaterThan(5);
  });

  it('detects declining trend', () => {
    const highLog = makeLog({ activity_level: 5, appetite: 5, stool_quality: 5, coat_condition: 5, eye_clarity: 5, energy_level: 5 });
    const lowLog = makeLog({ activity_level: 1, appetite: 1, stool_quality: 1, coat_condition: 1, eye_clarity: 1, energy_level: 1 });
    const logs = [
      { ...lowLog, log_date: '2026-05-24' },
      { ...lowLog, log_date: '2026-05-23' },
      { ...lowLog, log_date: '2026-05-22' },
      { ...highLog, log_date: '2026-05-21' },
      { ...highLog, log_date: '2026-05-20' },
      { ...highLog, log_date: '2026-05-19' },
    ];
    const result = computeHealthScore(logs);
    expect(result!.trend).toBe('declining');
    expect(result!.trendDelta).toBeLessThan(-5);
  });

  it('returns stable when delta is within ±5', () => {
    // midpoint logs for all — trendDelta = 0
    const logs = Array.from({ length: 6 }, (_, i) =>
      makeLog({ log_date: `2026-05-${String(24 - i).padStart(2, '0')}` })
    );
    const result = computeHealthScore(logs);
    expect(result!.trend).toBe('stable');
  });

  it('overall score is rounded to 1 decimal place', () => {
    const log = makeLog({ activity_level: 2, appetite: 4, stool_quality: 3, coat_condition: 3, eye_clarity: 3, energy_level: 3 });
    const result = computeHealthScore([log]);
    const str = String(result!.overall);
    const decimals = str.includes('.') ? str.split('.')[1].length : 0;
    expect(decimals).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// computeStreak
// ---------------------------------------------------------------------------
describe('computeStreak', () => {
  beforeEach(() => {
    // Fix time to 2026-05-24 12:00 UTC (JST = 2026-05-24)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-24T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 for empty dates', () => {
    expect(computeStreak([])).toBe(0);
  });

  it('returns 0 when most recent log is not today or yesterday', () => {
    expect(computeStreak(['2026-05-20'])).toBe(0);
  });

  it('returns 1 for single log today', () => {
    expect(computeStreak(['2026-05-24'])).toBe(1);
  });

  it('returns 1 for single log yesterday', () => {
    expect(computeStreak(['2026-05-23'])).toBe(1);
  });

  it('counts consecutive days starting today', () => {
    const dates = ['2026-05-24', '2026-05-23', '2026-05-22', '2026-05-21'];
    expect(computeStreak(dates)).toBe(4);
  });

  it('counts consecutive days starting yesterday', () => {
    const dates = ['2026-05-23', '2026-05-22', '2026-05-21'];
    expect(computeStreak(dates)).toBe(3);
  });

  it('stops at gap in consecutive days', () => {
    const dates = ['2026-05-24', '2026-05-23', '2026-05-21']; // gap on 22nd
    expect(computeStreak(dates)).toBe(2);
  });

  it('handles unsorted dates correctly (uses set lookup)', () => {
    const dates = ['2026-05-21', '2026-05-23', '2026-05-24'];
    expect(computeStreak(dates)).toBe(2); // 24, 23 consecutive; 22 missing
  });
});

// ---------------------------------------------------------------------------
// computeAchievements
// ---------------------------------------------------------------------------
describe('computeAchievements', () => {
  it('returns 9 achievements', () => {
    const result = computeAchievements({ streak: 0, totalLogs: 0, maxScore: 0, hasCameraScan: false });
    expect(result).toHaveLength(9);
  });

  it('first_log earned when totalLogs >= 1', () => {
    const earned = computeAchievements({ streak: 0, totalLogs: 1, maxScore: 0, hasCameraScan: false })
      .find((a) => a.id === 'first_log')!;
    expect(earned.earned).toBe(true);
  });

  it('first_log not earned when totalLogs = 0', () => {
    const earned = computeAchievements({ streak: 0, totalLogs: 0, maxScore: 0, hasCameraScan: false })
      .find((a) => a.id === 'first_log')!;
    expect(earned.earned).toBe(false);
  });

  it('streak3 earned when streak >= 3', () => {
    const result = computeAchievements({ streak: 3, totalLogs: 5, maxScore: 0, hasCameraScan: false });
    expect(result.find((a) => a.id === 'streak3')!.earned).toBe(true);
  });

  it('streak7 earned when streak >= 7', () => {
    const result = computeAchievements({ streak: 7, totalLogs: 10, maxScore: 0, hasCameraScan: false });
    expect(result.find((a) => a.id === 'streak7')!.earned).toBe(true);
  });

  it('streak30 earned when streak >= 30', () => {
    const result = computeAchievements({ streak: 30, totalLogs: 35, maxScore: 0, hasCameraScan: false });
    expect(result.find((a) => a.id === 'streak30')!.earned).toBe(true);
  });

  it('high_score earned when maxScore >= 80', () => {
    const result = computeAchievements({ streak: 0, totalLogs: 1, maxScore: 80, hasCameraScan: false });
    expect(result.find((a) => a.id === 'high_score')!.earned).toBe(true);
  });

  it('perfect earned when maxScore >= 98', () => {
    const result = computeAchievements({ streak: 0, totalLogs: 1, maxScore: 100, hasCameraScan: false });
    expect(result.find((a) => a.id === 'perfect')!.earned).toBe(true);
  });

  it('camera earned when hasCameraScan = true', () => {
    const result = computeAchievements({ streak: 0, totalLogs: 1, maxScore: 0, hasCameraScan: true });
    expect(result.find((a) => a.id === 'camera')!.earned).toBe(true);
  });

  it('logs10 earned when totalLogs >= 10', () => {
    const result = computeAchievements({ streak: 0, totalLogs: 10, maxScore: 0, hasCameraScan: false });
    expect(result.find((a) => a.id === 'logs10')!.earned).toBe(true);
  });

  it('logs30 earned when totalLogs >= 30', () => {
    const result = computeAchievements({ streak: 0, totalLogs: 30, maxScore: 0, hasCameraScan: false });
    expect(result.find((a) => a.id === 'logs30')!.earned).toBe(true);
  });

  it('no achievements earned with all zero/false values', () => {
    const result = computeAchievements({ streak: 0, totalLogs: 0, maxScore: 0, hasCameraScan: false });
    expect(result.every((a) => !a.earned)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// METRIC_LABELS and DISCLAIMER
// ---------------------------------------------------------------------------
describe('METRIC_LABELS', () => {
  it('has a label for every weight key', () => {
    for (const key of Object.keys(WEIGHTS)) {
      expect(METRIC_LABELS).toHaveProperty(key);
    }
  });
});

describe('DISCLAIMER', () => {
  it('is a non-empty string', () => {
    expect(typeof DISCLAIMER).toBe('string');
    expect(DISCLAIMER.length).toBeGreaterThan(0);
  });
});
