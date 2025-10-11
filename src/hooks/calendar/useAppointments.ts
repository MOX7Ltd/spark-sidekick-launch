import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAppointments(businessId?: string) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ['appointments', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('business_id', businessId)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
