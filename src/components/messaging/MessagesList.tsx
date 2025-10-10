import * as React from 'react';
import { FLAGS } from '@/lib/flags';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function MessagesList({
  threads, activeId, onSelect,
  onFilterStatus, status,
}: {
  threads: Array<any>;
  activeId?: string;
  onSelect: (id: string) => void;
  onFilterStatus: (s?: 'open'|'waiting'|'closed') => void;
  status?: 'open'|'waiting'|'closed';
}) {
  if (!FLAGS.MESSAGING_V1) return null;

  const [q, setQ] = React.useState('');
  
  const filteredThreads = threads.filter((t) => {
    if (q && !(t.customer_email?.toLowerCase().includes(q.toLowerCase()) || t.customer_name?.toLowerCase().includes(q.toLowerCase()))) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Input placeholder="Search email or name…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select
          className="h-10 rounded-md border bg-background px-2 text-sm"
          value={status ?? ''}
          onChange={(e) => onFilterStatus((e.target.value || undefined) as any)}
        >
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="waiting">Waiting</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredThreads.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No messages {q ? 'matching your search' : 'yet'}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredThreads.map((t) => (
              <Card
                key={t.id}
                className={cn('cursor-pointer p-3 transition-colors hover:bg-accent', activeId === t.id && 'ring-2 ring-primary')}
                onClick={() => onSelect(t.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{t.customer_name || t.customer_email}</div>
                  <div className="text-xs text-muted-foreground">{new Date(t.last_message_at).toLocaleString()}</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Topic: {t.topic} • {t.status}</div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
