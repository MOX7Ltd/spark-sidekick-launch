export type PriceModel = 'one-off' | 'subscription' | 'tiered';
export type ProductStatus = 'draft' | 'live' | 'hidden';
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
    case 'live':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'draft':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'hidden':
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function getStatusLabel(status: ProductStatus): string {
  switch (status) {
    case 'live':
      return 'Live';
    case 'draft':
      return 'Draft';
    case 'hidden':
      return 'Hidden';
  }
}
