import * as React from 'react';
import { FLAGS } from '@/lib/flags';
import { ReviewStars } from './ReviewStars';

export function ReviewBadge({ avg, count, onClick }: { avg: number; count: number; onClick: () => void }) {
  if (!FLAGS.REVIEWS_V1) return null;
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm shadow-sm hover:bg-accent"
    >
      <ReviewStars value={avg} />
      <span className="font-medium">{avg.toFixed(1)}</span>
      <span className="text-muted-foreground">({count})</span>
    </button>
  );
}
