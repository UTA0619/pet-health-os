-- Rollback for migration 009_indexes.sql

-- Drop all indexes added by this migration
-- Note: CONCURRENTLY cannot be used inside a transaction block
DROP INDEX IF EXISTS idx_health_logs_pet_date;
DROP INDEX IF EXISTS idx_health_logs_recent;
DROP INDEX IF EXISTS idx_pets_owner_active;
DROP INDEX IF EXISTS idx_health_scores_pet_date;
DROP INDEX IF EXISTS idx_anomaly_pet_unresolved;
DROP INDEX IF EXISTS idx_anomaly_pet_type_recent;
DROP INDEX IF EXISTS idx_camera_pet_date;
DROP INDEX IF EXISTS idx_baselines_pet_metric;
DROP INDEX IF EXISTS idx_push_user;
DROP INDEX IF EXISTS idx_profiles_referral_code;
DROP INDEX IF EXISTS idx_subscriptions_user_status;

-- Drop extension added by this migration
-- (Only safe if nothing else depends on pg_stat_statements)
DROP EXTENSION IF EXISTS pg_stat_statements;
