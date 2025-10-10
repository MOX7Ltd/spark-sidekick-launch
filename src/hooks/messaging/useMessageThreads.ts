import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMessageThreads(businessId?: string, params?: { status?: 'open'|'waiting'|'closed'; q?: string }) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ['msg_threads', businessId, params],
    queryFn: async () => {
      let q = supabase
        .from('customer_messages')
        .select('id, customer_name, customer_email, topic, status, last_message_at')
        .eq('business_id', businessId)
        .order('last_message_at', { ascending: false });

      if (params?.status) q = q.eq('status', params.status);
      if (params?.q) q = q.ilike('customer_email', `%${params.q}%`);

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 15_000,
  });
}
