-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  title TEXT,
  notes TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('pending','confirmed','cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to request appointments
CREATE POLICY "anon_can_request_appointment"
ON public.appointments
FOR INSERT
WITH CHECK (auth.role() = 'anon');

-- Allow business owners to manage their appointments
CREATE POLICY "owner_manage_appointments"
ON public.appointments
FOR ALL
USING (business_id IN (
  SELECT id FROM public.businesses WHERE owner_id = auth.uid()
));

-- Insert test data
INSERT INTO public.appointments (business_id, customer_name, customer_email, title, notes, start_time, end_time, status)
VALUES
  ((SELECT id FROM public.businesses WHERE owner_id = '2ee01320-d5b1-4c5c-b353-cc8c3968f52d' LIMIT 1), 
   'Jane Doe', 'jane@example.com', 'Coaching Session', 'Discussion about goals and progress', 
   now() + interval '1 day', now() + interval '1 day 1 hour', 'confirmed'),
  ((SELECT id FROM public.businesses WHERE owner_id = '2ee01320-d5b1-4c5c-b353-cc8c3968f52d' LIMIT 1), 
   'John Smith', 'john@example.com', 'Product Consultation', 'Initial discovery call', 
   now() + interval '2 days', now() + interval '2 days 1 hour', 'pending'),
  ((SELECT id FROM public.businesses WHERE owner_id = '2ee01320-d5b1-4c5c-b353-cc8c3968f52d' LIMIT 1), 
   'Sarah Johnson', 'sarah@example.com', 'Follow-up Meeting', 'Review progress and next steps', 
   now() + interval '3 days', now() + interval '3 days 1 hour', 'confirmed'),
  ((SELECT id FROM public.businesses WHERE owner_id = '2ee01320-d5b1-4c5c-b353-cc8c3968f52d' LIMIT 1), 
   'Jane Doe', 'jane@example.com', 'Initial Discovery Call', 'First consultation', 
   now() + interval '4 days', now() + interval '4 days 1 hour', 'pending'),
  ((SELECT id FROM public.businesses WHERE owner_id = '2ee01320-d5b1-4c5c-b353-cc8c3968f52d' LIMIT 1), 
   'Michael Brown', 'michael@example.com', 'Strategy Session', 'Planning and roadmap discussion', 
   now() + interval '5 days', now() + interval '5 days 1 hour', 'confirmed'),
  ((SELECT id FROM public.businesses WHERE owner_id = '2ee01320-d5b1-4c5c-b353-cc8c3968f52d' LIMIT 1), 
   'Emily Davis', 'emily@example.com', 'Check-in Meeting', 'Quick status update', 
   now() + interval '6 days', now() + interval '6 days 30 minutes', 'confirmed'),
  ((SELECT id FROM public.businesses WHERE owner_id = '2ee01320-d5b1-4c5c-b353-cc8c3968f52d' LIMIT 1), 
   'David Wilson', 'david@example.com', 'Training Session', 'Onboarding and training', 
   now() + interval '7 days', now() + interval '7 days 2 hours', 'pending'),
  ((SELECT id FROM public.businesses WHERE owner_id = '2ee01320-d5b1-4c5c-b353-cc8c3968f52d' LIMIT 1), 
   'Lisa Anderson', 'lisa@example.com', 'Final Review', 'Project completion review', 
   now() + interval '8 days', now() + interval '8 days 1 hour', 'confirmed');