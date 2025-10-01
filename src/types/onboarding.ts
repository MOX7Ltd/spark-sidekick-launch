/**
 * Canonical data contract for the onboarding flow.
 * This is the single source of truth for all onboarding data structures.
 * 
 * Frontend components, API clients, and edge functions must all conform to this contract.
 */

export interface ProductIdea {
  id: string;
  title: string;
  format: string;
  description: string;
}

export interface AboutYou {
  firstName: string;
  lastName: string;
  expertise: string;
  motivation?: string;
  includeFirstName: boolean;
  includeLastName: boolean;
  profilePicture?: string; // For future use
}

export interface NameOption {
  name: string;
  tagline: string;
  style?: string;
  archetype?: string;
}

export interface BusinessIdentity {
  name: string;
  nameOptions: NameOption[];
  
  // Logo handling: always keep both fields
  logoUrl?: string;      // Preferred: uploaded or generated file URL
  logoSVG?: string;      // Fallback: base64/data-uri for generated logos
  logoSource: "uploaded" | "generated" | null;
  
  tagline: string;
  bio: string;           // NOT copied from expertise; generated from context
  colors: string[];      // Brand colors, never hardcoded
}

export interface IntroCampaign {
  shortPost: {
    caption: string;
    hashtags: string[];
  };
  longPost: {
    caption: string;
  };
}

export interface OnboardingData {
  idea: string;
  products: ProductIdea[];
  
  aboutYou: AboutYou;
  
  // Single source for style/tone & audiences (multi-select)
  vibes: string[];       // e.g., ["professional", "educational"]
  audiences: string[];   // e.g., ["parents", "learners"]
  
  businessIdentity: BusinessIdentity;
  
  introCampaign?: IntroCampaign;
}

// Edge function request types
export interface GenerateIdentityRequest {
  idea: string;
  audiences: string[];   // Always array, never single string
  vibes: string[];       // Always array, never single string
  
  aboutYou: AboutYou;
  
  // Name preferences
  bannedWords?: string[];
  rejectedNames?: string[];
  
  // Generation flags
  regenerateNamesOnly?: boolean;
  regenerateSingleName?: boolean;
}

export interface GenerateLogosRequest {
  businessName: string;
  vibes: string[];       // Style inferred from vibes
  rejectedLogos?: number[]; // Indices of disliked logos
  regenerateSingleLogo?: boolean;
  regenerateLogoIndex?: number;
}

export interface GenerateCampaignRequest {
  businessName: string;
  tagline: string;
  bio: string;
  products: ProductIdea[];
  audiences: string[];
  vibes: string[];
  type: 'intro' | 'quick_win' | 'conversion' | 'custom';
  platforms: string[];
}
