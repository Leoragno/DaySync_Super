import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EventsAPI } from '@/api/entities';
import { dataCache } from '@/api/cache';

const KEY = 'events';

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  end_time?: string;
  type: string;
  category?: string;
  color?: string;
  reminder_minutes?: number;
  completed?: boolean;
  user_id: string;
  created_at?: string;
}

interface CreateEventInput {
  title: string;
  description?: string;
  date: string;
  time?: string;
  end_time?: string;
  type: string;
  category?: string;
  color?: string;
  reminder_minutes?: number;
}

interface UpdateEventInput {
  id: string;
  data: Partial<Omit<Event, 'id' | 'user_id' | 'created_at'>>;
}

function patchEventsCache(qc: ReturnType<typeof useQueryClient>, updater: (old: Event[]) => Event[]) {
  qc.setQueriesData({ queryKey: [KEY] }, (old) => {
    if (!Array.isArray(old)) return old;
    return updater(old);
  });
}

export function useEvents(options?: Record<string, unknown>) {
  return useQuery<Event[]>({
    queryKey: [KEY, options],
    queryFn: () => EventsAPI.list(options),
    initialData: () => {
      if (!options || Object.keys(options).length === 0) {
        return dataCache.get(KEY);
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation<Event, Error, CreateEventInput>({
    mutationFn: (data) => EventsAPI.create(data),
    onSuccess: (created) => {
      patchEventsCache(qc, (list) => [created, ...list]);
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation<Event, Error, UpdateEventInput>({
    mutationFn: ({ id, data }) => EventsAPI.update(id, data),
    onSuccess: (updated, { id, data }) => {
      patchEventsCache(qc, (list) =>
        list.map((e) => (e.id === id ? { ...e, ...data, ...updated } : e))
      );
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => EventsAPI.delete(id),
    onSuccess: (_, id) => {
      patchEventsCache(qc, (list) => list.filter((e) => e.id !== id));
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}
