-- ============================================================
-- Migration 003: Health Logs
-- Daily health observations, symptom reports, vet visits
-- ============================================================

-- ── Health logs ──────────────────────────────────────────────
-- One log per pet per day. Each metric is 1–5 scale.
create table public.health_logs (
  id               uuid primary key default gen_random_uuid(),
  pet_id           uuid not null references public.pets(id) on delete cascade,
  log_date         date not null default current_date,
  -- Core metrics (1=very poor, 5=excellent)
  activity_level   smallint check (activity_level between 1 and 5),
  appetite         smallint check (appetite between 1 and 5),
  stool_quality    smallint check (stool_quality between 1 and 5),
  coat_condition   smallint check (coat_condition between 1 and 5),
  eye_clarity      smallint check (eye_clarity between 1 and 5),
  energy_level     smallint check (energy_level between 1 and 5),
  -- Optional fields
  notes            text,
  logged_by        text not null default 'owner' check (logged_by in ('owner', 'vet', 'sitter')),
  ai_processed     boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- One log per pet per day
  constraint health_logs_pet_date_unique unique (pet_id, log_date)
);

alter table public.health_logs enable row level security;

create policy "health_logs_select_own" on public.health_logs
  for select using (
    exists (select 1 from public.pets where id = pet_id and owner_id = auth.uid())
  );

create policy "health_logs_insert_own" on public.health_logs
  for insert with check (
    exists (select 1 from public.pets where id = pet_id and owner_id = auth.uid())
  );

create policy "health_logs_update_own" on public.health_logs
  for update using (
    exists (select 1 from public.pets where id = pet_id and owner_id = auth.uid())
  );

create trigger health_logs_updated_at
  before update on public.health_logs
  for each row execute function public.set_updated_at();

-- ── Symptom reports ──────────────────────────────────────────
create table public.symptom_reports (
  id            uuid primary key default gen_random_uuid(),
  pet_id        uuid not null references public.pets(id) on delete cascade,
  symptom_type  text not null,
  severity      text not null check (severity in ('mild', 'moderate', 'severe')),
  onset_date    date,
  resolved_date date,
  notes         text,
  created_at    timestamptz not null default now()
);

alter table public.symptom_reports enable row level security;

create policy "symptoms_select_own" on public.symptom_reports
  for select using (
    exists (select 1 from public.pets where id = pet_id and owner_id = auth.uid())
  );

create policy "symptoms_insert_own" on public.symptom_reports
  for insert with check (
    exists (select 1 from public.pets where id = pet_id and owner_id = auth.uid())
  );

-- ── Vet visits ───────────────────────────────────────────────
create table public.vet_visits (
  id             uuid primary key default gen_random_uuid(),
  pet_id         uuid not null references public.pets(id) on delete cascade,
  visit_date     date not null,
  clinic_name    text,
  vet_name       text,
  visit_type     text check (visit_type in ('routine', 'emergency', 'follow_up', 'specialist')),
  diagnosis      text,
  treatment      text,
  medications    text[],
  follow_up_date date,
  notes          text,
  created_at     timestamptz not null default now()
);

alter table public.vet_visits enable row level security;

create policy "vet_visits_select_own" on public.vet_visits
  for select using (
    exists (select 1 from public.pets where id = pet_id and owner_id = auth.uid())
  );

create policy "vet_visits_insert_own" on public.vet_visits
  for insert with check (
    exists (select 1 from public.pets where id = pet_id and owner_id = auth.uid())
  );

-- ── Indexes ──────────────────────────────────────────────────
create index idx_health_logs_pet_date on public.health_logs(pet_id, log_date desc);
create index idx_health_logs_ai_pending on public.health_logs(ai_processed) where not ai_processed;
create index idx_health_logs_recent on public.health_logs(pet_id, log_date desc);
create index idx_symptom_reports_pet_id on public.symptom_reports(pet_id, onset_date desc);
create index idx_vet_visits_pet_id on public.vet_visits(pet_id, visit_date desc);

-- Full-text search on notes
create index idx_health_logs_notes_fts on public.health_logs
  using gin(to_tsvector('english', coalesce(notes, '')));

-- Rollback:
-- drop table if exists public.vet_visits;
-- drop table if exists public.symptom_reports;
-- drop table if exists public.health_logs;
