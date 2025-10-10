export type Currency = 'NZD' | 'USD' | string;

export interface ShopfrontBusiness {
  id: string;
  handle: string;
  name: string;
  logoUrl?: string | null;
  avatarUrl?: string | null;
  tagline?: string | null;
  aboutShort?: string | null;
  contactEmail?: string | null;
}

export type Density = 'cozy' | 'comfy' | 'spacious';
export type Radius = 'sm' | 'md' | 'xl';

export interface ShopfrontTheme {
  primary?: string;  // hex
  accent?: string;   // hex
  radius?: Radius;
  density?: Density;
}

export interface ShopfrontLayout {
  columns?: number; // product grid hint (1–4)
}

export interface ShopfrontSettings {
  theme?: ShopfrontTheme;
  layout?: ShopfrontLayout;
  showAnnouncement?: boolean;
  announcementText?: string | null;
  reviews_summary?: { avg: number; count: number };
  // Future: draft/published JSON blobs (handled in later phases)
}

export type ProductType = 'physical' | 'service' | 'digital';

export interface ShopfrontProduct {
  id: string;
  businessId: string;
  name: string;
  description?: string | null;
  priceCents: number;
  currency?: Currency;
  imageUrl?: string | null;
  tags?: string[];
  category?: string | null;
  type?: ProductType;
}

export interface CartItem {
  productId: string;
  optionId?: string | null;
  qty: number;
  priceCentsSnapshot: number;
  nameSnapshot: string;
}

export interface Cart {
  id: string;
  businessId: string;
  userId?: string | null;
  anonId?: string | null;
  items: CartItem[];
  updatedAt: number; // epoch ms
}
