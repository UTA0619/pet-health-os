-- Migration 010: AI Job Queue
-- Lightweight job queue using Postgres (pg-boss alternative without extension)
-- Jobs are polled by the run-anomaly-detection cron every 30 minutes

CREATE TYPE job_status AS ENUM ('pending', 'running', 'completed', 'failed', 'dead');
CREATE TYPE job_type AS ENUM (
  'health_score_compute',
  'camera_analysis',
  'anomaly_check',
  'notification_send',
  'baseline_sync'
);

CREATE TABLE IF NOT EXISTS ai_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type      job_type    NOT NULL,
  status        job_status  NOT NULL DEFAULT 'pending',
  payload       JSONB       NOT NULL DEFAULT '{}',
  result        JSONB,
  error         TEXT,
  retry_count   INTEGER     NOT NULL DEFAULT 0,
  max_retries   INTEGER     NOT NULL DEFAULT 3,
  priority      INTEGER     NOT NULL DEFAULT 5,  -- 1=highest, 10=lowest
  scheduled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for worker polling
CREATE INDEX idx_jobs_poll ON ai_jobs (status, priority, scheduled_at)
  WHERE status = 'pending';

CREATE INDEX idx_jobs_running ON ai_jobs (status, started_at)
  WHERE status = 'running';

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_ai_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_jobs_updated_at
  BEFORE UPDATE ON ai_jobs
  FOR EACH ROW EXECUTE FUNCTION update_ai_jobs_updated_at();

-- Dead-letter: move jobs with retry_count >= max_retries to 'dead'
CREATE OR REPLACE FUNCTION mark_dead_jobs()
RETURNS void AS $$
BEGIN
  UPDATE ai_jobs
  SET status = 'dead'
  WHERE status = 'failed'
    AND retry_count >= max_retries;
END;
$$ LANGUAGE plpgsql;

-- Service role only (no RLS — internal use)
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_jobs_service_only ON ai_jobs
  USING (auth.role() = 'service_role');
