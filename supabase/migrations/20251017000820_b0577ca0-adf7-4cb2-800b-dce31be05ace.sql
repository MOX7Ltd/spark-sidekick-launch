-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS preauth_profiles_select ON public.preauth_profiles;

-- Create new policy that allows collision detection
CREATE POLICY preauth_profiles_select ON public.preauth_profiles
FOR SELECT
USING (
  -- Can read own session's row
  session_id = ((current_setting('request.headers'::text, true))::json ->> 'x-session-id'::text)
  OR
  -- Can read own linked profile (for authenticated users)
  (linked_user_id IS NOT NULL AND linked_user_id = auth.uid())
  OR
  -- Allow reading any row by email for collision detection
  -- (Safe because preauth_profiles only contains email + session_id + timestamps)
  email IS NOT NULL
);