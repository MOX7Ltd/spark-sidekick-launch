import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSalesSummary(businessId?: string) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ['sales_summary', businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('sales_summary', { bid: businessId });
      if (error) throw error;
      return data as {
        orders: number;
        gross_revenue: number;
        platform_fees: number;
        net_payout: number;
      };
    },
  });
}
