-- Fix security warning: Set search_path for function
DROP FUNCTION IF EXISTS update_onboarding_updated_at CASCADE;

CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER update_onboarding_profiles_updated_at
BEFORE UPDATE ON public.onboarding_profiles
FOR EACH ROW
EXECUTE FUNCTION update_onboarding_updated_at();

CREATE TRIGGER update_onboarding_state_updated_at
BEFORE UPDATE ON public.onboarding_state
FOR EACH ROW
EXECUTE FUNCTION update_onboarding_updated_at();