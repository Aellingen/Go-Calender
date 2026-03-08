import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../store/toast';
import { apiFetch } from '../lib/api';

async function fetchLogs(sourceId, sourceType) {
  const params = new URLSearchParams({ sourceId, sourceType });
  const res = await apiFetch(`/api/logs?${params}`);
  if (!res.ok) throw new Error('Failed to fetch logs');
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

export function useLogs(sourceId, sourceType) {
  return useQuery({
    queryKey: ['logs', sourceId, sourceType],
    queryFn: () => fetchLogs(sourceId, sourceType),
    enabled: !!sourceId && !!sourceType,
  });
}

export function useCreateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const res = await apiFetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to create log');
      return json.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['logs', variables.sourceId],
      });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create log');
    },
  });
}

export function useUpdateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ logId, value }) => {
      const res = await apiFetch(`/api/logs/${logId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to update log');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update log');
    },
  });
}
