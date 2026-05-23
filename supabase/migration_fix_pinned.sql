-- =============================================================
-- DaySync — Fix quick_notes pinned column and refresh PostgREST cache
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================

-- Add pinned column if it doesn't exist (with safe default)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'quick_notes' 
    AND column_name = 'pinned'
  ) THEN
    ALTER TABLE public.quick_notes 
    ADD COLUMN pinned BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Ensure the column has the correct default value
ALTER TABLE public.quick_notes 
  ALTER COLUMN pinned SET DEFAULT FALSE;

-- Create index on pinned for performance (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE tablename = 'quick_notes' 
    AND indexname = 'idx_quick_notes_user_pinned'
  ) THEN
    CREATE INDEX idx_quick_notes_user_pinned 
    ON public.quick_notes(user_id, pinned DESC, created_at DESC);
  END IF;
END $$;

-- Replace the old index with the optimized one (if the old one exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE tablename = 'quick_notes' 
    AND indexname = 'idx_quick_notes_user'
  ) THEN
    DROP INDEX idx_quick_notes_user;
  END IF;
END $$;

-- Verify the column exists
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'quick_notes' 
AND column_name = 'pinned';

-- Refresh PostgREST schema cache
-- This ensures the API immediately recognizes the new column
NOTIFY pgrst, 'reload schema';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully: quick_notes.pinned column is now available';
END $$;
