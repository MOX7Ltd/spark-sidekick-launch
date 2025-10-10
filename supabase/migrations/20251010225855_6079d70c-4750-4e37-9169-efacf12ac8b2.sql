-- Add columns to reviews table for customer reviews
ALTER TABLE public.reviews 
  ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id),
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Make user_id nullable for customer reviews (non-authenticated)
ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.reviews ALTER COLUMN product_id DROP NOT NULL;

-- Add index for business reviews
CREATE INDEX IF NOT EXISTS idx_reviews_business_status ON public.reviews(business_id, status);

-- Add reviews_summary to shopfront_settings
ALTER TABLE public.shopfront_settings 
  ADD COLUMN IF NOT EXISTS reviews_summary jsonb DEFAULT '{"avg": 0, "count": 0}'::jsonb;

-- Create RPC function to compute business rating
CREATE OR REPLACE FUNCTION public.compute_business_rating(bid uuid)
RETURNS jsonb AS $$
DECLARE 
  r record;
BEGIN
  SELECT 
    ROUND(AVG(rating)::numeric, 1) as avg, 
    COUNT(*) as count
  INTO r
  FROM public.reviews 
  WHERE business_id = bid 
    AND status = 'published' 
    AND rating IS NOT NULL;
  
  -- Update shopfront_settings with new summary
  UPDATE public.shopfront_settings 
  SET reviews_summary = jsonb_build_object('avg', COALESCE(r.avg, 0), 'count', COALESCE(r.count, 0))
  WHERE business_id = bid;
  
  RETURN jsonb_build_object('avg', COALESCE(r.avg, 0), 'count', COALESCE(r.count, 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update RLS policies for reviews to allow customer submissions
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

-- Allow anyone to insert reviews (customers)
CREATE POLICY "anyone_can_create_review" ON public.reviews
  FOR INSERT WITH CHECK (true);

-- Allow business owners to view their reviews
CREATE POLICY "owner_can_view_business_reviews" ON public.reviews
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

-- Allow public to view published reviews
CREATE POLICY "public_can_view_published_reviews" ON public.reviews
  FOR SELECT USING (status = 'published' AND NOT is_hidden);

-- Allow business owners to update reviews (reply, hide)
CREATE POLICY "owner_can_update_business_reviews" ON public.reviews
  FOR UPDATE USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );