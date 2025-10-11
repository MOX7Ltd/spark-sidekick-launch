-- Fix function search_path security warning
CREATE OR REPLACE FUNCTION public.prevent_double_booking()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;