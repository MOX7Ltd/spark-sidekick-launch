-- Make owner_id nullable to support anonymous onboarding
ALTER TABLE public.businesses
  ALTER COLUMN owner_id DROP NOT NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS businesses_session_id_idx ON public.businesses (session_id);
CREATE INDEX IF NOT EXISTS businesses_owner_id_idx ON public.businesses (owner_id);

-- Ensure RLS is enabled
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "owners read/write businesses" ON public.businesses;
DROP POLICY IF EXISTS "Anonymous users can create businesses with session_id" ON public.businesses;
DROP POLICY IF EXISTS "Service role can update businesses" ON public.businesses;
DROP POLICY IF EXISTS "anon_insert_businesses" ON public.businesses;
DROP POLICY IF EXISTS "anon_select_by_session" ON public.businesses;
DROP POLICY IF EXISTS "owner_select_businesses" ON public.businesses;
DROP POLICY IF EXISTS "owner_update_businesses" ON public.businesses;

-- Create new specific policies for anonymous users
CREATE POLICY "anon_insert_businesses"
ON public.businesses FOR INSERT
TO anon
WITH CHECK (owner_id IS NULL AND session_id IS NOT NULL);

CREATE POLICY "anon_select_by_session"
ON public.businesses FOR SELECT
TO anon
USING (session_id IS NOT NULL);

-- Create policies for authenticated users
CREATE POLICY "owner_select_businesses"
ON public.businesses FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "owner_update_businesses"
ON public.businesses FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Keep service role policy for claim function
CREATE POLICY "service_role_update_businesses"
ON public.businesses FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);