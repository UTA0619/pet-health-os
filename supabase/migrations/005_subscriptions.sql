-- ============================================================
-- Migration 005: Subscriptions & Notifications
-- Stripe subscription state, notification preferences, billing events
-- ============================================================

-- ── Subscriptions ────────────────────────────────────────────
create table public.subscriptions (
  id                     uuid primary key default uuid_generate_v4(),
  user_id                uuid not null references public.profiles(id) on delete cascade,
  plan                   text not null default 'free' check (plan in ('free', 'pro', 'premium')),
  status                 text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'cancelled', 'incomplete')),
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  trial_start            timestamptz,
  trial_end              timestamptz,
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  cancel_at              timestamptz,
  cancelled_at           timestamptz,
  -- Feature gates (denormalized for fast reads)
  features               jsonb not null default '{
    "max_pets": 1,
    "camera_analyses_per_day": 3,
    "anomaly_alerts": false,
    "health_report_pdf": false,
    "advanced_ai": false,
    "vet_sharing": false
  }',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint subscriptions_user_unique unique (user_id)
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "subscriptions_insert_service" on public.subscriptions
  for insert with check (auth.role() = 'service_role');

create policy "subscriptions_update_service" on public.subscriptions
  for update using (auth.role() = 'service_role');

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Auto-create free subscription on profile creation
create or replace function public.handle_new_profile_subscription()
returns trigger language plpgsql security definer as $$
begin
  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_profile_created_subscription
  after insert on public.profiles
  for each row execute function public.handle_new_profile_subscription();

-- ── Billing events ───────────────────────────────────────────
create table public.billing_events (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references public.profiles(id) on delete set null,
  event_type      text not null,  -- e.g. 'subscription.created', 'invoice.payment_failed'
  stripe_event_id text unique,
  amount_cents    int,
  currency        text default 'usd',
  metadata        jsonb default '{}',
  processed_at    timestamptz not null default now()
);

alter table public.billing_events enable row level security;

create policy "billing_events_select_own" on public.billing_events
  for select using (auth.uid() = user_id);

create policy "billing_events_insert_service" on public.billing_events
  for insert with check (auth.role() = 'service_role');

-- ── Notification preferences ─────────────────────────────────
create table public.notification_preferences (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  -- Push notification settings
  push_enabled            boolean not null default false,
  daily_score_reminder    boolean not null default true,
  anomaly_alerts          boolean not null default true,
  weekly_report           boolean not null default true,
  health_tips             boolean not null default false,
  -- Email settings
  email_enabled           boolean not null default true,
  email_weekly_report     boolean not null default true,
  email_anomaly_alerts    boolean not null default true,
  -- OneSignal
  onesignal_player_id     text,
  onesignal_subscribed_at timestamptz,
  -- Preferred notification time (local hour 0–23)
  preferred_hour          smallint default 8 check (preferred_hour between 0 and 23),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint notification_prefs_user_unique unique (user_id)
);

alter table public.notification_preferences enable row level security;

create policy "notif_prefs_select_own" on public.notification_preferences
  for select using (auth.uid() = user_id);

create policy "notif_prefs_upsert_own" on public.notification_preferences
  for all using (auth.uid() = user_id);

create trigger notif_prefs_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- Auto-create notification preferences on profile creation
create or replace function public.handle_new_profile_notif_prefs()
returns trigger language plpgsql security definer as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_profile_created_notif_prefs
  after insert on public.profiles
  for each row execute function public.handle_new_profile_notif_prefs();

-- ── Helper: check if user has active pro subscription ────────
create or replace function public.is_pro_user(p_user_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = p_user_id
    and plan in ('pro', 'premium')
    and status in ('active', 'trialing')
  );
$$;

-- ── Indexes ──────────────────────────────────────────────────
create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_stripe_customer on public.subscriptions(stripe_customer_id);
create index idx_subscriptions_stripe_sub on public.subscriptions(stripe_subscription_id);
create index idx_subscriptions_status on public.subscriptions(status) where status != 'cancelled';
create index idx_billing_events_user on public.billing_events(user_id, processed_at desc);
create index idx_billing_events_stripe_id on public.billing_events(stripe_event_id);
create index idx_notif_prefs_user on public.notification_preferences(user_id);
create index idx_notif_prefs_push_enabled on public.notification_preferences(user_id)
  where push_enabled = true;

-- Rollback:
-- drop trigger if exists on_profile_created_notif_prefs on public.profiles;
-- drop trigger if exists on_profile_created_subscription on public.profiles;
-- drop function if exists public.handle_new_profile_notif_prefs();
-- drop function if exists public.handle_new_profile_subscription();
-- drop function if exists public.is_pro_user(uuid);
-- drop table if exists public.notification_preferences;
-- drop table if exists public.billing_events;
-- drop table if exists public.subscriptions;
