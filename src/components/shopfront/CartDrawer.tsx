import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface CartLine {
  id: string;
  name: string;
  qty: number;
  priceCents: number;
}

export interface CartDrawerProps {
  lines: CartLine[];
  currency?: string;
  open?: boolean;              // mobile sheet visibility (controlled)
  onOpenChange?: (o: boolean) => void;
  className?: string;
}

function formatPrice(cents: number, currency = 'NZD') {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100); }
  catch { return `$${(cents / 100).toFixed(2)}`; }
}

export function CartDrawer({ lines, currency, open = false, onOpenChange, className }: CartDrawerProps) {
  const subtotal = lines.reduce((s, l) => s + l.qty * l.priceCents, 0);
  const sheetRef = React.useRef<HTMLDivElement | null>(null);

  // Keyboard support: Escape closes the mobile sheet
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { 
      if (e.key === 'Escape' && open) onOpenChange?.(false); 
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  // Focus management: focus first interactive element when sheet opens
  React.useEffect(() => {
    if (open && sheetRef.current) {
      const firstFocusable = sheetRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus?.();
    }
  }, [open]);

  return (
    <>
      {/* Desktop sticky panel (right rail) */}
      <aside
        className={cn(
          'hidden lg:sticky lg:top-20 lg:block lg:h-fit lg:w-80 lg:shrink-0 lg:rounded-xl lg:border lg:bg-card lg:p-4',
          className,
        )}
      >
        <h3 className="mb-2 text-sm font-semibold">Your Cart</h3>
        <div className="space-y-2">
          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            lines.map((l) => (
              <div key={l.id} className="flex items-baseline justify-between text-sm">
                <span className="line-clamp-1">{l.name} × {l.qty}</span>
                <span>{formatPrice(l.qty * l.priceCents, currency)}</span>
              </div>
            ))
          )}
        </div>
        <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
          <span className="font-medium">Subtotal</span>
          <span className="font-semibold">{formatPrice(subtotal, currency)}</span>
        </div>
        <Button className="mt-3 w-full" disabled={lines.length === 0}>Checkout</Button>
      </aside>

      {/* Mobile sticky checkout bar */}
      <div
        className={cn(
          'lg:hidden',
          'fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur',
        )}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto flex max-w-screen-sm items-center justify-between px-4 py-3">
          <div className="text-sm">
            <div className="font-medium">{lines.length} item{lines.length === 1 ? '' : 's'}</div>
            <div className="text-muted-foreground">{formatPrice(subtotal, currency)}</div>
          </div>
          <Button 
            aria-expanded={open}
            aria-controls="mobile-cart-sheet"
            onClick={() => onOpenChange?.(!open)} 
            className="h-11 px-4"
          >
            {open ? 'Close' : 'View cart'}
          </Button>
        </div>
      </div>

      {/* Mobile bottom sheet body (very light implementation, no portal) */}
      <div
        id="mobile-cart-sheet"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          'lg:hidden fixed inset-x-0 z-40 rounded-t-2xl border-t bg-background p-4 shadow-2xl transition-transform',
          open ? 'bottom-[56px]' : 'bottom-[-60vh]',
        )}
        style={{ minHeight: '40vh' }}
      >
        <h3 className="mb-3 text-sm font-semibold">Your Cart</h3>
        <div className="space-y-2">
          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            lines.map((l) => (
              <div key={l.id} className="flex items-baseline justify-between text-sm">
                <span className="line-clamp-1">{l.name} × {l.qty}</span>
                <span>{formatPrice(l.qty * l.priceCents, currency)}</span>
              </div>
            ))
          )}
        </div>
        <Button className="mt-4 w-full" disabled={lines.length === 0}>Checkout</Button>
      </div>
    </>
  );
}
