import { supabase } from '../supabase';
import { dataCache } from '../cache';

/**
 * Creates a typed CRUD interface for a Supabase table.
 * All entity modules use this factory to ensure consistent
 * error handling, caching, and query patterns.
 *
 * @param {string} table - Supabase table name
 * @param {object} options
 * @param {string} [options.defaultSort] - Default sort column
 * @param {boolean} [options.defaultSortAsc] - Sort ascending (default false)
 */
export function createEntity(table, options = {}) {
  const { defaultSort = 'created_at', defaultSortAsc = false } = options;

  return {
    /**
     * List records with optional sort, limit, and filters.
     * Results are cached to persistent storage for offline/widget access.
     */
    async list({ sortBy, ascending, limit, filters } = {}) {
      let query = supabase
        .from(table)
        .select('*')
        .order(sortBy || defaultSort, { ascending: ascending ?? defaultSortAsc });

      if (filters) {
        for (const [column, value] of Object.entries(filters)) {
          query = query.eq(column, value);
        }
      }

      if (limit) {
        query = query.limit(limit);
      }

      try {
        const { data, error } = await query;

        if (error) {
          // Fallback to cache on network error
          if (error.message?.includes('Failed to fetch') || error.code === 'NETWORK_ERROR' || !navigator.onLine) {
            const cached = dataCache.get(table);
            if (cached) return cached;
          }
          throw new EntityError(`Failed to list ${table}`, error);
        }

        // Persist to cache (Async but we await to ensure consistency)
        await dataCache.set(table, data);
        return data;
      } catch (err) {
        // Absolute fallback for unexpected network failures
        if (!navigator.onLine) {
          const cached = dataCache.get(table);
          if (cached) return cached;
        }
        throw err;
      }
    },

    /**
     * Get a single record by ID.
     */
    async get(id) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new EntityError(`Failed to get ${table}/${id}`, error);
      return data;
    },

    /**
     * Create a new record. Automatically injects the current user's ID.
     * Sanitizes empty strings to null for database compatibility.
     */
    async create(record) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new EntityError('Not authenticated', { message: 'User not logged in' });

      // Convert empty strings to null for database compatibility (e.g. for TIME/DATE columns)
      const sanitized = { ...record };
      for (const key in sanitized) {
        if (sanitized[key] === '') sanitized[key] = null;
      }

      const { data, error } = await supabase
        .from(table)
        .insert({ ...sanitized, user_id: user.id })
        .select()
        .single();

      if (error) {
        console.error(`Supabase Create Error [${table}]:`, error);
        throw new EntityError(`Failed to create ${table}`, error);
      }

      const cached = dataCache.get(table);
      if (cached) {
        await dataCache.set(table, [data, ...cached]);
      }
      return data;
    },

    /**
     * Update a record by ID.
     */
    async update(id, updates) {
      // Convert empty strings to null
      const sanitized = { ...updates };
      for (const key in sanitized) {
        if (sanitized[key] === '') sanitized[key] = null;
      }

      const { data, error } = await supabase
        .from(table)
        .update(sanitized)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Supabase Update Error [${table} ID: ${id}]:`, error);
        throw new EntityError(`Failed to update ${table}/${id}`, error);
      }

      const cached = dataCache.get(table);
      if (cached) {
        const next = cached.map((row) =>
          row.id === id ? { ...row, ...sanitized, ...data } : row
        );
        await dataCache.set(table, next);
      }
      return data;
    },

    /**
     * Delete a record by ID.
     */
    async delete(id) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw new EntityError(`Failed to delete ${table}/${id}`, error);

      const cached = dataCache.get(table);
      if (cached) {
        await dataCache.set(table, cached.filter((row) => row.id !== id));
      }
    },
  };
}

/**
 * Structured error class for data layer operations.
 */
export class EntityError extends Error {
  constructor(message, supabaseError) {
    const fullMessage = supabaseError?.message 
      ? `${message}: ${supabaseError.message}` 
      : message;
    super(fullMessage);
    this.name = 'EntityError';
    this.code = supabaseError?.code;
    this.details = supabaseError?.message;
    this.hint = supabaseError?.hint;
  }
}
