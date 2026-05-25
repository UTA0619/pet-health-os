// ============================================================
// Database types derived from Supabase migrations
// Auto-maintained — update when migrations change
// ============================================================

// ── Enums ────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'pro' | 'premium';
export type PetSpecies = 'dog' | 'cat' | 'rabbit' | 'bird' | 'reptile' | 'other';
export type PetSex = 'male' | 'female' | 'unknown';
export type HealthLoggedBy = 'owner' | 'vet' | 'sitter';
export type TrendDirection = 'improving' | 'stable' | 'declining';
export type AnomalySeverity = 'mild' | 'moderate' | 'severe';
export type CameraOverallStatus = 'healthy' | 'monitor' | 'concerning' | 'urgent';
export type SubscriptionPlan = 'free' | 'pro' | 'premium';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'incomplete';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'dead';
export type JobType =
  | 'health_score_compute'
  | 'camera_analysis'
  | 'anomaly_check'
  | 'notification_send'
  | 'baseline_sync';
export type PhotoUploadSource = 'camera' | 'gallery' | 'onboarding';
export type VetVisitType = 'routine' | 'emergency' | 'follow_up' | 'specialist';
export type SymptomSeverity = 'mild' | 'moderate' | 'severe';

// ── Row types ────────────────────────────────────────────────

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: SubscriptionTier;
  onboarding_complete: boolean;
  onboarding_step: number;
  referral_code: string | null;
  referred_by: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type Pet = {
  id: string;
  owner_id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  sex: PetSex | null;
  date_of_birth: string | null;
  weight_kg: number | null;
  photo_url: string | null;
  microchip_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PetWeightHistory = {
  id: string;
  pet_id: string;
  weight_kg: number;
  recorded_at: string;
};

export type PetPhoto = {
  id: string;
  pet_id: string;
  storage_url: string;
  cdn_url: string | null;
  taken_at: string | null;
  upload_source: PhotoUploadSource | null;
  is_profile: boolean;
  created_at: string;
};

export type HealthLog = {
  id: string;
  pet_id: string;
  log_date: string;
  activity_level: number | null;
  appetite: number | null;
  stool_quality: number | null;
  coat_condition: number | null;
  eye_clarity: number | null;
  energy_level: number | null;
  notes: string | null;
  logged_by: HealthLoggedBy;
  ai_processed: boolean;
  created_at: string;
  updated_at: string;
};

export type SymptomReport = {
  id: string;
  pet_id: string;
  symptom_type: string;
  severity: SymptomSeverity;
  onset_date: string | null;
  resolved_date: string | null;
  notes: string | null;
  created_at: string;
};

export type VetVisit = {
  id: string;
  pet_id: string;
  visit_date: string;
  clinic_name: string | null;
  vet_name: string | null;
  visit_type: VetVisitType | null;
  diagnosis: string | null;
  treatment: string | null;
  medications: string[] | null;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
};

export type HealthScore = {
  id: string;
  pet_id: string;
  score_date: string;
  overall_score: number;
  component_scores: Record<string, number>;
  trend_direction: TrendDirection | null;
  trend_delta: number | null;
  confidence: number | null;
  explanation: string | null;
  model_version: string;
  created_at: string;
};

export type AnomalyDetection = {
  id: string;
  pet_id: string;
  detected_at: string;
  anomaly_type: string;
  severity: AnomalySeverity;
  confidence: number | null;
  affected_metrics: Array<{
    metric: string;
    value: number;
    baseline_mean: number;
    z_score: number;
  }>;
  explanation: string | null;
  recommendation: string | null;
  alert_sent: boolean;
  alert_sent_at: string | null;
  resolved_at: string | null;
  false_positive: boolean;
  model_version: string;
  created_at: string;
};

export type CameraAnalysis = {
  id: string;
  pet_id: string;
  image_url: string;
  cdn_url: string | null;
  analyzed_at: string;
  findings: Record<string, unknown>;
  overall_status: CameraOverallStatus | null;
  confidence: number | null;
  flagged_for_review: boolean;
  review_reason: string | null;
  model_version: string;
  created_at: string;
};

export type PetBaseline = {
  id: string;
  pet_id: string;
  metric_name: string;
  baseline_mean: number;
  baseline_std: number;
  baseline_min: number;
  baseline_max: number;
  q1: number | null;
  q3: number | null;
  sample_count: number;
  computed_at: string;
  model_version: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  cancelled_at: string | null;
  features: {
    max_pets: number;
    camera_analyses_per_day: number;
    anomaly_alerts: boolean;
    health_report_pdf: boolean;
    advanced_ai: boolean;
    vet_sharing: boolean;
  };
  created_at: string;
  updated_at: string;
};

export type BillingEvent = {
  id: string;
  user_id: string | null;
  event_type: string;
  stripe_event_id: string | null;
  amount_cents: number | null;
  currency: string | null;
  metadata: Record<string, unknown>;
  processed_at: string;
};

export type NotificationPreferences = {
  id: string;
  user_id: string;
  push_enabled: boolean;
  daily_score_reminder: boolean;
  anomaly_alerts: boolean;
  weekly_report: boolean;
  health_tips: boolean;
  email_enabled: boolean;
  email_weekly_report: boolean;
  email_anomaly_alerts: boolean;
  onesignal_player_id: string | null;
  onesignal_subscribed_at: string | null;
  preferred_hour: number | null;
  created_at: string;
  updated_at: string;
};

export type PushSubscription = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
  updated_at: string;
};

