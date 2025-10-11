-- Create orders table for sales tracking
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) NOT NULL,
  product_id UUID REFERENCES public.products(id),
  customer_email TEXT,
  quantity INTEGER DEFAULT 1,
  amount_total INTEGER NOT NULL, -- in cents
  fee_amount INTEGER, -- SideHive fee (e.g., 15%)
  currency TEXT DEFAULT 'NZD',
  status TEXT CHECK (status IN ('pending','paid','refunded','cancelled')) DEFAULT 'paid',
  payment_method TEXT DEFAULT 'test',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "Business owners can view their orders"
ON public.orders
FOR SELECT
USING (business_id IN (
  SELECT id FROM public.businesses WHERE owner_id = auth.uid()
));

CREATE POLICY "Service role can insert orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Create RPC function for sales summary
CREATE OR REPLACE FUNCTION public.sales_summary(bid UUID)
RETURNS JSON AS $$
DECLARE 
  s RECORD;
BEGIN
  SELECT
    COUNT(*) as total_orders,
    SUM(amount_total)/100.0 as gross_revenue,
    SUM(fee_amount)/100.0 as platform_fees,
    (SUM(amount_total) - SUM(fee_amount))/100.0 as net_payout
  INTO s
  FROM public.orders
  WHERE business_id = bid
  AND status = 'paid';
  
  RETURN json_build_object(
    'orders', COALESCE(s.total_orders, 0),
    'gross_revenue', COALESCE(s.gross_revenue, 0),
    'platform_fees', COALESCE(s.platform_fees, 0),
    'net_payout', COALESCE(s.net_payout, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;