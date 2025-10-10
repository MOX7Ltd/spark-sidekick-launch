export type PriceModel = 'one-off' | 'subscription' | 'tiered';
export type ProductStatus = 'draft' | 'published';
export type DeliveryMode = 'digital' | 'service' | 'physical';

export interface PriceTier {
  name: string;
  price: number;
  description?: string;
}

export interface ProductFulfillment {
  price_model?: PriceModel;
  price_high?: number;
  monthly_price?: number;
  tiers?: PriceTier[];
  delivery_mode?: DeliveryMode;
  files?: Array<{ url: string; name: string; size: number }>;
  booking?: {
    external_link?: string;
    duration_mins?: number;
    capacity?: number;
    buffer_mins?: number;
    location?: string;
    availability_note?: string;
  };
  links?: Array<{ label: string; url: string }>;
  collections?: string[];
  upsells?: string[];
  shipping_note?: string;
  post_purchase_note?: string;
  featured?: boolean;
}

export function formatPrice(price: number, high?: number): string {
  if (high && high !== price) {
    return `£${price}–£${high}`;
  }
  return `£${price}`;
}

export function calculateRevenue(price: number, units: number): number {
  return price * units;
}

export function getStatusColor(status: ProductStatus): string {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'draft':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  }
}

export function getStatusLabel(status: ProductStatus): string {
  switch (status) {
    case 'published':
      return 'Published';
    case 'draft':
      return 'Draft';
  }
}

// Import catalog for normalization
import { normalizeFamily, FAMILY_META, type Family } from './productCatalog';

/**
 * Normalize product row data from any source (onboarding, Lab, LLM)
 * Returns null if title is missing, otherwise returns normalized product data
 */
export function normalizeProductRow(p: any) {
  const title = (p?.title || p?.name || '').trim();
  if (!title) return null;

  const family = normalizeFamily(p?.family ?? p?.category ?? p?.type);
  const format = p?.format ?? (family ? FAMILY_META[family].defaultFormat : null);

  return {
    title,
    description: p?.description ?? p?.summary ?? p?.notes ?? '',
    type: family,           // maps to products.type (canonical)
    format,
    price_low: p?.priceLow ?? p?.price_rec_low ?? null,
    price_high: p?.priceHigh ?? p?.price_rec_high ?? null,
    price_model: p?.priceModel ?? p?.price_model ?? 'one-off',
    meta: {
      ...(p?.meta ?? {}),
      raw_onboarding_type: p?.family ?? p?.category ?? p?.type ?? null
    }
  };
}
