-- ============================================================
-- Migration 006: Notification channels + language preference
-- Adds LINE Notify, WhatsApp, and i18n language to user prefs
-- ============================================================

-- Add notification channel columns to notification_preferences
alter table public.notification_preferences
  add column if not exists line_notify_token text,
  add column if not exists line_enabled       boolean not null default false,
  add column if not exists whatsapp_phone     text,
  add column if not exists whatsapp_enabled   boolean not null default false,
  add column if not exists reminder_hour      smallint default 20
    check (reminder_hour between 0 and 23);

-- Add language preference to profiles
alter table public.profiles
  add column if not exists preferred_language text not null default 'ja'
    check (preferred_language in ('ja', 'en'));

-- Index for cron job: find users with active LINE or WhatsApp
create index if not exists idx_notif_prefs_line_enabled
  on public.notification_preferences(user_id)
  where line_enabled = true and line_notify_token is not null;

create index if not exists idx_notif_prefs_whatsapp_enabled
  on public.notification_preferences(user_id)
  where whatsapp_enabled = true and whatsapp_phone is not null;

-- Rollback:
-- alter table public.notification_preferences
--   drop column if exists line_notify_token,
--   drop column if exists line_enabled,
--   drop column if exists whatsapp_phone,
--   drop column if exists whatsapp_enabled,
--   drop column if exists reminder_hour;
-- alter table public.profiles drop column if exists preferred_language;
