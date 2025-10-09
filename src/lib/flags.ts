// Phase 0 flags — do not import into onboarding or existing pages yet.
export const FLAGS = {
  SHOPFRONT_V1: true,          // toggles new public route later (unused in Phase 0)
  SHOPFRONT_PREVIEW_V1: false, // when true (later), onboarding preview will switch to new components
  SHOPFRONT_CART_V1: true,     // enables cart UI later (safe stub in Phase 0)
} as const;

export type FlagKey = keyof typeof FLAGS;
