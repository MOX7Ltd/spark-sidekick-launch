import type { ShopfrontBusiness, ShopfrontSettings, ShopfrontProduct } from '@/types/shopfront';

type AnyRecord = Record<string, any>;

/**
 * Adapts whatever the onboarding step currently has into ShopfrontView props.
 * Extremely defensive: every field is optional; safe defaults are used.
 */
export function adaptOnboardingToShopfront(state: AnyRecord | undefined): {
  business: ShopfrontBusiness;
  settings: ShopfrontSettings;
  products: ShopfrontProduct[];
} {
  const s = state ?? {};

  const business: ShopfrontBusiness = {
    id: (s.businessId ?? s.business?.id ?? 'preview-business') as string,
    handle: (s.handle ?? s.business?.handle ?? 'preview') as string,
    name: (s.businessName ?? s.businessIdentity?.name ?? s.business?.name ?? 'Your Business') as string,
    logoUrl: (s.logoUrl ?? s.businessIdentity?.logoSVG ?? s.business?.logoUrl ?? null) as string | null,
    avatarUrl: (s.ownerAvatarUrl ?? s.aboutYou?.profilePicture ?? s.user?.avatarUrl ?? null) as string | null,
    tagline: (s.tagline ?? s.businessIdentity?.tagline ?? s.business?.tagline ?? 'We do awesome things.') as string | null,
    aboutShort: (s.aboutShort ?? s.businessIdentity?.bio ?? s.business?.aboutShort ?? null) as string | null,
    contactEmail: (s.contactEmail ?? s.business?.contactEmail ?? null) as string | null,
  };

  const settings: ShopfrontSettings = {
    layout: {
      columns: clampNumber(s.layout?.columns ?? s.shopfront?.layout?.columns ?? 2, 1, 4),
    },
    theme: {
      primary: s.theme?.primary ?? s.shopfront?.theme?.primary ?? undefined,
      accent: s.theme?.accent ?? s.shopfront?.theme?.accent ?? undefined,
      radius: (s.theme?.radius ?? s.shopfront?.theme?.radius ?? 'md') as any,
      density: (s.theme?.density ?? s.shopfront?.theme?.density ?? 'cozy') as any,
    },
    showAnnouncement: !!(s.shopfront?.show_announcement ?? s.showAnnouncement ?? false),
    announcementText: (s.shopfront?.announcement_text ?? s.announcementText ?? null) as string | null,
  };

  // Try multiple likely arrays for product candidates
  const rawProducts: any[] =
    (Array.isArray(s.previewProducts) && s.previewProducts) ||
    (Array.isArray(s.selectedProducts) && s.selectedProducts) ||
    (Array.isArray(s.products) && s.products) ||
    [];

  const products: ShopfrontProduct[] = rawProducts.slice(0, 8).map((p: any, i: number) => ({
    id: (p.id ?? `p${i + 1}`) as string,
    businessId: business.id,
    name: (p.name ?? p.title ?? 'Sample Product') as string,
    description: (p.description ?? p.subtitle ?? null) as string | null,
    priceCents: toPriceCents(p.priceCents ?? p.price ?? 1999),
    currency: (p.currency ?? 'NZD') as string,
    imageUrl: (p.imageUrl ?? p.image ?? null) as string | null,
    tags: Array.isArray(p.tags) ? p.tags : undefined,
    category: (p.category ?? null) as string | null,
    type: (p.type ?? 'digital') as any,
  }));

  return { business, settings, products };
}

function clampNumber(n: unknown, min: number, max: number) {
  const v = typeof n === 'number' ? n : Number(n);
  if (Number.isNaN(v)) return min;
  return Math.max(min, Math.min(max, v));
}

function toPriceCents(v: unknown) {
  if (typeof v === 'number') return Math.round(v);
  const num = Number(v);
  if (!Number.isFinite(num)) return 1999;
  // If it looks like dollars (e.g. 19.99), convert to cents
  return num < 1000 ? Math.round(num * 100) : Math.round(num);
}
