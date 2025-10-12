-- Add handle column to businesses table for shopfront URLs
ALTER TABLE public.businesses 
ADD COLUMN handle TEXT UNIQUE;

-- Create index for faster lookups by handle
CREATE INDEX idx_businesses_handle ON public.businesses(handle) WHERE handle IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.businesses.handle IS 'Unique URL slug for the business shopfront (e.g., "my-cafe-1234")';