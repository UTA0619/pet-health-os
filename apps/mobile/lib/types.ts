export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  date_of_birth?: string;
  photo_url?: string;
}

export interface HealthScore {
  overall: number;
  trend: 'improving' | 'stable' | 'declining';
  confidence: number;
  components: Record<string, number>;
  explanation?: string;
}

export interface HealthLog {
  id: string;
  pet_id: string;
  log_date: string;
  activity_level: number;
  appetite: number;
  stool_quality: number;
  coat_condition: number;
  eye_clarity: number;
  energy_level: number;
  notes?: string;
}

export type MetricKey = 'activity_level' | 'appetite' | 'stool_quality' | 'coat_condition' | 'eye_clarity' | 'energy_level';

export const METRIC_LABELS: Record<MetricKey, string> = {
  activity_level: '活動量',
  appetite: '食欲',
  stool_quality: '便の状態',
  coat_condition: '毛並み',
  eye_clarity: '目の輝き',
  energy_level: '元気さ',
};
