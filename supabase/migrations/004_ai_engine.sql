-- ============================================================
-- Migration 004: AI Engine
-- Health scores, anomaly detections, camera analyses, baselines
-- ============================================================

-- ── Health scores ────────────────────────────────────────────
create table public.health_scores (
  id                 uuid primary key default gen_random_uuid(),
  pet_id             uuid not null references public.pets(id) on delete cascade,
  score_date         date not null,
  overall_score      numeric(5,2) not null check (overall_score between 0 and 100),
  -- Per-component scores (each 0–100)
  component_scores   jsonb not null default '{}',
  -- e.g. {"activity": 85, "appetite": 72, "stool": 90, "coat": 88, "eyes": 95, "energy": 80}
  trend_direction    text check (trend_direction in ('improving', 'stable', 'declining')),
  trend_delta        numeric(5,2),  -- score change vs 7-day avg
  confidence         numeric(4,3) check (confidence between 0 and 1),
  explanation        text,
  model_version      text not null default 'v1.0',
  created_at         timestamptz not null default now(),
  constraint health_scores_pet_date_unique unique (pet_id, score_date)
);

alter table public.health_scores enable row level security;

create policy "health_scores_select_own" on public.health_scores
  for select using (
    exists (select 1 from public.pets where id = pet_id and owner_id = auth.uid())
  );

-- Service role only for writes (Edge Functions)
create policy "health_scores_insert_service" on public.health_scores
  for insert with check (auth.role() = 'service_role');

create policy "health_scores_update_service" on public.health_scores
  for update using (auth.role() = 'service_role');

-- ── Anomaly detections ───────────────────────────────────────
create table public.anomaly_detections (
  id               uuid primary key default gen_random_uuid(),
  pet_id           uuid not null references public.pets(id) on delete cascade,
  detected_at      timestamptz not null default now(),
  anomaly_type     text not null,  -- e.g. 'appetite_drop', 'energy_spike', 'stool_abnormal'
  severity         text not null check (severity in ('mild', 'moderate', 'severe')),
  confidence       numeric(4,3) check (confidence between 0 and 1),
  affected_metrics jsonb not null default '[]',
  -- e.g. [{"metric": "appetite", "value": 1, "baseline_mean": 4.2, "z_score": 3.1}]
  explanation      text,
  recommendation   text,
  alert_sent       boolean not null default false,
  alert_sent_at    timestamptz,
  resolved_at      timestamptz,
  false_positive   boolean not null default false,
  model_version    text not null default 'v1.0',
  created_at       timestamptz not null default now()
);

alter table public.anomaly_detections enable row level security;

create policy "anomalies_select_own" on public.anomaly_detections
  for select using (
    exists (select 1 from public.pets where id = pet_id and owner_id = auth.uid())
  );

create policy "anomalies_update_own" on public.anomaly_detections
  for update using (
    exists (select 1 from public.pets where id = pet_id and owner_id = auth.uid())
  );

create policy "anomalies_insert_service" on public.anomaly_detections
  for insert with check (auth.role() = 'service_role');

-- ── Camera analyses ──────────────────────────────────────────
create table public.camera_analyses (
  id               uuid primary key default gen_random_uuid(),
  pet_id           uuid not null references public.pets(id) on delete cascade,
  image_url        text not null,
  cdn_url          text,
  analyzed_at      timestamptz not null default now(),
  -- AI findings
  findings         jsonb not null default '{}',
  -- {coat_condition, eye_clarity, posture, mobility, visible_concerns[], confidence, recommendations[], requires_vet_attention}
  overall_status   text check (overall_status in ('healthy', 'monitor', 'concerning', 'urgent')),
  confidence       numeric(4,3) check (confidence between 0 and 1),
  flagged_for_review boolean not null default false,
  review_reason    text,
  model_version    text not null default 'gpt-4o-2024-11-20',
  created_at       timestamptz not null default now()
);

alter table public.camera_analyses enable row level security;

create policy "camera_select_own" on public.camera_analyses
  for select using (
    exists (select 1 from public.pets where id = pet_id and owner_id = auth.uid())
  );

create policy "camera_insert_service" on public.camera_analyses
  for insert with check (auth.role() = 'service_role');

-- ── Per-pet baselines ────────────────────────────────────────
create table public.pet_baselines (
  id             uuid primary key default gen_random_uuid(),
  pet_id         uuid not null references public.pets(id) on delete cascade,
  metric_name    text not null,
  -- One of: activity_level, appetite, stool_quality, coat_condition, eye_clarity, energy_level
  baseline_mean  numeric(5,3) not null,
  baseline_std   numeric(5,3) not null,
  baseline_min   numeric(5,3) not null,
  baseline_max   numeric(5,3) not null,
  q1             numeric(5,3),
  q3             numeric(5,3),
  sample_count   int not null,
  computed_at    timestamptz not null default now(),
  model_version  text not null default 'v1.0',
  constraint pet_baselines_pet_metric_unique unique (pet_id, metric_name)
);

alter table public.pet_baselines enable row level security;

create policy "baselines_select_own" on public.pet_baselines
  for select using (
    exists (select 1 from public.pets where id = pet_id and owner_id = auth.uid())
  );

create policy "baselines_upsert_service" on public.pet_baselines
  for all using (auth.role() = 'service_role');

-- ── Semantic search function ─────────────────────────────────
-- For future: retrieve similar health log entries by embedding
-- (embeddings column can be added later via migration 006)

-- ── Indexes ──────────────────────────────────────────────────
create index idx_health_scores_pet_date on public.health_scores(pet_id, score_date desc);
create index idx_anomalies_pet_detected on public.anomaly_detections(pet_id, detected_at desc);
create index idx_anomalies_unresolved on public.anomaly_detections(pet_id, detected_at desc)
  where resolved_at is null and not false_positive;
create index idx_anomalies_unsent on public.anomaly_detections(detected_at)
  where not alert_sent;
create index idx_camera_analyses_pet_id on public.camera_analyses(pet_id, analyzed_at desc);
create index idx_baselines_pet_metric on public.pet_baselines(pet_id, metric_name);

-- Rollback:
-- drop table if exists public.pet_baselines;
-- drop table if exists public.camera_analyses;
-- drop table if exists public.anomaly_detections;
-- drop table if exists public.health_scores;
