-- Create AI cost tracking table
CREATE TABLE public.ai_cost_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  session_id text,
  user_id uuid REFERENCES auth.users(id),
  business_id uuid REFERENCES businesses(id),
  
  -- AI call metadata
  function_name text NOT NULL,
  model text NOT NULL,
  
  -- Usage metrics
  tokens_in integer NOT NULL,
  tokens_out integer NOT NULL,
  cost_usd numeric(10,6) NOT NULL,
  duration_ms integer,
  
  -- Request context
  request_type text,
  metadata jsonb DEFAULT '{}'
);

-- Indexes for analytics
CREATE INDEX idx_ai_cost_user ON public.ai_cost_tracking(user_id, created_at);
CREATE INDEX idx_ai_cost_session ON public.ai_cost_tracking(session_id, created_at);
CREATE INDEX idx_ai_cost_function ON public.ai_cost_tracking(function_name, created_at);
CREATE INDEX idx_ai_cost_business ON public.ai_cost_tracking(business_id, created_at);

-- Enable RLS
ALTER TABLE public.ai_cost_tracking ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (edge functions need this)
CREATE POLICY "ai_cost_insert" ON public.ai_cost_tracking
  FOR INSERT WITH CHECK (true);

-- Users can view their own usage
CREATE POLICY "ai_cost_select_own" ON public.ai_cost_tracking
  FOR SELECT USING (
    (user_id IS NOT NULL AND user_id = auth.uid()) OR
    (session_id IS NOT NULL AND session_id = ((current_setting('request.headers'::text, true))::json ->> 'x-session-id'))
  );