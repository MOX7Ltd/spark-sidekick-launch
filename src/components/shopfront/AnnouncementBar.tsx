import * as React from 'react';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

export function AnnouncementBar({ text, className }: { text: string; className?: string }) {
  if (!text) return null;
  return (
    <div className={cn('px-4 md:px-6', className)}>
      <div className="mx-auto flex max-w-screen-xl items-center gap-2 rounded-xl border bg-card/80 p-3 text-sm text-foreground shadow-sm">
        <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="leading-snug">{text}</span>
      </div>
    </div>
  );
}
