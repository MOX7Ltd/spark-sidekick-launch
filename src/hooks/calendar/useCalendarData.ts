import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCalendarData(businessId?: string) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ['calendar_view', businessId],
    queryFn: async () => {
      const [a, b] = await Promise.all([
        supabase
          .from('appointments')
          .select('*')
          .eq('business_id', businessId)
          .order('start_time', { ascending: true }),
        supabase
          .from('availability')
          .select('*')
          .eq('business_id', businessId),
      ]);
      if (a.error || b.error) throw a.error || b.error;
      return { appointments: a.data ?? [], availability: b.data ?? [] };
    },
  });
}
