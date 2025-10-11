-- Insert test/mock order data for demonstration
-- This inserts 15 orders with realistic amounts and fees for the test business

WITH test_business AS (
  SELECT id FROM public.businesses WHERE owner_id = '2ee01320-d5b1-4c5c-b353-cc8c3968f52d' LIMIT 1
),
test_products AS (
  SELECT id FROM public.products WHERE business_id IN (SELECT id FROM test_business) LIMIT 3
)
INSERT INTO public.orders (business_id, product_id, customer_email, quantity, amount_total, fee_amount, status, created_at)
SELECT 
  tb.id,
  tp.id,
  'customer' || (ROW_NUMBER() OVER ())::text || '@example.com',
  (1 + (random() * 2)::int),
  (5000 + (random() * 30000)::int),
  0, -- will be updated below
  'paid',
  now() - (random() * 30 || ' days')::interval
FROM test_business tb
CROSS JOIN test_products tp
CROSS JOIN generate_series(1, 5) -- 5 orders per product = 15 total
LIMIT 15;

-- Calculate and update fee_amount (15% of amount_total)
UPDATE public.orders
SET fee_amount = (amount_total * 0.15)::int
WHERE fee_amount = 0;