# Migration Rollbacks

This directory contains rollback SQL scripts for each forward migration in `supabase/migrations/`.

## WARNING: Destructive Operations

**Running these rollbacks will permanently delete data.** Always back up your database before proceeding:

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Execution Order

Rollbacks must be run in **reverse order** — highest number first, lowest number last. Each rollback undoes only its corresponding forward migration, so the sequence must be respected to avoid foreign-key or dependency errors.

```
010 -> 009 -> 008 -> 007 -> 006 -> 005 -> 004 -> 003 -> 002 -> 001
```

## Command Pattern

Run a single rollback:

```bash
psql $DATABASE_URL -f supabase/migrations/rollbacks/rollback_NNN_name.sql
```

To roll back all migrations in order (full teardown):

```bash
psql $DATABASE_URL -f supabase/migrations/rollbacks/rollback_010_job_queue.sql
psql $DATABASE_URL -f supabase/migrations/rollbacks/rollback_009_indexes.sql
psql $DATABASE_URL -f supabase/migrations/rollbacks/rollback_008_push_subscriptions.sql
psql $DATABASE_URL -f supabase/migrations/rollbacks/rollback_007_email_notifications.sql
psql $DATABASE_URL -f supabase/migrations/rollbacks/rollback_006_notification_channels.sql
psql $DATABASE_URL -f supabase/migrations/rollbacks/rollback_005_subscriptions.sql
psql $DATABASE_URL -f supabase/migrations/rollbacks/rollback_004_ai_engine.sql
psql $DATABASE_URL -f supabase/migrations/rollbacks/rollback_003_health_logs.sql
psql $DATABASE_URL -f supabase/migrations/rollbacks/rollback_002_pets.sql
psql $DATABASE_URL -f supabase/migrations/rollbacks/rollback_001_initial_schema.sql
```

## Partial Rollbacks

To roll back only the last N migrations, start from the highest number and stop before going further than needed. For example, to undo only migrations 009 and 010:

```bash
psql $DATABASE_URL -f supabase/migrations/rollbacks/rollback_010_job_queue.sql
psql $DATABASE_URL -f supabase/migrations/rollbacks/rollback_009_indexes.sql
```

## File Reference

| File | Undoes | What it drops |
|------|--------|---------------|
| `rollback_010_job_queue.sql` | `010_job_queue.sql` | `ai_jobs` table, `job_status`/`job_type` ENUMs, triggers, functions |
| `rollback_009_indexes.sql` | `009_indexes.sql` | All CONCURRENTLY-created performance indexes, `pg_stat_statements` extension |
| `rollback_008_push_subscriptions.sql` | `008_push_subscriptions.sql` | `push_subscriptions` table, RLS policy, index |
| `rollback_007_email_notifications.sql` | `007_email_notifications.sql` | Removes `email_enabled` column; restores dropped `line_notify_token`/`line_enabled` columns |
| `rollback_006_notification_channels.sql` | `006_notification_channels.sql` | LINE/WhatsApp columns from `notification_preferences`, `preferred_language` from `profiles` |
| `rollback_005_subscriptions.sql` | `005_subscriptions.sql` | `subscriptions`, `billing_events`, `notification_preferences` tables, related triggers and functions |
| `rollback_004_ai_engine.sql` | `004_ai_engine.sql` | `health_scores`, `anomaly_detections`, `camera_analyses`, `pet_baselines` tables |
| `rollback_003_health_logs.sql` | `003_health_logs.sql` | `health_logs`, `symptom_reports`, `vet_visits` tables |
| `rollback_002_pets.sql` | `002_pets.sql` | `pets`, `pet_weight_history`, `pet_photos` tables, `record_weight_change` function |
| `rollback_001_initial_schema.sql` | `001_initial_schema.sql` | `profiles` table, `handle_new_user`/`set_updated_at` functions, all base extensions |

## Notes

- **Migration 007** is unusual: it dropped the LINE Notify columns added by 006. Its rollback restores those columns so that rolling back 006 afterward can safely drop them again.
- **Migration 009** indexes overlap with indexes created in earlier migrations (003, 004, 005) using the same names. The rollback uses `DROP INDEX IF EXISTS`, so running it is safe even if the index was originally created by an earlier migration — but be aware that rolling back only 009 may remove indexes that earlier migrations intended to keep.
- **Extension drops in rollback_001** should only be executed if you are performing a full schema teardown. Extensions like `uuid-ossp` and `pgcrypto` may be used by other schemas or Supabase internals.
