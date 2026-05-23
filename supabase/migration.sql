-- =============================================================
-- DaySync — Supabase Database Migration
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- ENUM TYPES
-- =====================

CREATE TYPE event_type AS ENUM ('impegno', 'scadenza', 'promemoria', 'altro');
CREATE TYPE note_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE schedule_day AS ENUM ('Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom');

-- =====================
-- TABLES
-- =====================

-- Events (Agenda)
CREATE TABLE events (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  description TEXT,
  date       DATE NOT NULL,
  time       TEXT,
  end_time   TEXT,
  type       event_type DEFAULT 'impegno',
  category   TEXT,
  completed  BOOLEAN DEFAULT FALSE,
  reminder_minutes INTEGER,
  color      TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedules (Orario - weekly timetable)
CREATE TABLE schedules (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day        schedule_day NOT NULL,
  hour       TEXT NOT NULL,
  end_hour   TEXT,
  title      TEXT NOT NULL,
  category   TEXT,
  color      TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes (Appunti - structured notes with status)
CREATE TABLE notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT,
  color      TEXT DEFAULT '#1e293b',
  category   TEXT,
  pinned     BOOLEAN DEFAULT FALSE,
  status     note_status DEFAULT 'todo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories (shared across schedule and events)
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL,
  icon       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quick Notes (Note rapide - simple text snippets)
CREATE TABLE quick_notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  pinned     BOOLEAN DEFAULT FALSE,
  color      TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================

CREATE INDEX idx_events_user_date ON events(user_id, date DESC);
CREATE INDEX idx_events_user_completed ON events(user_id, completed);
CREATE INDEX idx_schedules_user_day ON schedules(user_id, day);
CREATE INDEX idx_notes_user_status ON notes(user_id, status);
CREATE INDEX idx_notes_user_pinned ON notes(user_id, pinned DESC);
CREATE INDEX idx_quick_notes_user ON quick_notes(user_id, created_at DESC);
CREATE INDEX idx_categories_user ON categories(user_id);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Users can view own events"
  ON events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own events"
  ON events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events"
  ON events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events"
  ON events FOR DELETE USING (auth.uid() = user_id);

-- Schedules policies
CREATE POLICY "Users can view own schedules"
  ON schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own schedules"
  ON schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedules"
  ON schedules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedules"
  ON schedules FOR DELETE USING (auth.uid() = user_id);

-- Notes policies
CREATE POLICY "Users can view own notes"
  ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notes"
  ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE USING (auth.uid() = user_id);

-- Categories policies
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own categories"
  ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE USING (auth.uid() = user_id);

-- Quick Notes policies
CREATE POLICY "Users can view own quick_notes"
  ON quick_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own quick_notes"
  ON quick_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quick_notes"
  ON quick_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quick_notes"
  ON quick_notes FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- AUTO-UPDATE updated_at
-- =====================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_schedules_updated_at
  BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_notes_updated_at
  BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_quick_notes_updated_at
  BEFORE UPDATE ON quick_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
