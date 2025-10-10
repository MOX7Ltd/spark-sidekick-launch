import * as React from 'react';
import { ShopfrontHeader } from './ShopfrontHeader';
import { ShopfrontBios } from './ShopfrontBios';
import { ShopfrontDiscovery, type DiscoveryState } from './ShopfrontDiscovery';
import { ShopfrontGrid } from './ShopfrontGrid';
import { CartDrawer, type CartLine } from './CartDrawer';
import { FooterTrust } from './FooterTrust';

export interface ShopfrontViewProps {
  business: {
    id: string;
    name: string;
    logoUrl?: string | null;
    avatarUrl?: string | null;
    tagline?: string | null;
    aboutShort?: string | null;
    contactEmail?: string | null;
  };
  settings?: {
    layout?: { columns?: number };
  };
  products: Array<{
    id: string;
    name: string;
    description?: string | null;
    priceCents: number;
    currency?: string;
    imageUrl?: string | null;
  }>;
  onQueryChange?: (next: DiscoveryState) => void;
  disableCart?: boolean; // NEW — hide cart drawer and make Add to cart a no-op
  linesOverride?: Array<{ id: string; name: string; qty: number; priceCents: number }>; // optional
  onAddToCartOverride?: (p: { id: string; name: string; priceCents: number }) => void; // optional
}

export function ShopfrontView({
  business,
  settings,
  products,
  onQueryChange,
  disableCart = false,
  linesOverride,
  onAddToCartOverride,
}: ShopfrontViewProps) {
  const [query, setQuery] = React.useState<DiscoveryState>({ sort: 'relevance' });
  const [open, setOpen] = React.useState(false); // mobile cart sheet

  const [lines, setLines] = React.useState<CartLine[]>([]);
  const addToCart = React.useCallback((p: { id: string; name: string; priceCents: number }) => {
    if (disableCart) return;
    if (onAddToCartOverride) { 
      onAddToCartOverride(p); 
      return; 
    }
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { id: p.id, name: p.name, qty: 1, priceCents: p.priceCents }];
    });
    setOpen(true);
  }, [disableCart, onAddToCartOverride]);

  return (
    <div className="relative">
      <ShopfrontHeader
        logoUrl={business.logoUrl}
        businessName={business.name}
        avatarUrl={business.avatarUrl}
      />

      <div className="mx-auto grid max-w-screen-xl grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          <ShopfrontBios
            businessTagline={business.tagline}
            businessAboutShort={business.aboutShort}
          />
          <ShopfrontDiscovery
            value={query}
            onChange={(next) => {
              setQuery(next);
              onQueryChange?.(next);
            }}
          />
          <ShopfrontGrid
            products={products.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              priceCents: p.priceCents,
              imageUrl: p.imageUrl,
              currency: p.currency,
            }))}
            columnsHint={settings?.layout?.columns ?? 3}
            onAddToCart={(p) =>
              addToCart({ id: p.id, name: p.name, priceCents: p.priceCents })
            }
            className="mt-3"
          />
        </div>

        {!disableCart && (
          <CartDrawer lines={linesOverride ?? lines} open={open} onOpenChange={setOpen} />
        )}
      </div>

      <FooterTrust contactEmail={business.contactEmail} />
    </div>
  );
}
