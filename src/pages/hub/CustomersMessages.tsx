import * as React from 'react';
import { FLAGS } from '@/lib/flags';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { useMessageThreads } from '@/hooks/messaging/useMessageThreads';
import { useMessageThread } from '@/hooks/messaging/useMessageThread';
import { MessagesList } from '@/components/messaging/MessagesList';
import { MessageThread } from '@/components/messaging/MessageThread';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function CustomersMessages() {
  if (!FLAGS.MESSAGING_V1) {
    return (
      <AppSurface>
        <BackBar to="/hub/customers" label="Back to Customers" />
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Messages</h1>
          <p className="text-muted-foreground">Messaging is currently disabled.</p>
        </div>
      </AppSurface>
    );
  }

  const { toast } = useToast();
  const [businessId, setBusinessId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<'open'|'waiting'|'closed'|undefined>(undefined);
  const [activeId, setActiveId] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to view messages.",
          variant: "destructive",
        });
        return;
      }
      const { data } = await supabase.from('businesses').select('id').eq('owner_id', user.id).maybeSingle();
      setBusinessId(data?.id ?? null);
    })();
  }, [toast]);

  const { data: threads = [], refetch: refetchThreads } = useMessageThreads(businessId ?? undefined, { status });
  const { data: threadData, refetch: refetchThread } = useMessageThread(activeId);

  async function sendReply(text: string) {
    if (!activeId) return;
    try {
      const { error } = await supabase.functions.invoke('reply-message', {
        body: { messageId: activeId, body: text },
      });

      if (error) throw error;

      await Promise.all([refetchThread(), refetchThreads()]);
      toast({ title: "Reply sent successfully" });
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast({
        title: "Failed to send reply",
        description: "Please try again later.",
        variant: "destructive",
      });
      throw error;
    }
  }

  async function setThreadStatus(s: 'open'|'waiting'|'closed') {
    if (!activeId) return;
    try {
      const { error } = await supabase
        .from('customer_messages')
        .update({ status: s })
        .eq('id', activeId);

      if (error) throw error;

      await refetchThreads();
      toast({ title: "Status updated" });
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: "Failed to update status",
        variant: "destructive",
      });
    }
  }

  return (
    <AppSurface>
      <BackBar to="/hub/customers" label="Back to Customers" />
      <div className="mt-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Customer Messages</h1>
        {!businessId ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Loading...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[22rem_1fr]">
            <div className="h-[70vh] rounded-xl border bg-card">
              <MessagesList
                threads={threads}
                activeId={activeId}
                onSelect={setActiveId}
                status={status}
                onFilterStatus={setStatus}
              />
            </div>
            <div className="h-[70vh] rounded-xl border bg-card">
              {activeId ? (
                <MessageThread
                  thread={threadData?.thread}
                  replies={threadData?.replies ?? []}
                  onSend={sendReply}
                  onSetStatus={setThreadStatus}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Select a message to view
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppSurface>
  );
}
