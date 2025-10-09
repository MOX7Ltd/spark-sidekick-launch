import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FooterTrustProps {
  contactEmail?: string | null;
  showPoweredBy?: boolean;
  className?: string;
}

export function FooterTrust({ contactEmail, showPoweredBy = true, className }: FooterTrustProps) {
  return (
    <footer className={cn('px-4 pb-24 pt-6 md:px-6 md:pb-10', className)}>
      <div className="mx-auto max-w-screen-xl rounded-xl border bg-card p-4 text-xs text-muted-foreground md:text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>Refunds & policies • Shipping/booking details • Social links</div>
          {contactEmail && <a href={`mailto:${contactEmail}`} className="underline">Contact</a>}
        </div>
        {showPoweredBy && (
          <div className="mt-2 text-[11px]">
            Powered by <span className="font-semibold">SideHive</span>
          </div>
        )}
      </div>
    </footer>
  );
}
