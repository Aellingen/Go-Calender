import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../store/toast';
import { apiFetch } from '../lib/api';

async function fetchActions({ goalId, status } = {}) {
  const params = new URLSearchParams();
  if (goalId) params.set('goalId', goalId);
  if (status) params.set('status', status);
  const res = await apiFetch(`/api/actions?${params}`);
  if (!res.ok) throw new Error('Failed to fetch actions');
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

export function useActions(goalId, status) {
  return useQuery({
    queryKey: ['actions', goalId ?? 'all', status ?? 'all'],
    queryFn: () => fetchActions({ goalId, status }),
  });
}

export function useCreateAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await apiFetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to create action');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create action');
    },
  });
}

export function useUpdateAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ actionId, ...data }) => {
      const res = await apiFetch(`/api/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to update action');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update action');
    },
  });
}
