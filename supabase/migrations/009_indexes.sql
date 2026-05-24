-- Migration 009: Performance indexes
-- Adds composite indexes for all high-frequency query patterns
-- Estimated improvement: <100ms for all indexed queries at 10K pets

-- ─── health_logs ─────────────────────────────────────────────────────────────
-- Primary access pattern: fetch last N logs for a pet
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_health_logs_pet_date
  ON health_logs (pet_id, log_date DESC);

-- Partial index for recent logs (last 90 days) — most queries stay in this range
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_health_logs_recent
  ON health_logs (pet_id, log_date DESC)
  WHERE log_date >= CURRENT_DATE - INTERVAL '90 days';

-- ─── pets ────────────────────────────────────────────────────────────────────
-- Owner lookup (dashboard load)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pets_owner_active
  ON pets (owner_id, is_active)
  WHERE is_active = true;

-- ─── health_scores ───────────────────────────────────────────────────────────
-- Latest score per pet
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_health_scores_pet_date
  ON health_scores (pet_id, score_date DESC);

-- ─── anomaly_detections ──────────────────────────────────────────────────────
-- Unresolved alerts for a pet (dashboard + cron)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_anomaly_pet_unresolved
  ON anomaly_detections (pet_id, detected_at DESC)
  WHERE resolved_at IS NULL;

-- 24h deduplication check (cron uses this heavily)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_anomaly_pet_type_recent
  ON anomaly_detections (pet_id, anomaly_type, detected_at DESC);

-- ─── camera_analyses ─────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_camera_pet_date
  ON camera_analyses (pet_id, analyzed_at DESC);

-- ─── pet_baselines ───────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_baselines_pet_metric
  ON pet_baselines (pet_id, metric_name);

-- ─── push_subscriptions ──────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_push_user
  ON push_subscriptions (user_id);

-- ─── profiles ────────────────────────────────────────────────────────────────
-- Referral code lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_referral_code
  ON profiles (referral_code)
  WHERE referral_code IS NOT NULL;

-- ─── subscriptions ───────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_status
  ON subscriptions (user_id, status);

-- Enable pg_stat_statements for query performance monitoring
-- (no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
