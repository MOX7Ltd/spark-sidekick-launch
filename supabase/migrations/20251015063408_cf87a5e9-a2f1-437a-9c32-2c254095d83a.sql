-- Phase 1: Database Schema for Persistent Onboarding System

-- 1. Prospect / temporary profile table
CREATE TABLE IF NOT EXISTS public.onboarding_profiles (
  session_id TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  migrated_to_user UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Onboarding progress state table
CREATE TABLE IF NOT EXISTS public.onboarding_state (
  session_id TEXT PRIMARY KEY,
  step TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  business_draft_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. AI generation records (for caching and deduplication)
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  model TEXT,
  tokens_in INTEGER,
  tokens_out INTEGER,
  cost_usd NUMERIC(8,4),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  primary_selection BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. AI generation items (multi-option outputs)
CREATE TABLE IF NOT EXISTS public.ai_generation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES public.ai_generations(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL DEFAULT 0,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update existing businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS selected_generation_ids TEXT[];

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_generations_session_stage ON public.ai_generations(session_id, stage);
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_stage ON public.ai_generations(user_id, stage);
CREATE INDEX IF NOT EXISTS idx_ai_generations_prompt_hash ON public.ai_generations(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_ai_generation_items_generation ON public.ai_generation_items(generation_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_state_business ON public.onboarding_state(business_draft_id);

-- Enable RLS on new tables
ALTER TABLE public.onboarding_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for onboarding_profiles
CREATE POLICY "allow_anon_insert_onboarding_profiles"
ON public.onboarding_profiles
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "allow_own_session_onboarding_profiles"
ON public.onboarding_profiles
FOR SELECT
TO anon, authenticated
USING (
  session_id = current_setting('request.headers', true)::json->>'x-session-id'
  OR (auth.uid() IS NOT NULL AND migrated_to_user = auth.uid())
);

CREATE POLICY "allow_own_update_onboarding_profiles"
ON public.onboarding_profiles
FOR UPDATE
TO anon, authenticated
USING (
  session_id = current_setting('request.headers', true)::json->>'x-session-id'
  OR (auth.uid() IS NOT NULL AND migrated_to_user = auth.uid())
);

-- RLS Policies for onboarding_state
CREATE POLICY "allow_anon_insert_onboarding_state"
ON public.onboarding_state
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "allow_own_session_onboarding_state"
ON public.onboarding_state
FOR ALL
TO anon, authenticated
USING (
  session_id = current_setting('request.headers', true)::json->>'x-session-id'
  OR EXISTS (
    SELECT 1 FROM public.businesses b 
    WHERE b.id = onboarding_state.business_draft_id 
    AND b.owner_id = auth.uid()
  )
);

-- RLS Policies for ai_generations
CREATE POLICY "allow_insert_ai_generations"
ON public.ai_generations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "allow_own_or_session_ai_generations"
ON public.ai_generations
FOR SELECT
TO anon, authenticated
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR session_id = current_setting('request.headers', true)::json->>'x-session-id'
);

CREATE POLICY "allow_update_own_ai_generations"
ON public.ai_generations
FOR UPDATE
TO anon, authenticated
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR session_id = current_setting('request.headers', true)::json->>'x-session-id'
);

-- RLS Policies for ai_generation_items
CREATE POLICY "allow_insert_ai_generation_items"
ON public.ai_generation_items
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "allow_view_ai_generation_items"
ON public.ai_generation_items
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ai_generations g
    WHERE g.id = ai_generation_items.generation_id
    AND (
      (auth.uid() IS NOT NULL AND g.user_id = auth.uid())
      OR g.session_id = current_setting('request.headers', true)::json->>'x-session-id'
    )
  )
);

CREATE POLICY "allow_update_ai_generation_items"
ON public.ai_generation_items
FOR UPDATE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ai_generations g
    WHERE g.id = ai_generation_items.generation_id
    AND (
      (auth.uid() IS NOT NULL AND g.user_id = auth.uid())
      OR g.session_id = current_setting('request.headers', true)::json->>'x-session-id'
    )
  )
);

-- Trigger for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_onboarding_profiles_updated_at
BEFORE UPDATE ON public.onboarding_profiles
FOR EACH ROW
EXECUTE FUNCTION update_onboarding_updated_at();

CREATE TRIGGER update_onboarding_state_updated_at
BEFORE UPDATE ON public.onboarding_state
FOR EACH ROW
EXECUTE FUNCTION update_onboarding_updated_at();