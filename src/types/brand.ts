/**
 * BrandContext: Unified data model for the entire onboarding pipeline.
 * This flows through all generation functions to ensure coherent output.
 */

export type ProductFamily = 'Digital' | 'Teach' | 'Services' | 'Physical';

export interface BrandContext {
  // Step 1: Product Idea
  idea_text: string;
  families_ranked?: ProductFamily[];
  dominant_family?: ProductFamily;

  // Step 2: About You
  bio?: string;
  tone_adjectives?: string[];
  audience?: string[];
  personal_brand?: boolean;
  user_first_name?: string;
  user_last_name?: string;
  expertise?: string;
  motivation?: string;

  // Step 3: Brand Identity
  business_name?: string;
  palette?: string[];
  logo_style?: string;

  // Metadata
  session_id?: string;
  feature_flags?: string[];
  
  // Legacy compatibility
  vibes?: string[];
  audiences?: string[];
}

/**
 * Generate a context hash for idempotency
 */
export function contextHash(ctx: BrandContext): string {
  const hashData = {
    idea_text: ctx.idea_text,
    dominant_family: ctx.dominant_family,
    business_name: ctx.business_name,
    logo_style: ctx.logo_style,
    personal_brand: ctx.personal_brand,
    user_first_name: ctx.user_first_name,
    user_last_name: ctx.user_last_name,
  };
  
  try {
    return btoa(JSON.stringify(hashData)).slice(0, 16);
  } catch {
    // Fallback for non-browser environments
    return JSON.stringify(hashData).slice(0, 16);
  }
}
