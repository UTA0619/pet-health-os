-- ============================================================
-- Migration 001: Initial Schema
-- Extensions, profiles table, and base triggers
-- ============================================================

-- Extensions
create extension if not exists "vector" with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pg_trgm" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;

-- ── Profiles ────────────────────────────────────────────────
create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null,
  full_name           text,
  avatar_url          text,
  subscription_tier   text not null default 'free' check (subscription_tier in ('free', 'pro', 'premium')),
  onboarding_complete boolean not null default false,
  onboarding_step     int not null default 0,
  referral_code       text unique default left(md5(gen_random_uuid()::text), 12),
  referred_by         uuid references public.profiles(id),
  timezone            text not null default 'UTC',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── Indexes ──────────────────────────────────────────────────
create index idx_profiles_referral_code on public.profiles(referral_code);
create index idx_profiles_subscription_tier on public.profiles(subscription_tier);

-- Rollback (run manually if needed):
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop trigger if exists profiles_updated_at on public.profiles;
-- drop function if exists public.handle_new_user();
-- drop function if exists public.set_updated_at();
-- drop table if exists public.profiles;
