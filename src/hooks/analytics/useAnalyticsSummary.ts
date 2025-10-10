import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAnalyticsSummary(businessId?: string) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ['analytics_summary', businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('analytics_summary', { bid: businessId });
      if (error) throw error;
      return data as {
        views: number;
        messages: number;
        reviews: number;
        avg_rating: number;
      };
    },
    staleTime: 60_000,
  });
}
