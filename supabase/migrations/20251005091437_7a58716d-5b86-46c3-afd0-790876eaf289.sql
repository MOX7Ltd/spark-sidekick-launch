-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  thread_id UUID NOT NULL,
  from_name TEXT,
  from_email TEXT,
  product_id UUID,
  body TEXT NOT NULL,
  is_from_customer BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message_threads table
CREATE TABLE IF NOT EXISTS public.message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('one_on_one','workshop','class','other')) DEFAULT 'other',
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE,
  location_url TEXT,
  price NUMERIC,
  product_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  reviewer_name TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  reply TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_hidden BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_user_thread ON public.messages(user_id, thread_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_user ON public.message_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_user_start ON public.calendar_events(user_id, start_at);
CREATE INDEX IF NOT EXISTS idx_reviews_user_product ON public.reviews(user_id, product_id);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for message_threads
CREATE POLICY "Users can view their own threads"
ON public.message_threads FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own threads"
ON public.message_threads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threads"
ON public.message_threads FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for calendar_events
CREATE POLICY "Users can view their own events"
ON public.calendar_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events"
ON public.calendar_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
ON public.calendar_events FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
ON public.calendar_events FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for reviews
CREATE POLICY "Users can view their own reviews"
ON public.reviews FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.reviews FOR DELETE
USING (auth.uid() = user_id);