import type {
  ShopfrontBusiness,
  ShopfrontProduct,
  ShopfrontSettings,
  ProductType,
} from '@/types/shopfront';
import { supabaseShopfront } from '@/lib/supabaseClientShopfront';

// PHASE 0: Non-throwing stubs. In later phases we will wire Supabase here.
// These functions MUST NEVER throw — they should always resolve with safe defaults.

export interface ShopfrontBundle {
  business: ShopfrontBusiness | null;
  settings: ShopfrontSettings | null;
  products: ShopfrontProduct[];
  reviews?: Array<any>;
}

export async function fetchShopfront(handle: string): Promise<ShopfrontBundle> {
  try {
    // 1) fetch business - validate payment and onboarding status
    const { data: business, error: bizErr } = await supabaseShopfront
      .from('businesses')
      .select('id, business_name, logo_url, tagline, bio, experience, audience, starter_paid, stripe_onboarded, handle')
      .eq('handle', handle)
      .maybeSingle();

    if (bizErr || !business) {
      console.error('fetchShopfront business error:', bizErr);
      return { business: null, settings: null, products: [], reviews: [] };
    }

    // Only allow access to paid and onboarded shopfronts
    if (!business.starter_paid || !business.stripe_onboarded) {
      console.warn('Shopfront not available - payment or onboarding incomplete');
      return { business: null, settings: null, products: [], reviews: [] };
    }

    // 2) fetch settings
    const { data: settings } = await supabaseShopfront
      .from('shopfront_settings')
      .select('*')
      .eq('business_id', business.id)
      .maybeSingle();

    // 3) fetch published products
    const { data: products } = await supabaseShopfront
      .from('products')
      .select('id, title, description, price, asset_url, type')
      .eq('business_id', business.id)
      .eq('visible', true)
      .order('created_at', { ascending: false });

    // 4) fetch published reviews
    const { data: reviews } = await supabaseShopfront
      .from('reviews')
      .select('id, rating, title, body, reviewer_name, reply, created_at')
      .eq('business_id', business.id)
      .eq('status', 'published')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(20);

    return {
      business: {
        id: business.id,
        handle: handle,
        name: business.business_name,
        logoUrl: business.logo_url,
        avatarUrl: business.logo_url,
        tagline: business.tagline,
        aboutShort: business.bio || business.experience || business.audience || null,
        contactEmail: null,
        starterPaid: business.starter_paid,
        stripeOnboarded: business.stripe_onboarded,
      } as ShopfrontBusiness,
      settings: settings as ShopfrontSettings ?? { layout: { columns: 3 } } as ShopfrontSettings,
      products: (products ?? []).map((p) => ({
        id: p.id,
        businessId: business.id,
        name: p.title,
        description: p.description,
        priceCents: Math.round((p.price || 0) * 100),
        currency: 'USD',
        imageUrl: p.asset_url,
        type: p.type as ProductType,
      })) as ShopfrontProduct[],
      reviews: reviews ?? [],
    };
  } catch (err) {
    console.error('[fetchShopfront] error:', err);
    return {
      business: null,
      settings: null,
      products: [],
      reviews: [],
    };
  }
}

export async function searchProducts(
  businessId: string,
  params: { q?: string; cat?: string; tags?: string[]; sort?: string; page?: number } = {}
): Promise<{ items: ShopfrontProduct[]; pagination: { page: number; pageSize: number; total: number } }> {
  try {
    // eslint-disable-next-line no-console
    console.warn('[Phase0:searchProducts] stub called for business:', businessId, params);
    return { items: [], pagination: { page: 1, pageSize: 24, total: 0 } };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Phase0:searchProducts] error (stub fallback):', err);
    return { items: [], pagination: { page: 1, pageSize: 24, total: 0 } };
  }
}
