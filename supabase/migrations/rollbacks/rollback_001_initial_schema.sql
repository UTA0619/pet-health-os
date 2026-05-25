-- Rollback for migration 001_initial_schema.sql

-- Drop triggers (on auth.users and profiles)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.set_updated_at();

-- Drop RLS policies on profiles
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;

-- Drop table
DROP TABLE IF EXISTS public.profiles;

-- Drop extensions last — only safe after all other migrations have been rolled back,
-- as later migrations (004, 009) also reference these extensions.
-- pg_vector (vector): used for embeddings (referenced in 004 comments)
-- uuid-ossp: used for gen_random_uuid() across all tables
-- pg_trgm: used for full-text/trigram indexes
-- pgcrypto: used for gen_random_uuid() in referral_code default
DROP EXTENSION IF EXISTS pg_stat_statements;  -- added by 009, safe to drop here as cleanup
DROP EXTENSION IF EXISTS "vector";
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS "pg_trgm";
DROP EXTENSION IF EXISTS "pgcrypto";
