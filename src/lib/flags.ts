// Phase 0 flags — do not import into onboarding or existing pages yet.
export const FLAGS = {
  SHOPFRONT_V1: true,
  SHOPFRONT_PREVIEW_V1: true,
  SHOPFRONT_CART_V1: true,
  MESSAGING_V1: false,
  REVIEWS_V1: false,
} as const;

export type FlagKey = keyof typeof FLAGS;
