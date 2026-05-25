-- Rollback for migration 007_email_notifications.sql

-- Re-add LINE columns that were dropped by this migration
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS line_notify_token text,
  ADD COLUMN IF NOT EXISTS line_enabled       boolean NOT NULL DEFAULT false;

-- Remove the email_enabled column added by this migration
ALTER TABLE public.notification_preferences
  DROP COLUMN IF EXISTS email_enabled;
