import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMessageThread(threadId?: string) {
  return useQuery({
    enabled: !!threadId,
    queryKey: ['msg_thread', threadId],
    queryFn: async () => {
      const { data: thread, error: e1 } = await supabase
        .from('customer_messages')
        .select('id, business_id, customer_name, customer_email, topic, status, created_at')
        .eq('id', threadId)
        .single();
      if (e1) throw e1;

      const { data: replies, error: e2 } = await supabase
        .from('customer_message_replies')
        .select('id, sender_type, sender_id, body, attachments, via, created_at')
        .eq('message_id', threadId)
        .order('created_at', { ascending: true });
      if (e2) throw e2;

      return { thread, replies: replies ?? [] };
    },
  });
}
