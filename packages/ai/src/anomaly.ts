export type AnomalySeverity = 'mild' | 'moderate' | 'severe';

export interface AnomalyResult {
  metric: string;
  value: number;
  baseline_mean: number;
  z_score: number;
  iqr_outlier: boolean;
  severity: AnomalySeverity;
}

export const ZSCORE_THRESHOLD = 2.5;
export const IQR_MULTIPLIER = 1.5;
export const MIN_BASELINE_DAYS = 14;
