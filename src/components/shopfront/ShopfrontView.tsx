import * as React from 'react';
import { FLAGS } from '@/lib/flags';
import { ShopfrontHeader } from './ShopfrontHeader';
import { ShopfrontBios } from './ShopfrontBios';
import { ShopfrontDiscovery, type DiscoveryState } from './ShopfrontDiscovery';
import { ShopfrontGrid } from './ShopfrontGrid';
import { CartDrawer, type CartLine } from './CartDrawer';
import { FooterTrust } from './FooterTrust';
import { AnnouncementBar } from './AnnouncementBar';
import { SocialProof } from './SocialProof';
import { MessageModal } from '@/components/messaging/MessageModal';
import { MessageCTA } from '@/components/messaging/MessageCTA';
import { ReviewBadge } from '@/components/reviews/ReviewBadge';
import { ReviewsDrawer } from '@/components/reviews/ReviewsDrawer';

export interface ShopfrontReviewsSummary {
  avg: number;   // e.g., 4.8
  count: number; // e.g., 23
}

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
    theme?: { primary?: string; accent?: string; radius?: string; density?: string };
    showAnnouncement?: boolean;
    announcementText?: string | null;
  };
  products: Array<{
    id: string;
    name: string;
    description?: string | null;
    priceCents: number;
    currency?: string;
    imageUrl?: string | null;
    tag?: string | null;
  }>;
  onQueryChange?: (next: DiscoveryState) => void;
  reviews?: ShopfrontReviewsSummary;

  // Optional: override cart for onboarding/preview
  disableCart?: boolean;
  linesOverride?: Array<{ id: string; name: string; qty: number; priceCents: number }>;
  onAddToCartOverride?: (p: { id: string; name: string; priceCents: number }) => void;
}

export function ShopfrontView({
  business,
  settings,
  products,
  onQueryChange,
  reviews,
  disableCart,
  linesOverride,
  onAddToCartOverride,
}: ShopfrontViewProps) {
  const [query, setQuery] = React.useState<DiscoveryState>({ sort: 'relevance' });
  const [open, setOpen] = React.useState(false); // mobile cart sheet
  const [msgOpen, setMsgOpen] = React.useState(false);
  const [reviewsOpen, setReviewsOpen] = React.useState(false);
  const [selectedProductName, setSelectedProductName] = React.useState<string | null>(null);

  const [lines, setLines] = React.useState<CartLine[]>([]);

  // Apply theme tokens when settings change
  React.useEffect(() => {
    if (typeof document === 'undefined' || !settings?.theme) return;
    const r = document.documentElement;
    if (settings.theme.primary) r.style.setProperty('--sh-primary', settings.theme.primary);
    if (settings.theme.accent) r.style.setProperty('--sh-accent', settings.theme.accent);
  }, [settings?.theme]);
  const addToCart = React.useCallback((p: { id: string; name: string; priceCents: number }) => {
    if (disableCart) return;
    if (onAddToCartOverride) { onAddToCartOverride(p); return; }
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

  const effectiveLines = linesOverride ?? lines;

  return (
    <div className="relative">
      <ShopfrontHeader
        logoUrl={business.logoUrl ?? undefined}
        businessName={business.name}
        avatarUrl={business.avatarUrl ?? undefined}
        coverImageUrl={undefined}
        rating={undefined}
      />

      <div className="mx-auto mt-3 flex max-w-screen-xl items-center justify-between px-4 md:px-6">
        <div>
          {FLAGS.REVIEWS_V1 && reviews && (
            <ReviewBadge avg={reviews.avg} count={reviews.count} onClick={() => setReviewsOpen(true)} />
          )}
        </div>
        <div>
          {FLAGS.MESSAGING_V1 && (
            <MessageCTA onClick={() => { setSelectedProductName(null); setMsgOpen(true); }} />
          )}
        </div>
      </div>

      {settings?.showAnnouncement && settings.announcementText && (
        <AnnouncementBar text={settings.announcementText} className="mt-4" />
      )}

      <SocialProof
        rating={undefined}
        customerCount={undefined}
        showGuarantee={true}
        className="mt-4"
      />

      <div className="mx-auto mt-6 grid max-w-screen-xl grid-cols-1 gap-6 px-4 md:px-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-5">
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
            products={products}
            columnsHint={settings?.layout?.columns ?? 3}
            onAddToCart={(p) =>
              addToCart({ id: p.id, name: p.name, priceCents: p.priceCents })
            }
            onMessage={(productName) => {
              setSelectedProductName(productName ?? null);
              setMsgOpen(true);
            }}
          />
        </div>

        {!disableCart && <CartDrawer lines={effectiveLines} open={open} onOpenChange={setOpen} />}
      </div>

      <FooterTrust contactEmail={business.contactEmail} />

      {FLAGS.MESSAGING_V1 && (
        <MessageModal
          open={msgOpen}
          onOpenChange={setMsgOpen}
          businessName={business.name}
          businessId={business.id}
          productId={null}
          productName={selectedProductName}
        />
      )}

      {FLAGS.REVIEWS_V1 && (
        <ReviewsDrawer
          open={reviewsOpen}
          onOpenChange={setReviewsOpen}
          summary={reviews}
          businessId={business.id}
          businessName={business.name}
        />
      )}
    </div>
  );
}
