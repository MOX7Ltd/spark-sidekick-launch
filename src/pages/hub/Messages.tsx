import { useState, useEffect } from 'react';
import { MessageSquare, ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { SectionHeader } from '@/components/hub/SectionHeader';
import { EmptyState } from '@/components/hub/EmptyState';
import { SkeletonCard } from '@/components/hub/SkeletonCard';
import { MicroGuidance } from '@/components/hub/MicroGuidance';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getThreads, getMessagesByThread, sendReply, type MessageThread, type Message } from '@/lib/db/messages';
import { format } from 'date-fns';

export default function Messages() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id);
    }
  }, [selectedThread]);

  const loadThreads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const data = await getThreads(user.id);
      setThreads(data);
    } catch (error) {
      console.error('Error loading threads:', error);
      toast({
        title: "Failed to load messages",
        description: "Could not load your message threads.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (threadId: string) => {
    try {
      const data = await getMessagesByThread(threadId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThread) return;

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newMessage = await sendReply(user.id, selectedThread.id, replyText);
      setMessages(prev => [...prev, newMessage]);
      setReplyText('');
      
      // Update thread in list
      await loadThreads();

      toast({
        title: "Reply sent",
        description: "Your message has been sent.",
      });
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Send failed",
        description: "Could not send your reply.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const filteredThreads = threads.filter(t =>
    t.from_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.from_email?.toLowerCase().includes(search.toLowerCase()) ||
    t.subject?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <SectionHeader
          title="Messages"
          subtitle="Respond to customer inquiries and build relationships."
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Messages"
        subtitle="Respond to customer inquiries and build relationships."
      />

      <MicroGuidance text="Great customer service starts with quick replies — stay connected! 💬" />

      {threads.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          description="Your first customer message will appear here. Check back soon! 📬"
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Inbox - hide on mobile when thread selected */}
          <div className={`lg:col-span-1 ${selectedThread ? 'hidden lg:block' : ''}`}>
            <Card className="rounded-2xl">
              <CardContent className="p-4 space-y-3">
                <Input
                  placeholder="Search name, email, subject..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredThreads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThread(thread)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedThread?.id === thread.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="font-medium text-sm truncate">
                        {thread.from_name || thread.from_email || 'Anonymous'}
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-1">
                        {thread.subject || thread.last_message_snippet}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(thread.last_message_at), 'MMM d, h:mm a')}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Thread view */}
          <div className={`lg:col-span-2 ${!selectedThread ? 'hidden lg:block' : ''}`}>
            {selectedThread ? (
              <Card className="h-[700px] flex flex-col rounded-2xl shadow-md">
                <div className="p-4 border-b flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedThread(null)}
                    className="lg:hidden"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {selectedThread.from_name || selectedThread.from_email || 'Anonymous'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedThread.subject || 'Customer message'}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.is_from_customer ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.is_from_customer
                            ? 'bg-muted'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                        <p className="text-xs opacity-70 mt-2">
                          {format(new Date(message.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t space-y-3">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="resize-none"
                    rows={3}
                  />
                  <Button
                    variant="hero"
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || isSending}
                    className="w-full sm:w-auto gap-2"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Reply
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="Select a conversation"
                description="Choose a thread from the inbox to view messages."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
