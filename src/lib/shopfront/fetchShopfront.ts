import type {
  ShopfrontBusiness,
  ShopfrontProduct,
  ShopfrontSettings,
} from '@/types/shopfront';

// PHASE 0: Non-throwing stubs. In later phases we will wire Supabase here.
// These functions MUST NEVER throw — they should always resolve with safe defaults.

export interface ShopfrontBundle {
  business: ShopfrontBusiness | null;
  settings: ShopfrontSettings | null;
  products: ShopfrontProduct[];
}

export async function fetchShopfront(handle: string): Promise<ShopfrontBundle> {
  try {
    // placeholder: return safe empty bundle
    // eslint-disable-next-line no-console
    console.warn('[Phase0:fetchShopfront] stub called for handle:', handle);
    return {
      business: null,
      settings: null,
      products: [],
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Phase0:fetchShopfront] error (stub fallback):', err);
    return {
      business: null,
      settings: null,
      products: [],
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
