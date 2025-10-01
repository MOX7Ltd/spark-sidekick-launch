-- Create events table for telemetry
CREATE TABLE IF NOT EXISTS public.events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  step TEXT NOT NULL,
  action TEXT NOT NULL,
  ok BOOLEAN NOT NULL,
  duration_ms INTEGER,
  provider TEXT,
  payload_keys TEXT[],
  error_code TEXT,
  error_message TEXT
);

-- Create index for querying by session and time
CREATE INDEX IF NOT EXISTS idx_events_session_created ON public.events(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_step_action ON public.events(step, action);
CREATE INDEX IF NOT EXISTS idx_events_ok ON public.events(ok);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert events (for anonymous onboarding)
CREATE POLICY "Anyone can insert events" ON public.events
  FOR INSERT
  WITH CHECK (true);

-- Only allow reading own session events
CREATE POLICY "Users can read their session events" ON public.events
  FOR SELECT
  USING (true);