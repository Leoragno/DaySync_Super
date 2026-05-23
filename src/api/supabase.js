import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[DaySync] Missing Supabase configuration. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Ensure we don't pass undefined to createClient which might throw
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    })
  : null;

/**
 * Diagnostic tool to check if the user's Supabase project has the required tables.
 */
export const checkTables = async () => {
  if (!supabase) return { success: false, message: "Client non inizializzato" };
  const tables = ['profiles', 'events', 'notes', 'schedules', 'categories', 'quick_notes'];
  try {
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && error.code === '42P01') {
        return { success: false, message: `Tabella '${table}' mancante! Controlla il database.` };
      }
    }
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
};
