import * as React from 'react';
import { FLAGS } from '@/lib/flags';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function ReviewsTable({
  items, onPublish, onReject, onReply,
  showModeration,
}: {
  items: Array<any>;
  onPublish?: (id: string) => Promise<void>;
  onReject?: (id: string) => Promise<void>;
  onReply: (id: string, text: string) => Promise<void>;
  showModeration?: boolean;
}) {
  if (!FLAGS.REVIEWS_V1) return null;

  const [replyText, setReplyText] = React.useState<Record<string,string>>({});
  const [submitting, setSubmitting] = React.useState<string | null>(null);

  const handleReply = async (reviewId: string) => {
    const text = replyText[reviewId]?.trim();
    if (!text || submitting) return;
    
    setSubmitting(reviewId);
    try {
      await onReply(reviewId, text);
      setReplyText({ ...replyText, [reviewId]: '' });
    } catch (error) {
      console.error('Failed to reply:', error);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-8">
          No reviews yet
        </div>
      ) : (
        items.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-yellow-500 text-lg">
                    {'★'.repeat(Math.round(r.rating / 20))}
                    {'☆'.repeat(5 - Math.round(r.rating / 20))}
                  </div>
                  <span className="text-sm font-medium">{(r.rating / 20).toFixed(1)}</span>
                </div>
                {r.title && <div className="mt-1 font-medium">{r.title}</div>}
                <div className="mt-1 text-xs text-muted-foreground">
                  {r.customer_name || 'Anonymous'} • {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
              {showModeration && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onReject?.(r.id)}>
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => onPublish?.(r.id)}>
                    Publish
                  </Button>
                </div>
              )}
            </div>
            
            {r.body && (
              <div className="mt-3 text-sm whitespace-pre-wrap">{r.body}</div>
            )}

            {r.reply && (
              <div className="mt-4 rounded-lg bg-muted p-3">
                <div className="text-xs font-medium text-muted-foreground mb-1">Your reply:</div>
                <div className="text-sm">{r.reply}</div>
              </div>
            )}

            {!r.reply && (
              <div className="mt-4">
                <Textarea
                  placeholder="Write a public reply…"
                  value={replyText[r.id] ?? ''}
                  onChange={(e) => setReplyText({ ...replyText, [r.id]: e.target.value })}
                  rows={3}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    disabled={!replyText[r.id]?.trim() || submitting === r.id}
                    onClick={() => handleReply(r.id)}
                    size="sm"
                  >
                    {submitting === r.id ? 'Posting...' : 'Post reply'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
