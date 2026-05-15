-- ============================================================
-- Migration 002: Pets
-- Pet profiles and photo storage records
-- ============================================================

-- ── Pets ────────────────────────────────────────────────────
create table public.pets (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  species       text not null check (species in ('dog', 'cat', 'rabbit', 'bird', 'reptile', 'other')),
  breed         text,
  sex           text check (sex in ('male', 'female', 'unknown')),
  date_of_birth date,
  weight_kg     numeric(5,2),
  photo_url     text,
  microchip_id  text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.pets enable row level security;

create policy "pets_select_own" on public.pets
  for select using (auth.uid() = owner_id);

create policy "pets_insert_own" on public.pets
  for insert with check (auth.uid() = owner_id);

create policy "pets_update_own" on public.pets
  for update using (auth.uid() = owner_id);

create policy "pets_delete_own" on public.pets
  for delete using (auth.uid() = owner_id);

create trigger pets_updated_at
  before update on public.pets
  for each row execute function public.set_updated_at();

-- ── Pet weight history ───────────────────────────────────────
create table public.pet_weight_history (
  id         uuid primary key default uuid_generate_v4(),
  pet_id     uuid not null references public.pets(id) on delete cascade,
  weight_kg  numeric(5,2) not null,
  recorded_at timestamptz not null default now()
);

alter table public.pet_weight_history enable row level security;

create policy "pet_weight_select_own" on public.pet_weight_history
  for select using (
    exists (select 1 from public.pets where id = pet_id and owner_id = auth.uid())
  );

-- Track weight changes automatically
create or replace function public.record_weight_change()
returns trigger language plpgsql security definer as $$
begin
  if old.weight_kg is distinct from new.weight_kg and new.weight_kg is not null then
    insert into public.pet_weight_history (pet_id, weight_kg)
    values (new.id, new.weight_kg);
  end if;
  return new;
end;
$$;

create trigger on_pet_weight_change
  after update on public.pets
  for each row execute function public.record_weight_change();

-- ── Pet photos ───────────────────────────────────────────────
create table public.pet_photos (
  id            uuid primary key default uuid_generate_v4(),
  pet_id        uuid not null references public.pets(id) on delete cascade,
  storage_url   text not null,
  cdn_url       text,
  taken_at      timestamptz,
  upload_source text check (upload_source in ('camera', 'gallery', 'onboarding')),
  is_profile    boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table public.pet_photos enable row level security;

create policy "pet_photos_select_own" on public.pet_photos
  for select using (
    exists (select 1 from public.pets where id = pet_id and owner_id = auth.uid())
  );

create policy "pet_photos_insert_own" on public.pet_photos
  for insert with check (
    exists (select 1 from public.pets where id = pet_id and owner_id = auth.uid())
  );

-- ── Indexes ──────────────────────────────────────────────────
create index idx_pets_owner_id on public.pets(owner_id);
create index idx_pets_owner_active on public.pets(owner_id, is_active);
create index idx_pet_photos_pet_id on public.pet_photos(pet_id);
create index idx_pet_weight_pet_id_at on public.pet_weight_history(pet_id, recorded_at desc);

-- Rollback:
-- drop trigger if exists on_pet_weight_change on public.pets;
-- drop function if exists public.record_weight_change();
-- drop table if exists public.pet_photos;
-- drop table if exists public.pet_weight_history;
-- drop table if exists public.pets;
