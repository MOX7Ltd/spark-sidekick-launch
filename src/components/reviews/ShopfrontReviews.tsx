import * as React from 'react';
import { FLAGS } from '@/lib/flags';
import { ReviewStars } from './ReviewStars';
import { Card } from '@/components/ui/card';

export function ShopfrontReviews({ items }: { items: Array<any> }) {
  if (!FLAGS.REVIEWS_V1) return null;
  if (!items?.length)
    return <p className="px-4 py-6 text-center text-sm text-muted-foreground">No reviews yet.</p>;

  return (
    <div className="space-y-3 px-4 py-6">
      {items.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex items-center justify-between">
            <ReviewStars value={r.rating / 10} />
            <span className="text-xs text-muted-foreground">
              {new Date(r.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium">{r.title}</p>
          <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{r.body}</p>
          {r.reply && (
            <div className="mt-3 rounded-md bg-accent p-2 text-xs text-muted-foreground">
              <strong>Owner reply:</strong> {r.reply}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
