-- Create RPC function for analytics summary
CREATE OR REPLACE FUNCTION public.analytics_summary(bid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  s record;
BEGIN
  SELECT
    count(*) FILTER (WHERE type='view') as views,
    count(*) FILTER (WHERE type='message_click') as messages,
    count(*) FILTER (WHERE type='review_submit') as reviews,
    (SELECT avg(rating)/10.0 FROM public.reviews WHERE business_id=bid AND status='published') as avg_rating
  INTO s
  FROM public.analytics_events
  WHERE business_id=bid
  AND created_at > now() - INTERVAL '30 days';
  
  RETURN json_build_object(
    'views', COALESCE(s.views, 0),
    'messages', COALESCE(s.messages, 0),
    'reviews', COALESCE(s.reviews, 0),
    'avg_rating', COALESCE(s.avg_rating, 0)
  );
END;
$$;