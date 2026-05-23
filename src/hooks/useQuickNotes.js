import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QuickNotesAPI } from '@/api/entities';
import { dataCache } from '@/api/cache';

const KEY = 'quick_notes';
const TABLE = 'quick_notes';

function patchQuickNotesCache(qc, updater) {
  qc.setQueriesData({ queryKey: [KEY] }, (old) => {
    if (!Array.isArray(old)) return old;
    return updater(old);
  });
}

export function useQuickNotes(options) {
  return useQuery({
    queryKey: [KEY, options],
    queryFn: () => QuickNotesAPI.list(options),
    initialData: () => {
      if (!options || Object.keys(options).length === 0) {
        return dataCache.get(TABLE);
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateQuickNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => QuickNotesAPI.create(data),
    onSuccess: (created) => {
      patchQuickNotesCache(qc, (list) => [created, ...list]);
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useUpdateQuickNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => QuickNotesAPI.update(id, data),
    onSuccess: (updated, { id, data }) => {
      patchQuickNotesCache(qc, (list) =>
        list.map((n) => (n.id === id ? { ...n, ...data, ...updated } : n))
      );
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useDeleteQuickNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => QuickNotesAPI.delete(id),
    onSuccess: (_, id) => {
      patchQuickNotesCache(qc, (list) => list.filter((n) => n.id !== id));
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}
