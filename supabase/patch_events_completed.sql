-- DaySync: add missing `completed` on events (fixes checkbox + PostgREST schema)
-- Run once in: Supabase Dashboard → SQL Editor → New query → Run

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_events_user_completed
  ON public.events (user_id, completed);

-- Bust PostgREST schema cache (hosted Supabase usually reloads automatically)
NOTIFY pgrst, 'reload schema';
