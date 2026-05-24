/**
 * AI Job Queue — lightweight async job system backed by Supabase Postgres.
 *
 * Replaces pg-boss without requiring the pg-boss extension.
 * Workers are triggered by the existing every-30-minute cron.
 *
 * Usage:
 *   await enqueueJob('health_score_compute', { petId, logDate }, { priority: 3 });
 *   const jobs = await claimJobs('health_score_compute', 10);
 *   await completeJob(job.id, { score: 87 });
 *   await failJob(job.id, 'timeout', shouldRetry);
 */

import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type JobType =
  | "health_score_compute"
  | "camera_analysis"
  | "anomaly_check"
  | "notification_send"
  | "baseline_sync";

export interface Job<T = Record<string, unknown>> {
  id: string;
  job_type: JobType;
  status: "pending" | "running" | "completed" | "failed" | "dead";
  payload: T;
  result: Record<string, unknown> | null;
  error: string | null;
  retry_count: number;
  max_retries: number;
  priority: number;
  scheduled_at: string;
  created_at: string;
}

interface EnqueueOptions {
  priority?: number;   // 1 (highest) – 10 (lowest), default 5
  maxRetries?: number; // default 3
  delayMs?: number;    // schedule in the future
}

/** Add a job to the queue. Returns the job ID. */
export async function enqueueJob(
  type: JobType,
  payload: Record<string, unknown>,
  options: EnqueueOptions = {}
): Promise<string> {
  const supabase = createServiceClient();
  const scheduledAt = options.delayMs
    ? new Date(Date.now() + options.delayMs).toISOString()
    : new Date().toISOString();

  const { data, error } = await supabase
    .from("ai_jobs")
    .insert({
      job_type: type,
      payload,
      priority: options.priority ?? 5,
      max_retries: options.maxRetries ?? 3,
      scheduled_at: scheduledAt,
    })
    .select("id")
    .single();

  if (error) {
    logger.error("enqueueJob failed", { type, error: error.message });
    throw new Error(`enqueueJob: ${error.message}`);
  }

  logger.info("job enqueued", { jobId: data.id, type });
  return data.id;
}

/**
 * Atomically claim up to `limit` pending jobs of a given type.
 * Sets status = 'running' and started_at = now().
 * Uses a CTE to avoid race conditions between concurrent workers.
 */
export async function claimJobs<T = Record<string, unknown>>(
  type: JobType,
  limit = 10
): Promise<Job<T>[]> {
  const supabase = createServiceClient();

  // Postgres CTE with FOR UPDATE SKIP LOCKED for safe concurrent claiming
  const { data, error } = await supabase.rpc("claim_ai_jobs", {
    p_job_type: type,
    p_limit: limit,
  });

  if (error) {
    logger.error("claimJobs failed", { type, error: error.message });
    return [];
  }

  return (data ?? []) as Job<T>[];
}

/** Mark a job as successfully completed. */
export async function completeJob(
  jobId: string,
  result: Record<string, unknown> = {}
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("ai_jobs")
    .update({
      status: "completed",
      result,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) logger.error("completeJob failed", { jobId, error: error.message });
  else logger.info("job completed", { jobId });
}

/** Mark a job as failed. If retry count < max_retries, requeues it. */
export async function failJob(
  jobId: string,
  errorMessage: string,
  retry = true
): Promise<void> {
  const supabase = createServiceClient();

  // Read current retry count
  const { data: job } = await supabase
    .from("ai_jobs")
    .select("retry_count, max_retries, job_type, payload, priority")
    .eq("id", jobId)
    .single();

  if (!job) return;

  const newRetryCount = job.retry_count + 1;
  const isDead = !retry || newRetryCount >= job.max_retries;

  await supabase
    .from("ai_jobs")
    .update({
      status: isDead ? "dead" : "failed",
      error: errorMessage,
      retry_count: newRetryCount,
      completed_at: isDead ? new Date().toISOString() : null,
    })
    .eq("id", jobId);

  if (!isDead) {
    // Exponential backoff: 2^retryCount minutes
    const delayMs = Math.pow(2, newRetryCount) * 60_000;
    await enqueueJob(job.job_type as JobType, job.payload as Record<string, unknown>, {
      priority: job.priority,
      maxRetries: job.max_retries,
      delayMs,
    });
    logger.info("job requeued after failure", { jobId, retry: newRetryCount, delayMs });
  } else {
    logger.warn("job moved to dead letter queue", { jobId, error: errorMessage });
  }
}

/** Get queue statistics for the admin dashboard. */
export async function getQueueStats(): Promise<Record<string, number>> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("ai_jobs")
    .select("status")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (!data) return {};
  return data.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});
}
