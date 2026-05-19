-- Add email notification support, replacing LINE Notify (service ended March 2025)
alter table public.notification_preferences
  add column if not exists email_enabled boolean not null default true;

-- Remove LINE columns if they exist (no longer needed)
alter table public.notification_preferences
  drop column if exists line_notify_token,
  drop column if exists line_enabled;
