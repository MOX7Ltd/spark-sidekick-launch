-- Make owner_id nullable on businesses table to support anonymous onboarding
-- This allows RLS policies to accept inserts with owner_id IS NULL AND session_id IS NOT NULL
ALTER TABLE public.businesses
  ALTER COLUMN owner_id DROP NOT NULL;

-- Add comment to document the change
COMMENT ON COLUMN public.businesses.owner_id IS 'Nullable to support anonymous onboarding with session_id. Claimed on first auth via claim-onboarding function.';