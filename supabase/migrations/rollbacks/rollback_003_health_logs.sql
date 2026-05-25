-- Rollback for migration 003_health_logs.sql

-- Drop trigger on health_logs
DROP TRIGGER IF EXISTS health_logs_updated_at ON public.health_logs;

-- Drop RLS policies on vet_visits
DROP POLICY IF EXISTS vet_visits_select_own ON public.vet_visits;
DROP POLICY IF EXISTS vet_visits_insert_own ON public.vet_visits;

-- Drop RLS policies on symptom_reports
DROP POLICY IF EXISTS symptoms_select_own ON public.symptom_reports;
DROP POLICY IF EXISTS symptoms_insert_own ON public.symptom_reports;

-- Drop RLS policies on health_logs
DROP POLICY IF EXISTS health_logs_select_own ON public.health_logs;
DROP POLICY IF EXISTS health_logs_insert_own ON public.health_logs;
DROP POLICY IF EXISTS health_logs_update_own ON public.health_logs;

-- Drop tables
DROP TABLE IF EXISTS public.vet_visits;
DROP TABLE IF EXISTS public.symptom_reports;
DROP TABLE IF EXISTS public.health_logs;
