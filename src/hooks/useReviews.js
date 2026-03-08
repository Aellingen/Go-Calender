import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../store/toast';
import { apiFetch } from '../lib/api';

export function usePendingReviews() {
  return useQuery({
    queryKey: ['reviews', 'pending'],
    queryFn: async () => {
      const res = await apiFetch('/api/reviews?pending=true');
      if (!res.ok) throw new Error('Failed to fetch pending reviews');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    staleTime: 30_000,
  });
}

export function useReviewHistory(type) {
  return useQuery({
    queryKey: ['reviews', 'history', type ?? 'all'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      const res = await apiFetch(`/api/reviews?${params}`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    staleTime: 30_000,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reviewData) => {
      const res = await apiFetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to save review');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save review');
    },
  });
}
