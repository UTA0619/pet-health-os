-- Rollback for migration 004_ai_engine.sql

-- Drop RLS policies on pet_baselines
DROP POLICY IF EXISTS baselines_select_own ON public.pet_baselines;
DROP POLICY IF EXISTS baselines_upsert_service ON public.pet_baselines;

-- Drop RLS policies on camera_analyses
DROP POLICY IF EXISTS camera_select_own ON public.camera_analyses;
DROP POLICY IF EXISTS camera_insert_service ON public.camera_analyses;

-- Drop RLS policies on anomaly_detections
DROP POLICY IF EXISTS anomalies_select_own ON public.anomaly_detections;
DROP POLICY IF EXISTS anomalies_update_own ON public.anomaly_detections;
DROP POLICY IF EXISTS anomalies_insert_service ON public.anomaly_detections;

-- Drop RLS policies on health_scores
DROP POLICY IF EXISTS health_scores_select_own ON public.health_scores;
DROP POLICY IF EXISTS health_scores_insert_service ON public.health_scores;
DROP POLICY IF EXISTS health_scores_update_service ON public.health_scores;

-- Drop tables (child tables first)
DROP TABLE IF EXISTS public.pet_baselines;
DROP TABLE IF EXISTS public.camera_analyses;
DROP TABLE IF EXISTS public.anomaly_detections;
DROP TABLE IF EXISTS public.health_scores;
