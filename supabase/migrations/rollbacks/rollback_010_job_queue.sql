-- Rollback for migration 010_job_queue.sql

-- Drop trigger first
DROP TRIGGER IF EXISTS ai_jobs_updated_at ON public.ai_jobs;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_ai_jobs_updated_at();
DROP FUNCTION IF EXISTS public.mark_dead_jobs();

-- Drop RLS policy
DROP POLICY IF EXISTS ai_jobs_service_only ON public.ai_jobs;

-- Drop table
DROP TABLE IF EXISTS public.ai_jobs;

-- Drop custom ENUM types (depends on table being dropped first)
DROP TYPE IF EXISTS job_type;
DROP TYPE IF EXISTS job_status;
