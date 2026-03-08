import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { toast } from '../store/toast';
import { apiFetch } from '../lib/api';

export function usePinnedActions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const pinnedIds = user?.pinnedActionIds ?? [];

  const mutation = useMutation({
    mutationFn: async (newPinnedIds) => {
      const res = await apiFetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinnedActionIds: newPinnedIds }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to update pins');
      return json.data;
    },
    onMutate: async (newPinnedIds) => {
      await queryClient.cancelQueries({ queryKey: ['auth', 'session'] });
      const previous = queryClient.getQueryData(['auth', 'session']);
      queryClient.setQueryData(['auth', 'session'], (old) => {
        if (!old?.data) return old;
        return { ...old, data: { ...old.data, pinnedActionIds: newPinnedIds } };
      });
      return { previous };
    },
    onError: (err, _vars, context) => {
      queryClient.setQueryData(['auth', 'session'], context.previous);
      toast.error(err.message || 'Failed to update pins');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
    },
  });

  const pin = (actionId) => {
    if (pinnedIds.length >= 5) {
      toast.info('Max 5 pinned actions');
      return;
    }
    if (pinnedIds.includes(actionId)) return;
    mutation.mutate([...pinnedIds, actionId]);
  };

  const unpin = (actionId) => {
    mutation.mutate(pinnedIds.filter((id) => id !== actionId));
  };

  const isPinned = (actionId) => pinnedIds.includes(actionId);

  return { pinnedIds, pin, unpin, isPinned };
}
