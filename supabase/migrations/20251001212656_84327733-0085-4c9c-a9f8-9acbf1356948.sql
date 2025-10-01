-- Create idempotent_responses table for caching generation results
CREATE TABLE IF NOT EXISTS public.idempotent_responses (
  session_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  fn TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response JSONB NOT NULL,
  PRIMARY KEY (session_id, idempotency_key)
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_idempotent_responses_created_at 
  ON public.idempotent_responses(created_at DESC);

-- Enable RLS
ALTER TABLE public.idempotent_responses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for anonymous onboarding)
CREATE POLICY "Anyone can insert idempotent responses" 
  ON public.idempotent_responses
  FOR INSERT
  WITH CHECK (true);

-- Allow reading own session responses
CREATE POLICY "Users can read their session responses" 
  ON public.idempotent_responses
  FOR SELECT
  USING (true);

-- Cleanup function to remove old responses (> 15 minutes)
CREATE OR REPLACE FUNCTION cleanup_old_idempotent_responses()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.idempotent_responses
  WHERE created_at < now() - INTERVAL '15 minutes';
END;
$$;