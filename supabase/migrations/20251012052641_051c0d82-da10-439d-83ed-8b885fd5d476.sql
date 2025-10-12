-- Add unique constraint on stripe_payment_intent to enable idempotent order upserts
ALTER TABLE public.orders
ADD CONSTRAINT orders_stripe_payment_intent_unique UNIQUE (stripe_payment_intent);