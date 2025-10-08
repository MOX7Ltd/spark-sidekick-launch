-- Create onboarding_sessions table for persisting onboarding state
CREATE TABLE public.onboarding_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  payload jsonb NOT NULL,
  user_hint_email text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  migrated_at timestamp with time zone,
  migrated_to_user_id uuid
);

-- Enable RLS
ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert sessions
CREATE POLICY "Anyone can insert onboarding sessions"
  ON public.onboarding_sessions
  FOR INSERT
  WITH CHECK (true);

-- Allow anonymous users to read their own session
CREATE POLICY "Anyone can read their session"
  ON public.onboarding_sessions
  FOR SELECT
  USING (true);

-- Allow service role to update sessions (for migration)
CREATE POLICY "Service role can update sessions"
  ON public.onboarding_sessions
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Create index for faster session lookups
CREATE INDEX idx_onboarding_sessions_session_id ON public.onboarding_sessions(session_id);
CREATE INDEX idx_onboarding_sessions_migrated_at ON public.onboarding_sessions(migrated_at);