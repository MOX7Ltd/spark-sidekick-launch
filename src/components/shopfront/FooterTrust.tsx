import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FooterTrustProps {
  contactEmail?: string | null;
  showPoweredBy?: boolean;
  className?: string;
}

export function FooterTrust({ contactEmail, showPoweredBy = true, className }: FooterTrustProps) {
  return (
    <footer className={cn('px-4 pb-24 pt-8 md:px-6 md:pb-12', className)}>
      <div className="mx-auto max-w-screen-xl space-y-4">
        {/* Payment badges row */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border bg-card/80 px-3 py-2 shadow-sm">
            <span className="inline-block h-5 w-8 rounded bg-muted" aria-label="Visa" />
            <span className="inline-block h-5 w-8 rounded bg-muted" aria-label="Mastercard" />
            <span className="inline-block h-5 w-8 rounded bg-muted" aria-label="Amex" />
          </div>
        </div>

        {/* Trust strip */}
        <div className="rounded-2xl border bg-card/80 p-4 text-xs text-muted-foreground shadow-sm md:p-5 md:text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span>Secure checkout</span>
              <span>•</span>
              <span>Refund policy</span>
              <span>•</span>
              <span>Support</span>
            </div>
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="font-medium underline hover:text-foreground">
                Contact us
              </a>
            )}
          </div>
          {showPoweredBy && (
            <div className="mt-3 border-t pt-3 text-[11px] text-center space-y-1">
              <div>
                Payments securely processed by <span className="font-semibold">Stripe</span>
              </div>
              <div className="text-muted-foreground/80">
                15% platform fee • Powered by <span className="font-semibold text-foreground">SideHive</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
