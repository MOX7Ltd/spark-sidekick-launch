import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAnalyticsTimeseries(businessId?: string) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ['analytics_timeseries', businessId],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('analytics_events')
        .select('type, created_at')
        .eq('business_id', businessId)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Array<{ type: string; created_at: string }>;
    },
    staleTime: 60_000,
  });
}
