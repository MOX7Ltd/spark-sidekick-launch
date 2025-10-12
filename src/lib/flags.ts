// Phase 0 flags — do not import into onboarding or existing pages yet.
export const FLAGS = {
  SHOPFRONT_V1: true,
  SHOPFRONT_PREVIEW_V1: true,
  SHOPFRONT_CART_V1: true,
  MESSAGING_V1: true,
  REVIEWS_V1: true,
  ANALYTICS_V1: true, // enable analytics dashboard
  STRIPE_V1: true, // enable sales performance tracking
  CALENDAR_V1: true, // enable calendar & appointments
  SOCIAL_V1: true, // enable social performance tracking
  STRIPE_PAYMENTS_V1: true, // enable Stripe integration (starter pack, subscriptions, marketplace)
  CUSTOMER_INSIGHTS_V1: true, // enable customer insights & analytics
} as const;

export type FlagKey = keyof typeof FLAGS;
