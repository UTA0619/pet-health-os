export const METRIC_WEIGHTS = {
  activity_level: 0.20,
  appetite: 0.20,
  stool_quality: 0.15,
  coat_condition: 0.15,
  eye_clarity: 0.15,
  energy_level: 0.15,
} as const;

export type MetricKey = keyof typeof METRIC_WEIGHTS;

export type TrendDirection = 'improving' | 'stable' | 'declining';

export interface ComponentScores {
  [metric: string]: number;
}

export interface HealthScoreResult {
  overall: number;
  components: ComponentScores;
  trend: TrendDirection;
  confidence: number;
}
