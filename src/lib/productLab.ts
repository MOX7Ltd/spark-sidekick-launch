// Re-export from canonical catalog
import { FAMILIES, FAMILY_META, type Family } from './productCatalog';

export interface ProductFamily {
  key: Family;
  label: string;
  priceRange: string;
  tooltip: string;
}

// Build PRODUCT_FAMILIES from canonical catalog
export const PRODUCT_FAMILIES: ProductFamily[] = FAMILIES.map(family => ({
  key: family,
  label: FAMILY_META[family].label,
  priceRange: `£${FAMILY_META[family].priceBand[0]}–£${FAMILY_META[family].priceBand[1]}`,
  tooltip: FAMILY_META[family].tooltip
}));

// Build PRICE_BANDS from canonical catalog
export const PRICE_BANDS: Record<Family, { low: number; high: number }> = Object.fromEntries(
  FAMILIES.map(family => [family, { low: FAMILY_META[family].priceBand[0], high: FAMILY_META[family].priceBand[1] }])
) as Record<Family, { low: number; high: number }>;

export function revenueScenarios(low: number, high: number) {
  const mid = Math.round((low + high) / 2);
  return [
    { units: 10, revenue: mid * 10 },
    { units: 25, revenue: mid * 25 },
    { units: 50, revenue: mid * 50 },
  ];
}

export const SUPPORTIVE_COPY = {
  empty: "Drop one product idea in the flask. We'll do the alchemy.",
  tip: "Small experiments lead to big wins.",
  success: "✨ Draft bottled! Let's get it ready to sell.",
  pricing: "Start premium; discount later. Value > volume.",
};
