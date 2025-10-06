export type Baseline = {
  headline: string;
  subheadline: string;
  bullets: string[];
  body: string;
  features: { label: string; value: string }[];
  priceBlock?: { price: string; note?: string };
  cta: string;
  brand: { primary: string; accent: string; logoSvg?: string };
};

export async function buildAIBaseline(product: any, biz: any): Promise<Baseline> {
  // Create a deterministic fallback baseline with actual product data
  return {
    headline: product.title || `${biz?.business_name ?? 'Your Brand'} — New Product`,
    subheadline: product.tagline || biz?.tagline || 'Crafted for your first customers',
    bullets: [
      'Professional quality and attention to detail',
      'Designed to meet your specific needs',
      'Backed by expert support and guidance',
      'Ready to use immediately',
      'Flexible and customizable options'
    ],
    body: product.description || 'This is a professionally crafted product designed to deliver exceptional value to your customers.',
    features: [
      { label: 'Format', value: product.format || 'Digital' },
      { label: 'Category', value: 'Professional Service' },
      { label: 'Delivery', value: 'Immediate' }
    ],
    priceBlock: product.price ? { 
      price: `$${Number(product.price).toFixed(2)}`,
      note: 'One-time investment'
    } : undefined,
    cta: 'Get started today and experience the difference',
    brand: {
      primary: biz?.brand_colors?.[0] || '#1A4D8F',
      accent: biz?.brand_colors?.[1] || '#4994D5',
      logoSvg: biz?.logo_svg
    }
  };
}
