import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSalesTimeseries(businessId?: string) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ['sales_timeseries', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('created_at, amount_total, status')
        .eq('business_id', businessId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}
