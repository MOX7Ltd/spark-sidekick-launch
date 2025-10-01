-- Create feature_flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read feature flags (they're public configuration)
CREATE POLICY "Anyone can read feature flags"
ON public.feature_flags
FOR SELECT
USING (true);

-- Only service role can modify (use Supabase dashboard)
CREATE POLICY "Service role can modify feature flags"
ON public.feature_flags
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Seed initial feature flags
INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('new_name_prompt', false, 'Use improved business name generation prompt'),
  ('multi_vibe_select', false, 'Allow selecting multiple vibes in onboarding'),
  ('better_product_gen', false, 'Use enhanced product idea generation logic'),
  ('shopfront_preview_v2', false, 'Show new storefront preview design')
ON CONFLICT (key) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_feature_flag_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_feature_flag_updated_at();