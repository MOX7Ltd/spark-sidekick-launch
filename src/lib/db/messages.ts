import { supabase } from '@/integrations/supabase/client';

export interface MessageThread {
  id: string;
  user_id: string;
  subject?: string;
  last_message_at: string;
  created_at: string;
  from_name?: string;
  from_email?: string;
  last_message_snippet?: string;
}

export interface Message {
  id: string;
  user_id: string;
  thread_id: string;
  from_name?: string;
  from_email?: string;
  product_id?: string;
  body: string;
  is_from_customer: boolean;
  created_at: string;
}

export async function getThreads(userId: string): Promise<MessageThread[]> {
  const { data: threads, error } = await supabase
    .from('message_threads')
    .select('*')
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false });

  if (error) throw error;

  // Get last message for each thread
  const threadsWithMessages = await Promise.all(
    (threads || []).map(async (thread) => {
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        ...thread,
        from_name: lastMessage?.from_name,
        from_email: lastMessage?.from_email,
        last_message_snippet: lastMessage?.body.substring(0, 100)
      };
    })
  );

  return threadsWithMessages;
}

export async function getMessagesByThread(threadId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function sendReply(
  userId: string,
  threadId: string,
  body: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      user_id: userId,
      thread_id: threadId,
      body,
      is_from_customer: false
    })
    .select()
    .single();

  if (error) throw error;

  // Update thread last_message_at
  await supabase
    .from('message_threads')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', threadId);

  return data;
}