export type AiJob = {
  id: string;
  job_type: JobType;
  status: JobStatus;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  retry_count: number;
  max_retries: number;
  priority: number;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

// ── Insert types (omit generated fields) ─────────────────────

export type ProfileInsert = Omit<Profile, 'onboarding_step' | 'onboarding_complete' | 'referral_code' | 'timezone' | 'created_at' | 'updated_at'> & Partial<Pick<Profile, 'onboarding_step' | 'onboarding_complete' | 'referral_code' | 'timezone'>>;
export type PetInsert = Omit<Pet, 'id' | 'is_active' | 'created_at' | 'updated_at'> & Partial<Pick<Pet, 'id' | 'is_active'>>;
export type HealthLogInsert = Omit<HealthLog, 'id' | 'log_date' | 'logged_by' | 'ai_processed' | 'created_at' | 'updated_at'> & Partial<Pick<HealthLog, 'id' | 'log_date' | 'logged_by' | 'ai_processed'>>;
export type AiJobInsert = Omit<AiJob, 'id' | 'status' | 'retry_count' | 'scheduled_at' | 'started_at' | 'completed_at' | 'created_at' | 'updated_at'> & Partial<Pick<AiJob, 'id' | 'status' | 'retry_count' | 'scheduled_at' | 'priority' | 'max_retries'>>;

// ── Supabase Database type ────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: Partial<ProfileInsert>;
      };
      pets: {
        Row: Pet;
        Insert: PetInsert;
        Update: Partial<PetInsert>;
      };
      pet_weight_history: {
        Row: PetWeightHistory;
        Insert: Omit<PetWeightHistory, 'id' | 'recorded_at'> & Partial<Pick<PetWeightHistory, 'id' | 'recorded_at'>>;
        Update: Partial<Omit<PetWeightHistory, 'id'>>;
      };
      pet_photos: {
        Row: PetPhoto;
        Insert: Omit<PetPhoto, 'id' | 'is_profile' | 'created_at'> & Partial<Pick<PetPhoto, 'id' | 'is_profile'>>;
        Update: Partial<Omit<PetPhoto, 'id' | 'created_at'>>;
      };
      health_logs: {
        Row: HealthLog;
        Insert: HealthLogInsert;
        Update: Partial<HealthLogInsert>;
      };
      symptom_reports: {
        Row: SymptomReport;
        Insert: Omit<SymptomReport, 'id' | 'created_at'> & Partial<Pick<SymptomReport, 'id'>>;
        Update: Partial<Omit<SymptomReport, 'id' | 'created_at'>>;
      };
      vet_visits: {
        Row: VetVisit;
        Insert: Omit<VetVisit, 'id' | 'created_at'> & Partial<Pick<VetVisit, 'id'>>;
        Update: Partial<Omit<VetVisit, 'id' | 'created_at'>>;
      };
      health_scores: {
        Row: HealthScore;
        Insert: Omit<HealthScore, 'id' | 'model_version' | 'created_at'> & Partial<Pick<HealthScore, 'id' | 'model_version'>>;
        Update: Partial<Omit<HealthScore, 'id' | 'created_at'>>;
      };
      anomaly_detections: {
        Row: AnomalyDetection;
        Insert: Omit<AnomalyDetection, 'id' | 'detected_at' | 'alert_sent' | 'false_positive' | 'model_version' | 'created_at'> & Partial<Pick<AnomalyDetection, 'id' | 'detected_at' | 'alert_sent' | 'false_positive' | 'model_version'>>;
        Update: Partial<Omit<AnomalyDetection, 'id' | 'created_at'>>;
      };
      camera_analyses: {
        Row: CameraAnalysis;
        Insert: Omit<CameraAnalysis, 'id' | 'analyzed_at' | 'flagged_for_review' | 'model_version' | 'created_at'> & Partial<Pick<CameraAnalysis, 'id' | 'analyzed_at' | 'flagged_for_review' | 'model_version'>>;
        Update: Partial<Omit<CameraAnalysis, 'id' | 'created_at'>>;
      };
      pet_baselines: {
        Row: PetBaseline;
        Insert: Omit<PetBaseline, 'id' | 'computed_at' | 'model_version'> & Partial<Pick<PetBaseline, 'id' | 'computed_at' | 'model_version'>>;
        Update: Partial<Omit<PetBaseline, 'id'>>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, 'id' | 'plan' | 'status' | 'features' | 'created_at' | 'updated_at'> & Partial<Pick<Subscription, 'id' | 'plan' | 'status' | 'features'>>;
        Update: Partial<Omit<Subscription, 'id' | 'created_at'>>;
      };
      billing_events: {
        Row: BillingEvent;
        Insert: Omit<BillingEvent, 'id' | 'processed_at'> & Partial<Pick<BillingEvent, 'id' | 'processed_at'>>;
        Update: never;
      };
      notification_preferences: {
        Row: NotificationPreferences;
        Insert: Omit<NotificationPreferences, 'id' | 'push_enabled' | 'daily_score_reminder' | 'anomaly_alerts' | 'weekly_report' | 'health_tips' | 'email_enabled' | 'email_weekly_report' | 'email_anomaly_alerts' | 'created_at' | 'updated_at'> & Partial<Pick<NotificationPreferences, 'id' | 'push_enabled' | 'daily_score_reminder' | 'anomaly_alerts' | 'weekly_report' | 'health_tips' | 'email_enabled' | 'email_weekly_report' | 'email_anomaly_alerts'>>;
        Update: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at'>>;
      };
      push_subscriptions: {
        Row: PushSubscription;
        Insert: Omit<PushSubscription, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<PushSubscription, 'id'>>;
        Update: Partial<Omit<PushSubscription, 'id' | 'user_id' | 'created_at'>>;
      };
      ai_jobs: {
        Row: AiJob;
        Insert: AiJobInsert;
        Update: Partial<Omit<AiJob, 'id' | 'created_at'>>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_pro_user: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      job_status: JobStatus;
      job_type: JobType;
    };
  };
};
