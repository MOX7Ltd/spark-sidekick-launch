-- Add new columns to products table (additive only)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS type text CHECK (type IN ('digital','course','service','physical')),
  ADD COLUMN IF NOT EXISTS fulfillment jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('draft','published')) DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS generation_source text CHECK (generation_source IN ('ai-auto','manual','idea-lab')) DEFAULT 'idea-lab';

-- Archive old PDF column (with exists check)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'pdf_url'
  ) THEN
    ALTER TABLE public.products RENAME COLUMN pdf_url TO legacy_pdf_url;
  END IF;
END $$;

-- Create ideas table
CREATE TABLE IF NOT EXISTS public.ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  input_text text NOT NULL,
  ideas_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ideas_owner_idx ON public.ideas(owner_id);

-- Add tone_tags to businesses for prompt enrichment
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS tone_tags text[] DEFAULT '{}';

-- RLS for ideas table
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own ideas"
  ON public.ideas FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view their own ideas"
  ON public.ideas FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can update their own ideas"
  ON public.ideas FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own ideas"
  ON public.ideas FOR DELETE
  USING (auth.uid() = owner_id);

-- Update products RLS for new status field (only if policy doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Public can view published products'
  ) THEN
    CREATE POLICY "Public can view published products"
      ON public.products FOR SELECT
      USING (status = 'published');
  END IF;
END $$;

-- Add feature flags
INSERT INTO public.feature_flags (key, enabled, description)
VALUES 
  ('product_builder', false, 'Legacy auto-build products feature'),
  ('idea_lab', true, 'New Idea Lab with assist-and-upload model'),
  ('template_builder', false, 'Template builder for digital assets')
ON CONFLICT (key) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  description = EXCLUDED.description;