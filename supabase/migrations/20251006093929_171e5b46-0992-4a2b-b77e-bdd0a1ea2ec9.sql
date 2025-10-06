-- Ensure audience and tone_tags columns exist (safe, additive)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS audience text;

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS tone_tags text[] DEFAULT '{}';

-- Backfill existing rows with harmless defaults
UPDATE public.businesses
SET 
  audience = COALESCE(audience, 'General'),
  tone_tags = COALESCE(tone_tags, '{}'::text[])
WHERE audience IS NULL OR tone_tags IS NULL;