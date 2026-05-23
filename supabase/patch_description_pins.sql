-- Esegui in SQL Editor dopo la migrazione base.
ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE quick_notes ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE;
