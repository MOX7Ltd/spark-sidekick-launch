import * as React from 'react';
import { FLAGS } from '@/lib/flags';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export function MessageThread({
  thread, replies, onSend, onSetStatus,
}: {
  thread?: any;
  replies: Array<any>;
  onSend: (text: string) => Promise<void>;
  onSetStatus: (status: 'open'|'waiting'|'closed') => Promise<void>;
}) {
  if (!FLAGS.MESSAGING_V1) return null;

  const [text, setText] = React.useState('');
  const [sending, setSending] = React.useState(false);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await onSend(text);
      setText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-3">
        <div className="text-sm">
          <div className="font-medium">{thread?.customer_name || thread?.customer_email}</div>
          <div className="text-muted-foreground">{thread?.topic}</div>
        </div>
        <select
          className="h-9 rounded-md border bg-background px-2 text-sm"
          value={thread?.status ?? 'open'}
          onChange={(e) => onSetStatus(e.target.value as any)}
        >
          <option value="open">Open</option>
          <option value="waiting">Waiting</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {replies.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No messages yet
          </div>
        ) : (
          replies.map((m) => (
            <div key={m.id} className={cn('flex', m.sender_type === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'inline-block max-w-[85%] rounded-2xl px-4 py-2 text-sm',
                m.sender_type === 'user'
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              )}>
                <div className="whitespace-pre-wrap">{m.body}</div>
                <div className="mt-1 text-[10px] opacity-70">{new Date(m.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t p-3">
        <Textarea 
          rows={3} 
          placeholder="Type your reply…" 
          value={text} 
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <div className="mt-2 flex justify-end">
          <Button disabled={!text.trim() || sending} onClick={handleSend}>
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
