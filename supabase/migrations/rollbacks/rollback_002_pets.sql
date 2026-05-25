-- Rollback for migration 002_pets.sql

-- Drop triggers
DROP TRIGGER IF EXISTS on_pet_weight_change ON public.pets;
DROP TRIGGER IF EXISTS pets_updated_at ON public.pets;

-- Drop functions
DROP FUNCTION IF EXISTS public.record_weight_change();

-- Drop RLS policies on pet_photos
DROP POLICY IF EXISTS pet_photos_select_own ON public.pet_photos;
DROP POLICY IF EXISTS pet_photos_insert_own ON public.pet_photos;

-- Drop RLS policies on pet_weight_history
DROP POLICY IF EXISTS pet_weight_select_own ON public.pet_weight_history;

-- Drop RLS policies on pets
DROP POLICY IF EXISTS pets_select_own ON public.pets;
DROP POLICY IF EXISTS pets_insert_own ON public.pets;
DROP POLICY IF EXISTS pets_update_own ON public.pets;
DROP POLICY IF EXISTS pets_delete_own ON public.pets;

-- Drop tables (child tables first)
DROP TABLE IF EXISTS public.pet_photos;
DROP TABLE IF EXISTS public.pet_weight_history;
DROP TABLE IF EXISTS public.pets;
