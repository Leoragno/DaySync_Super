import { Preferences } from '@capacitor/preferences';

/**
 * Persistent cache layer for offline support and Android widget data sharing.
 *
 * HYBRID STRATEGY:
 * 1. Uses localStorage for synchronous access (fast startup for React Query).
 * 2. Uses Capacitor Preferences for persistent storage shared with Native Android.
 * 
 * Future native widgets can read from the XML shared preferences file:
 * File: /data/data/com.daysync.app/shared_prefs/CapacitorStorage.xml
 */

const CACHE_PREFIX = 'daysync_cache_';
const CACHE_META_PREFIX = 'daysync_meta_';

export const dataCache = {
  /**
   * Store entity data in persistent cache (Sync + Async).
   * @param {string} table - Table/entity name
   * @param {Array} data - Array of records
   */
  async set(table, data) {
    try {
      const key = CACHE_PREFIX + table;
      const metaKey = CACHE_META_PREFIX + table;
      const json = JSON.stringify(data);
      const meta = JSON.stringify({
        updatedAt: Date.now(),
        count: data.length,
      });

      // 1. Sync write for web layer (always completes — UI depends on this)
      localStorage.setItem(key, json);
      localStorage.setItem(metaKey, meta);

      // 2. Native mirror: must NOT block callers. On some Android builds
      // Capacitor Preferences can stall indefinitely; awaiting here froze
      // save/delete after the Supabase request had already succeeded.
      void Promise.all([
        Preferences.set({ key, value: json }),
        Preferences.set({ key: metaKey, value: meta }),
      ]).catch((err) => console.warn(`[Cache] Native persist failed (${table}):`, err));
    } catch (err) {
      console.warn(`[Cache] Failed to write ${table}:`, err);
    }
  },

  /**
   * Read cached entity data (Synchronous).
   * Used for initialData in React Query to prevent layout shifts.
   */
  get(table) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + table);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Get cache metadata (Synchronous).
   */
  getMeta(table) {
    try {
      const raw = localStorage.getItem(CACHE_META_PREFIX + table);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Check if cached data is stale.
   */
  isStale(table, maxAgeMs = 5 * 60 * 1000) {
    const meta = this.getMeta(table);
    if (!meta) return true;
    return Date.now() - meta.updatedAt > maxAgeMs;
  },

  /**
   * Remove cached data (Sync + Async).
   */
  async remove(table) {
    const key = CACHE_PREFIX + table;
    const metaKey = CACHE_META_PREFIX + table;
    
    localStorage.removeItem(key);
    localStorage.removeItem(metaKey);

    void Promise.all([
      Preferences.remove({ key }),
      Preferences.remove({ key: metaKey }),
    ]).catch((err) => console.warn(`[Cache] Native remove failed (${table}):`, err));
  },

  /**
   * Clear all DaySync cached data.
   */
  async clearAll() {
    const keys = Object.keys(localStorage).filter(
      (k) => k.startsWith(CACHE_PREFIX) || k.startsWith(CACHE_META_PREFIX)
    );
    
    for (const k of keys) {
      localStorage.removeItem(k);
      void Preferences.remove({ key: k }).catch((err) =>
        console.warn(`[Cache] Native clear key failed (${k}):`, err)
      );
    }
  },
};
