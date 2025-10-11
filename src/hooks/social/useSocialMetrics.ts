import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSocialMetrics(businessId?: string) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ['social_metrics', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_posts')
        .select('*')
        .eq('business_id', businessId)
        .order('posted_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
