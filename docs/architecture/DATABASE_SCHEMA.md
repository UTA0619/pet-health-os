# Database Schema — Pet Health OS

All tables use RLS. Service role writes are restricted to Edge Functions only.

## Table Map

```
auth.users (Supabase managed)
    │
    └── profiles (1:1)
            │
            ├── pets (1:many)
            │       ├── pet_photos (1:many)
            │       ├── pet_weight_history (1:many, trigger-managed)
            │       ├── health_logs (1:many, one per day)
            │       ├── symptom_reports (1:many)
            │       ├── vet_visits (1:many)
            │       ├── health_scores (1:many, one per day)
            │       ├── anomaly_detections (1:many)
            │       ├── camera_analyses (1:many)
            │       └── pet_baselines (1:per-metric)
            │
            ├── subscriptions (1:1, trigger-created)
            ├── billing_events (1:many)
            └── notification_preferences (1:1, trigger-created)
```

## Core Tables

### `profiles`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | References auth.users |
| email | text | From auth.users |
| full_name | text | |
| avatar_url | text | |
| subscription_tier | text | free/pro/premium (denormalized for fast reads) |
| onboarding_complete | boolean | |
| onboarding_step | int | 0–4 |
| referral_code | text | Unique, auto-generated |
| referred_by | uuid | FK to profiles |
| timezone | text | |

### `pets`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid FK | profiles |
| name | text | |
| species | text | dog/cat/rabbit/bird/reptile/other |
| breed | text | |
| sex | text | male/female/unknown |
| date_of_birth | date | |
| weight_kg | numeric(5,2) | Current weight |
| photo_url | text | CDN URL |
| microchip_id | text | |
| is_active | boolean | Soft delete |

### `health_logs`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| pet_id | uuid FK | pets |
| log_date | date | Unique per pet per day |
| activity_level | smallint | 1–5 |
| appetite | smallint | 1–5 |
| stool_quality | smallint | 1–5 |
| coat_condition | smallint | 1–5 |
| eye_clarity | smallint | 1–5 |
| energy_level | smallint | 1–5 |
| notes | text | Owner notes (max 500 chars) |
| logged_by | text | owner/vet/sitter |
| ai_processed | boolean | Tracks if score was generated |

**Constraint:** `UNIQUE (pet_id, log_date)`

### `health_scores`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| pet_id | uuid FK | pets |
| score_date | date | Unique per pet per day |
| overall_score | numeric(5,2) | 0–100 |
| component_scores | jsonb | Per-metric scores |
| trend_direction | text | improving/stable/declining |
| trend_delta | numeric(5,2) | Change vs 7-day avg |
| confidence | numeric(4,3) | 0.0–1.0 |
| explanation | text | GPT-generated explanation |
| model_version | text | |

**Write policy:** Service role only (Edge Functions)

### `anomaly_detections`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| pet_id | uuid FK | pets |
| detected_at | timestamptz | |
| anomaly_type | text | e.g. "appetite_mild,energy_moderate" |
| severity | text | mild/moderate/severe |
| confidence | numeric(4,3) | |
| affected_metrics | jsonb | Array of metric anomaly objects |
| explanation | text | |
| recommendation | text | |
| alert_sent | boolean | |
| resolved_at | timestamptz | NULL = unresolved |
| false_positive | boolean | User feedback |

### `camera_analyses`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| pet_id | uuid FK | pets |
| image_url | text | R2 URL |
| cdn_url | text | Public CDN URL |
| findings | jsonb | Full structured output |
| overall_status | text | healthy/monitor/concerning/urgent |
| confidence | numeric(4,3) | |
| flagged_for_review | boolean | confidence < 0.4 |
| model_version | text | GPT model version used |

### `pet_baselines`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| pet_id | uuid FK | pets |
| metric_name | text | One of 6 metrics |
| baseline_mean | numeric(5,3) | Rolling 30-day mean |
| baseline_std | numeric(5,3) | Rolling 30-day std dev |
| q1 | numeric(5,3) | 25th percentile |
| q3 | numeric(5,3) | 75th percentile |
| sample_count | int | Days with data |
| computed_at | timestamptz | Last recomputed |

**Constraint:** `UNIQUE (pet_id, metric_name)`

### `subscriptions`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | profiles (unique) |
| plan | text | free/pro/premium |
| status | text | active/trialing/past_due/cancelled |
| stripe_customer_id | text | |
| stripe_subscription_id | text | |
| trial_end | timestamptz | |
| current_period_end | timestamptz | |
| features | jsonb | Denormalized feature gates |

## Key Indexes

```sql
-- Performance-critical queries
idx_health_logs_pet_date       ON health_logs(pet_id, log_date DESC)
idx_health_scores_pet_date     ON health_scores(pet_id, score_date DESC)
idx_anomalies_unresolved       ON anomaly_detections(pet_id, detected_at DESC) WHERE resolved_at IS NULL
idx_anomalies_unsent           ON anomaly_detections(detected_at) WHERE NOT alert_sent
idx_baselines_pet_metric       ON pet_baselines(pet_id, metric_name)
idx_subscriptions_stripe       ON subscriptions(stripe_customer_id)
idx_notif_prefs_push_enabled   ON notification_preferences(user_id) WHERE push_enabled = true
```

## RLS Summary

| Table | Owner reads own | Service role writes | Public reads |
|---|---|---|---|
| profiles | ✅ | ❌ | ❌ |
| pets | ✅ | ❌ | ❌ |
| health_logs | ✅ | ❌ | ❌ |
| health_scores | ✅ | ✅ (only) | ❌ |
| anomaly_detections | ✅ | ✅ (insert) | ❌ |
| camera_analyses | ✅ | ✅ (insert) | ❌ |
| pet_baselines | ✅ | ✅ (upsert) | ❌ |
| subscriptions | ✅ | ✅ (only) | ❌ |
