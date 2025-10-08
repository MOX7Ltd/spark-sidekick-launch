export interface ProductFamily {
  key: string;
  label: string;
  priceRange: string;
  tooltip: string;
}

export const PRODUCT_FAMILIES: ProductFamily[] = [
  { key: 'checklist', label: 'Checklist/Template', priceRange: '£5–£29', tooltip: 'Quick wins & actionable guides' },
  { key: 'guide', label: 'Digital Guide/eBook', priceRange: '£9–£49', tooltip: 'In-depth knowledge products' },
  { key: 'session', label: '1:1 Session', priceRange: '£40–£200', tooltip: 'Personal coaching & consulting' },
  { key: 'course', label: 'Cohort/Mini-Course', priceRange: '£25–£149', tooltip: 'Group learning experiences' },
  { key: 'template', label: 'Notion/Canva Template', priceRange: '£7–£39', tooltip: 'Ready-to-use digital templates' },
  { key: 'email', label: 'Email Pack', priceRange: '£15–£99', tooltip: 'Email sequences & newsletters' },
  { key: 'video', label: 'Video Pack', priceRange: '£9–£59', tooltip: 'Video tutorials & courses' },
  { key: 'bundle', label: 'Bundle/Starter Kit', priceRange: '£19–£99', tooltip: 'Combined resources & tools' },
];

export const PRICE_BANDS = {
  checklist: { low: 5, high: 29 },
  guide: { low: 9, high: 49 },
  session: { low: 40, high: 200 },
  course: { low: 25, high: 149 },
  template: { low: 7, high: 39 },
  email: { low: 15, high: 99 },
  video: { low: 9, high: 59 },
  bundle: { low: 19, high: 99 },
};

export function normalizeFamily(key: string): string {
  const normalized = key.toLowerCase().replace(/[\s_-]+/g, '');
  const validKeys = Object.keys(PRICE_BANDS);
  return validKeys.includes(normalized) ? normalized : 'guide';
}

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
