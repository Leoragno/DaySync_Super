/**
 * Shared constants used across the application.
 * Centralized here to avoid magic strings and ensure consistency.
 */

// Schedule day options
export const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

// Available colors for entities
export const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4',
  '#84cc16', '#f97316',
];

// Named colors for quick notes UI
export const NAMED_COLORS = [
  { hex: '#6366f1', name: 'viola' },
  { hex: '#ec4899', name: 'rosa' },
  { hex: '#f59e0b', name: 'arancio' },
  { hex: '#10b981', name: 'verde' },
  { hex: '#3b82f6', name: 'blu' },
  { hex: '#ef4444', name: 'rosso' },
  { hex: '#8b5cf6', name: 'lilla' },
  { hex: '#06b6d4', name: 'cyan' },
];

// Event types
export const EVENT_TYPES = ['impegno', 'scadenza', 'promemoria', 'altro'];

// Reminder durations for events
export const REMINDER_OPTIONS = [
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 ora', value: 60 },
  { label: '2 ore', value: 120 },
  { label: '1 giorno', value: 1440 },
];

// Note statuses for Kanban
export const NOTE_STATUSES = [
  { value: 'todo', label: 'Da fare', color: '#6366f1' },
  { value: 'in_progress', label: 'In corso', color: '#f59e0b' },
  { value: 'done', label: 'Completato', color: '#10b981' },
];

// Schedule grid config
export const SCHEDULE_HOURS = Array.from(
  { length: 17 },
  (_, i) => `${String(i + 6).padStart(2, '0')}:00`
); // 06:00 – 22:00

export const HOUR_HEIGHT_PX = 56;
export const SCHEDULE_START_HOUR = 6;

// Default form values
export const DEFAULT_SCHEDULE = {
  day: 'Lun', hour: '08:00', end_hour: '09:00',
  title: '', category: '', color: '#6366f1',
};

export const DEFAULT_NOTE = {
  title: '', content: '', color: '#6366f1',
  category: '', pinned: false, status: 'todo',
};

export const DEFAULT_QUICK_NOTE = {
  content: '', color: '#6366f1', pinned: false,
};

// Italian day abbreviation map (date-fns 'EEE' locale output → entity enum)
export const DAY_ABBR_MAP = {
  lun: 'Lun', mar: 'Mar', mer: 'Mer',
  gio: 'Gio', ven: 'Ven', sab: 'Sab', dom: 'Dom',
};
