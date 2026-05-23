import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotesAPI } from '@/api/entities';
import { dataCache } from '@/api/cache';

const KEY = 'notes';

function patchNotesCache(qc, updater) {
  qc.setQueriesData({ queryKey: [KEY] }, (old) => {
    if (!Array.isArray(old)) return old;
    return updater(old);
  });
}

export function useNotes(options) {
  return useQuery({
    queryKey: [KEY, options],
    queryFn: () => NotesAPI.list(options),
    initialData: () => {
      if (!options || Object.keys(options).length === 0) {
        return dataCache.get(KEY);
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => NotesAPI.create(data),
    onSuccess: (created) => {
      patchNotesCache(qc, (list) => [created, ...list]);
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => NotesAPI.update(id, data),
    onSuccess: (updated, { id, data }) => {
      patchNotesCache(qc, (list) =>
        list.map((n) => (n.id === id ? { ...n, ...data, ...updated } : n))
      );
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => NotesAPI.delete(id),
    onSuccess: (_, id) => {
      patchNotesCache(qc, (list) => list.filter((n) => n.id !== id));
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}
