-- Insert mock replies for existing seeded message threads using 'user' for business replies
-- Sarah Johnson (general, open)
INSERT INTO public.customer_message_replies (message_id, sender_type, sender_id, body, via, created_at) VALUES
('565f6a54-beb7-42cd-adb0-794f488634d9','customer',NULL,'Hi there! I have a quick question about your services.','in_app', now() - interval '1 day 3 hours'),
('565f6a54-beb7-42cd-adb0-794f488634d9','user',NULL,'Hi Sarah! Happy to help. What would you like to know?','in_app', now() - interval '1 day 2 hours'),
('565f6a54-beb7-42cd-adb0-794f488634d9','customer',NULL,'Do you offer weekend appointments?','in_app', now() - interval '1 day 1 hour');

-- David Lee (booking, open)
INSERT INTO public.customer_message_replies (message_id, sender_type, sender_id, body, via, created_at) VALUES
('4de5b806-acb6-49f0-9b70-785cf09bac7a','customer',NULL,'Can I book a slot for next Tuesday afternoon?','in_app', now() - interval '2 days 5 hours'),
('4de5b806-acb6-49f0-9b70-785cf09bac7a','user',NULL,'Hi David, Tuesday 2pm or 4pm are available. Which works?','in_app', now() - interval '2 days 4 hours'),
('4de5b806-acb6-49f0-9b70-785cf09bac7a','customer',NULL,'4pm works for me, thanks!','in_app', now() - interval '2 days 3 hours');

-- Lisa Martinez (other, waiting)
INSERT INTO public.customer_message_replies (message_id, sender_type, sender_id, body, via, created_at) VALUES
('a5f97e8b-3367-4ed9-b547-b81c8e8d7b78','customer',NULL,'Do you have any discounts for first-time customers?','in_app', now() - interval '14 hours'),
('a5f97e8b-3367-4ed9-b547-b81c8e8d7b78','user',NULL,'Hi Lisa, yes! Use code WELCOME10 for 10% off.','in_app', now() - interval '13 hours');

-- Mike Chen (pricing, waiting)
INSERT INTO public.customer_message_replies (message_id, sender_type, sender_id, body, via, created_at) VALUES
('980facb7-1c0c-4b28-8076-b81a1accef44','customer',NULL,'Could you share a detailed pricing breakdown?','in_app', now() - interval '1 day 6 hours');

-- Emma Wilson (shipping, closed)
INSERT INTO public.customer_message_replies (message_id, sender_type, sender_id, body, via, created_at) VALUES
('9fd7aa0f-e5e9-489a-b4e8-9d82ffc1f697','customer',NULL,'My order arrived today—thanks!','in_app', now() - interval '3 days 6 hours'),
('9fd7aa0f-e5e9-489a-b4e8-9d82ffc1f697','user',NULL,'Glad to hear, Emma! Let us know if you need anything else.','in_app', now() - interval '3 days 5 hours');