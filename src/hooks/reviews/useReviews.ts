import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useReviews(businessId?: string, params?: { status?: 'published'|'pending'; page?: number }) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ['reviews', businessId, params],
    queryFn: async () => {
      let q = supabase
        .from('reviews')
        .select('id, rating, title, body, reviewer_name, customer_email, status, reply, created_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false});

      if (params?.status) q = q.eq('status', params.status);

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}
