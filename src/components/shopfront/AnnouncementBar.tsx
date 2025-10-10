import * as React from 'react';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

export function AnnouncementBar({ text, className }: { text: string; className?: string }) {
  if (!text) return null;
  return (
    <div className={cn('px-4 md:px-6', className)}>
      <div className="mx-auto flex max-w-screen-xl items-center gap-2 rounded-2xl border-2 border-primary/20 bg-primary/5 p-3.5 text-sm font-medium text-foreground shadow-sm md:p-4">
        <Info className="h-5 w-5 shrink-0 text-primary" />
        <span className="leading-snug">{text}</span>
      </div>
    </div>
  );
}
