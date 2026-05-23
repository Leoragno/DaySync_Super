-- Se la tabella 'schedule' esiste ma 'schedules' no, la rinominiamo
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schedule') 
     AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schedules') THEN
    ALTER TABLE public.schedule RENAME TO schedules;
  END IF;
END $$;

-- Se nessuna delle due esiste, creiamo 'schedules'
CREATE TABLE IF NOT EXISTS public.schedules (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day        TEXT NOT NULL, -- Usiamo TEXT per semplicità se l'enum non è definito
  hour       TEXT NOT NULL,
  end_hour   TEXT,
  title      TEXT NOT NULL,
  category   TEXT,
  color      TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Abilita RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Policy per l'utente loggato
CREATE POLICY "Users can manage their own schedules" 
ON public.schedules FOR ALL 
USING (auth.uid() = user_id);
