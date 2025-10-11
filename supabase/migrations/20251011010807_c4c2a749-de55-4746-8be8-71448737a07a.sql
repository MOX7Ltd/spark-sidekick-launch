-- Drop existing rating check constraint
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_rating_check;

-- Add new rating check constraint that allows 10-50 range (where 10=1 star, 50=5 stars)
ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_check CHECK (rating >= 10 AND rating <= 50);

-- Insert test customer message threads
INSERT INTO public.customer_messages (business_id, customer_name, customer_email, topic, status, created_at, last_message_at) VALUES
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'Sarah Johnson', 'sarah.j@example.com', 'general', 'open', now() - interval '2 hours', now() - interval '2 hours'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'Mike Chen', 'mike.chen@example.com', 'pricing', 'waiting', now() - interval '1 day', now() - interval '1 day'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'Emma Wilson', 'emma.w@example.com', 'shipping', 'closed', now() - interval '3 days', now() - interval '3 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'David Lee', 'david.lee@example.com', 'booking', 'open', now() - interval '5 hours', now() - interval '5 hours'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'Lisa Martinez', 'lisa.m@example.com', 'other', 'waiting', now() - interval '12 hours', now() - interval '12 hours');

-- Insert test reviews (5 published, 3 pending) with ratings 10-50
INSERT INTO public.reviews (business_id, reviewer_name, customer_email, rating, title, body, status, created_at) VALUES
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'Jennifer Brown', 'jennifer.b@example.com', 50, 'Excellent service!', 'I had a wonderful experience. The quality exceeded my expectations and the customer service was outstanding.', 'published', now() - interval '5 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'Robert Taylor', 'robert.t@example.com', 40, 'Very good', 'Great product overall. Quick delivery and good communication throughout.', 'published', now() - interval '8 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'Michelle Garcia', 'michelle.g@example.com', 50, 'Highly recommend!', 'Absolutely fantastic! Will definitely order again. Five stars all around.', 'published', now() - interval '10 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'James Anderson', 'james.a@example.com', 40, 'Good value', 'Solid product for the price. Arrived on time and as described.', 'published', now() - interval '15 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'Patricia Moore', 'patricia.m@example.com', 50, 'Amazing quality', 'The attention to detail is impressive. Exactly what I was looking for!', 'published', now() - interval '20 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'Thomas White', 'thomas.w@example.com', 40, 'Pretty good', 'Met my expectations. Would consider ordering again in the future.', 'pending', now() - interval '1 day'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'Mary Johnson', 'mary.j@example.com', 50, 'Exceeded expectations', 'Better than I hoped! Fast shipping and great quality.', 'pending', now() - interval '2 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'Christopher Davis', 'chris.d@example.com', 40, 'Satisfied customer', 'Good experience overall. The product works well.', 'pending', now() - interval '3 days');

-- Insert test analytics events
INSERT INTO public.analytics_events (business_id, type, metadata, created_at) VALUES
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "shopfront"}', now() - interval '1 hour'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "shopfront"}', now() - interval '2 hours'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "shopfront"}', now() - interval '3 hours'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "product"}', now() - interval '4 hours'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "product"}', now() - interval '5 hours'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'message_click', '{"source": "shopfront"}', now() - interval '6 hours'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'message_click', '{"source": "shopfront"}', now() - interval '7 hours'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'review_submit', '{"rating": 5}', now() - interval '5 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'review_submit', '{"rating": 4}', now() - interval '8 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "shopfront"}', now() - interval '1 day'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "shopfront"}', now() - interval '2 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "shopfront"}', now() - interval '3 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "product"}', now() - interval '4 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "product"}', now() - interval '5 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'message_click', '{"source": "product"}', now() - interval '6 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "shopfront"}', now() - interval '7 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "shopfront"}', now() - interval '8 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "product"}', now() - interval '9 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "product"}', now() - interval '10 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'review_submit', '{"rating": 5}', now() - interval '10 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "shopfront"}', now() - interval '11 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "shopfront"}', now() - interval '12 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "product"}', now() - interval '13 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "product"}', now() - interval '14 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'review_submit', '{"rating": 4}', now() - interval '15 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'message_click', '{"source": "shopfront"}', now() - interval '16 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "shopfront"}', now() - interval '17 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "product"}', now() - interval '18 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "product"}', now() - interval '19 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'review_submit', '{"rating": 5}', now() - interval '20 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "shopfront"}', now() - interval '21 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "shopfront"}', now() - interval '25 days'),
('eb0a8a0e-4b47-47b9-8558-f6661f6a32e5', 'view', '{"page": "product"}', now() - interval '28 days');

-- Update reviews_summary in shopfront_settings (avg rating is 46 out of 50, which is 4.6 stars)
UPDATE public.shopfront_settings 
SET reviews_summary = jsonb_build_object('avg', 46, 'count', 5)
WHERE business_id = 'eb0a8a0e-4b47-47b9-8558-f6661f6a32e5';