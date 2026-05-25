-- Rollback for migration 006_notification_channels.sql

-- Drop indexes added by this migration
DROP INDEX IF EXISTS idx_notif_prefs_line_enabled;
DROP INDEX IF EXISTS idx_notif_prefs_whatsapp_enabled;

-- Remove columns added to notification_preferences
ALTER TABLE public.notification_preferences
  DROP COLUMN IF EXISTS line_notify_token,
  DROP COLUMN IF EXISTS line_enabled,
  DROP COLUMN IF EXISTS whatsapp_phone,
  DROP COLUMN IF EXISTS whatsapp_enabled,
  DROP COLUMN IF EXISTS reminder_hour;

-- Remove column added to profiles
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS preferred_language;
