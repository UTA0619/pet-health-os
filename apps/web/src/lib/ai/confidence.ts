import { type HealthLog } from "@/lib/ai/health-score";

// ---------------------------------------------------------------------------
// Confidence scoring
// ---------------------------------------------------------------------------

/**
 * Compute a 0.0–1.0 confidence score for a health assessment.
 *
 * Two dimensions:
 *   - Data completeness: distinct log dates in the last 14 days / 14
 *   - Baseline maturity: min(baselineAgeDays / 30, 1.0)
 *
 * Composite: 0.4 * completeness + 0.6 * maturity
 *
 * @param logs            - Health logs (any order; log_date used for uniqueness)
 * @param baselineAgeDays - Number of days since the baseline was established
 */
export function computeConfidence(
  logs: HealthLog[],
  baselineAgeDays: number,
): number {
  // Data completeness: distinct dates in last 14 days
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 14);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const recentDates = new Set(
    logs
      .map((l) => l.log_date)
      .filter((d) => d >= cutoffStr),
  );

  const completeness = Math.min(recentDates.size / 14, 1.0);

  // Baseline maturity
  const maturity = Math.min(baselineAgeDays / 30, 1.0);

  // Composite
  const composite = 0.4 * completeness + 0.6 * maturity;

  // Round to 3 decimal places for consistency with health-score.ts
  return Math.round(composite * 1000) / 1000;
}

// ---------------------------------------------------------------------------
// Human-readable label
// ---------------------------------------------------------------------------

/**
 * Map a confidence score to a Japanese label.
 *
 * - > 0.7 → "高"
 * - > 0.4 → "中"
 * - else  → "低"
 */
export function confidenceLabel(score: number): string {
  if (score > 0.7) return "高";
  if (score > 0.4) return "中";
  return "低";
}
