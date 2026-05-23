import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SchedulesAPI } from '@/api/entities';
import { dataCache } from '@/api/cache';

const KEY = 'schedules';

export function useSchedules(options) {
  return useQuery({
    queryKey: [KEY, options],
    queryFn: () => SchedulesAPI.list(options),
    initialData: () => {
      if (!options || Object.keys(options).length === 0) {
        return dataCache.get(KEY);
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => SchedulesAPI.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => SchedulesAPI.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => SchedulesAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
