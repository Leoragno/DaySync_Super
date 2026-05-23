import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoriesAPI } from '@/api/entities';
import { dataCache } from '@/api/cache';

const KEY = 'categories';

export function useCategories(options) {
  return useQuery({
    queryKey: [KEY, options],
    queryFn: () => CategoriesAPI.list(options),
    initialData: () => {
      if (!options || Object.keys(options).length === 0) {
        return dataCache.get(KEY);
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => CategoriesAPI.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => CategoriesAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
