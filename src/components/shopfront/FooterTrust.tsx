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
      <div className="mx-auto max-w-screen-xl rounded-2xl border bg-card/80 p-4 text-xs text-muted-foreground shadow-sm md:text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>Refunds & policies • Shipping/booking details • Social links</div>
          <div className="flex items-center gap-3">
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="underline">
                Contact
              </a>
            )}
            {/* Payment badges (placeholder) */}
            <div className="hidden items-center gap-1 sm:flex">
              <span className="inline-block h-4 w-6 rounded bg-muted" />
              <span className="inline-block h-4 w-6 rounded bg-muted" />
              <span className="inline-block h-4 w-6 rounded bg-muted" />
            </div>
          </div>
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
