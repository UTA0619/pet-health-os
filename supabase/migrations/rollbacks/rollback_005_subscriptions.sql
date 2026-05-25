-- Rollback for migration 005_subscriptions.sql

-- Drop triggers on profiles first
DROP TRIGGER IF EXISTS on_profile_created_subscription ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_created_notif_prefs ON public.profiles;

-- Drop trigger on subscriptions
DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;

-- Drop trigger on notification_preferences
DROP TRIGGER IF EXISTS notif_prefs_updated_at ON public.notification_preferences;

-- Drop helper functions
DROP FUNCTION IF EXISTS public.handle_new_profile_subscription();
DROP FUNCTION IF EXISTS public.handle_new_profile_notif_prefs();
DROP FUNCTION IF EXISTS public.is_pro_user(uuid);

-- Drop RLS policies on notification_preferences
DROP POLICY IF EXISTS notif_prefs_select_own ON public.notification_preferences;
DROP POLICY IF EXISTS notif_prefs_upsert_own ON public.notification_preferences;

-- Drop RLS policies on billing_events
DROP POLICY IF EXISTS billing_events_select_own ON public.billing_events;
DROP POLICY IF EXISTS billing_events_insert_service ON public.billing_events;

-- Drop RLS policies on subscriptions
DROP POLICY IF EXISTS subscriptions_select_own ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_insert_service ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_update_service ON public.subscriptions;

-- Drop tables (notification_preferences first — no dependencies from other migrations)
DROP TABLE IF EXISTS public.notification_preferences;
DROP TABLE IF EXISTS public.billing_events;
DROP TABLE IF EXISTS public.subscriptions;
