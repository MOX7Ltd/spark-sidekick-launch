-- Fix security issue: Set search_path for cleanup function
DROP FUNCTION IF EXISTS cleanup_old_idempotent_responses();

CREATE OR REPLACE FUNCTION cleanup_old_idempotent_responses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.idempotent_responses
  WHERE created_at < now() - INTERVAL '15 minutes';
END;
$$;