import * as React from 'react';
import { FLAGS } from '@/lib/flags';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ReviewStars } from './ReviewStars';
import { ReviewForm } from './ReviewForm';

export function ReviewsDrawer({
  open, onOpenChange, summary, businessId, businessName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  summary?: { avg: number; count: number };
  businessId: string;
  businessName: string;
}) {
  if (!FLAGS.REVIEWS_V1) return null;

  const [formOpen, setFormOpen] = React.useState(false);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            Reviews {summary ? (<><ReviewStars value={summary.avg} /><span className="text-sm text-muted-foreground">({summary.count})</span></>) : null}
          </DrawerTitle>
        </DrawerHeader>

        <div className="max-h-[70vh] overflow-y-auto px-4 pb-4">
          <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            {summary && summary.count > 0 
              ? `${summary.count} review${summary.count !== 1 ? 's' : ''} (individual reviews coming soon)`
              : 'No reviews yet. Be the first to leave one!'}
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={() => setFormOpen(true)}>Leave a review</Button>
          </div>
        </div>
      </DrawerContent>

      <ReviewForm
        open={formOpen}
        onOpenChange={setFormOpen}
        businessId={businessId}
        businessName={businessName}
      />
    </Drawer>
  );
}
