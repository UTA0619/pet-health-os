-- Rollback for migration 008_push_subscriptions.sql

-- Drop index
DROP INDEX IF EXISTS push_subscriptions_user_id_idx;

-- Drop RLS policy
DROP POLICY IF EXISTS "Users manage own push subscriptions" ON public.push_subscriptions;

-- Drop table
DROP TABLE IF EXISTS public.push_subscriptions;
