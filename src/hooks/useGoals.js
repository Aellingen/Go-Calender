import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../store/toast';
import { apiFetch } from '../lib/api';

async function fetchGoals(status = 'active') {
  const params = new URLSearchParams({ status });
  const res = await apiFetch(`/api/goals?${params}`);
  if (!res.ok) throw new Error('Failed to fetch goals');
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

export function useGoals(status = 'active') {
  return useQuery({
    queryKey: ['goals', status],
    queryFn: () => fetchGoals(status),
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ goalId, ...data }) => {
      const res = await apiFetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to update goal');
      return json.data;
    },
    onMutate: async (variables) => {
      if (variables.status === 'abandoned') {
        await queryClient.cancelQueries({ queryKey: ['goals'] });
        const previous = queryClient.getQueryData(['goals', 'active']);
        queryClient.setQueryData(['goals', 'active'], (old) =>
          (old ?? []).filter((g) => g.id !== variables.goalId)
        );
        return { previous };
      }
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['goals', 'active'], context.previous);
      }
      toast.error(err.message || 'Failed to update goal');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goalId) => {
      const res = await apiFetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to delete goal');
      return json.data;
    },
    onMutate: async (goalId) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      const previous = queryClient.getQueryData(['goals', 'active']);
      queryClient.setQueryData(['goals', 'active'], (old) =>
        (old ?? []).filter((g) => g.id !== goalId)
      );
      return { previous };
    },
    onError: (err, _goalId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['goals', 'active'], context.previous);
      }
      toast.error(err.message || 'Failed to delete goal');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await apiFetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to create goal');
      return json.data;
    },
    onMutate: async (newGoal) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      const previous = queryClient.getQueryData(['goals', 'active']);
      const optimisticGoal = {
        id: `optimistic-${Date.now()}`,
        name: newGoal.name,
        description: newGoal.description ?? '',
        dueDate: newGoal.dueDate ?? null,
        mode: newGoal.mode ?? 'simple',
        target: newGoal.target ?? null,
        unit: newGoal.unit ?? null,
        color: newGoal.color ?? '',
        current: 0,
        currentValue: 0,
        status: 'active',
        actions: [],
        _optimistic: true,
      };
      queryClient.setQueryData(['goals', 'active'], (old) => [...(old ?? []), optimisticGoal]);
      return { previous };
    },
    onError: (err, _newGoal, context) => {
      queryClient.setQueryData(['goals', 'active'], context.previous);
      toast.error('Failed to create goal');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useReorderGoals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds) => {
      const res = await apiFetch('/api/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to reorder goals');
      return json.data;
    },
    onMutate: (orderedIds) => {
      queryClient.cancelQueries({ queryKey: ['goals'] });
      const previous = queryClient.getQueryData(['goals', 'active']);
      queryClient.setQueryData(['goals', 'active'], (old) => {
        if (!old) return old;
        const map = Object.fromEntries(old.map((g) => [g.id, g]));
        return orderedIds.map((id) => map[id]).filter(Boolean);
      });
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['goals', 'active'], context.previous);
      }
      toast.error('Failed to reorder goals');
    },
  });
}
