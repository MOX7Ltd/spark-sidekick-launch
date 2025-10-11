-- Create availability table
CREATE TABLE IF NOT EXISTS public.availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  weekday INT CHECK (weekday BETWEEN 0 AND 6) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS availability_unique_slot 
ON public.availability (business_id, weekday, start_time, end_time);

-- Enable RLS
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

-- Policy for owners
CREATE POLICY "owner_manage_availability"
ON public.availability
FOR ALL
USING (business_id IN (
  SELECT id FROM public.businesses WHERE owner_id = auth.uid()
))
WITH CHECK (business_id IN (
  SELECT id FROM public.businesses WHERE owner_id = auth.uid()
));

-- Prevent double booking trigger
CREATE OR REPLACE FUNCTION public.prevent_double_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE business_id = NEW.business_id
      AND tstzrange(start_time, end_time) && tstzrange(NEW.start_time, NEW.end_time)
      AND id <> NEW.id
      AND status != 'cancelled'
  ) THEN
    RAISE EXCEPTION 'Double booking detected for business %', NEW.business_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_double_booking
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.prevent_double_booking();

-- Insert test availability data
INSERT INTO public.availability (business_id, weekday, start_time, end_time)
SELECT id, 1, '09:00', '17:00' FROM public.businesses WHERE owner_id = '2ee01320-d5b1-4c5c-b353-cc8c3968f52d' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.availability (business_id, weekday, start_time, end_time)
SELECT id, 2, '09:00', '17:00' FROM public.businesses WHERE owner_id = '2ee01320-d5b1-4c5c-b353-cc8c3968f52d' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.availability (business_id, weekday, start_time, end_time)
SELECT id, 3, '09:00', '17:00' FROM public.businesses WHERE owner_id = '2ee01320-d5b1-4c5c-b353-cc8c3968f52d' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.availability (business_id, weekday, start_time, end_time)
SELECT id, 4, '09:00', '17:00' FROM public.businesses WHERE owner_id = '2ee01320-d5b1-4c5c-b353-cc8c3968f52d' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.availability (business_id, weekday, start_time, end_time)
SELECT id, 5, '09:00', '17:00' FROM public.businesses WHERE owner_id = '2ee01320-d5b1-4c5c-b353-cc8c3968f52d' LIMIT 1
ON CONFLICT DO NOTHING;