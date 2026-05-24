export type AnomalySeverity = 'none' | 'mild' | 'moderate' | 'severe';

export interface AnomalyResult {
  metric: string;
  severity: AnomalySeverity;
  value: number;
  baseline_mean: number;
  baseline_std: number;
  z_score: number;
  message_ja: string;
  message_en: string;
}

export interface AnomalyDetectionResult {
  anomalies: AnomalyResult[];
  overallSeverity: AnomalySeverity;
}

interface BaselineEntry {
  metric_name: string;
  baseline_value: number;
  std_deviation: number;
  q1?: number;
  q3?: number;
}

const METRIC_LABELS_JA: Record<string, string> = {
  activity_level: '活動量',
  appetite: '食欲',
  stool_quality: '排便の状態',
  coat_condition: '被毛の状態',
  eye_clarity: '目の状態',
  energy_level: '元気度',
};

const METRIC_LABELS_EN: Record<string, string> = {
  activity_level: 'activity level',
  appetite: 'appetite',
  stool_quality: 'stool quality',
  coat_condition: 'coat condition',
  eye_clarity: 'eye clarity',
  energy_level: 'energy level',
};

function buildMessage(
  metric: string,
  severity: AnomalySeverity,
  value: number,
  mean: number,
  locale: 'ja' | 'en'
): string {
  const direction = value < mean ? (locale === 'ja' ? '低下' : 'below normal') : (locale === 'ja' ? '上昇' : 'above normal');
  const label = locale === 'ja' ? (METRIC_LABELS_JA[metric] ?? metric) : (METRIC_LABELS_EN[metric] ?? metric);

  if (locale === 'ja') {
    const severityLabel = severity === 'severe' ? '重大な' : severity === 'moderate' ? '中程度の' : '軽度の';
    return `${label}に${severityLabel}異常が検出されました（通常より${direction}）。獣医師への相談をご検討ください。`;
  } else {
    const severityLabel = severity === 'severe' ? 'severe' : severity === 'moderate' ? 'moderate' : 'mild';
    return `A ${severityLabel} anomaly detected in ${label} (${direction}). Please consider consulting a veterinarian.`;
  }
}

export function detectAnomalies(
  currentValues: Record<string, number>,
  baselines: BaselineEntry[]
): AnomalyDetectionResult {
  const anomalies: AnomalyResult[] = [];

  for (const baseline of baselines) {
    const { metric_name, baseline_value: mean, std_deviation: std, q1, q3 } = baseline;
    const value = currentValues[metric_name];

    if (value === undefined || value === null) continue;
    if (std <= 0) continue;

    const zScore = (value - mean) / std;
    const absZ = Math.abs(zScore);

    const zTriggered = absZ > 2.5;

    let iqrTriggered = false;
    if (q1 !== undefined && q3 !== undefined) {
      const iqr = q3 - q1;
      const lower = q1 - 1.5 * iqr;
      const upper = q3 + 1.5 * iqr;
      iqrTriggered = value < lower || value > upper;
    }

    let severity: AnomalySeverity = 'none';
    if (absZ > 3.5) {
      severity = 'severe';
    } else if (zTriggered && iqrTriggered) {
      severity = 'moderate';
    } else if (zTriggered || iqrTriggered) {
      severity = 'mild';
    }

    if (severity === 'none') continue;

    anomalies.push({
      metric: metric_name,
      severity,
      value,
      baseline_mean: mean,
      baseline_std: std,
      z_score: Math.round(zScore * 100) / 100,
      message_ja: buildMessage(metric_name, severity, value, mean, 'ja'),
      message_en: buildMessage(metric_name, severity, value, mean, 'en'),
    });
  }

  let overallSeverity: AnomalySeverity = 'none';
  if (anomalies.some((a) => a.severity === 'severe')) {
    overallSeverity = 'severe';
  } else if (anomalies.some((a) => a.severity === 'moderate')) {
    overallSeverity = 'moderate';
  } else if (anomalies.some((a) => a.severity === 'mild')) {
    overallSeverity = 'mild';
  }

  return { anomalies, overallSeverity };
}
