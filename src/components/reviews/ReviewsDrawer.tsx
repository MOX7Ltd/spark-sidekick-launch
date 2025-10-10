import * as React from 'react';
import { FLAGS } from '@/lib/flags';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ReviewStars } from './ReviewStars';

export function ReviewsDrawer({
  open, onOpenChange, summary,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  summary?: { avg: number; count: number };
}) {
  if (!FLAGS.REVIEWS_V1) return null;

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
            Reviews UI coming soon (Phase 3). You'll see individual reviews here.
          </div>
          <div className="mt-3 flex justify-end">
            <Button disabled>Leave a review</Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
