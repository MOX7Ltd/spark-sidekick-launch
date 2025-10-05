-- Add session_id columns to existing tables for anonymous ownership during onboarding
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS session_id text;

-- Create products table for storing product ideas
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  format text,
  price numeric,
  visible boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add session_id to campaigns (already has business_id)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS session_id text;

-- Create indexes for efficient session lookups
CREATE INDEX IF NOT EXISTS idx_businesses_session ON businesses(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_session ON products(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_session ON campaigns(session_id) WHERE session_id IS NOT NULL;

-- Enable RLS on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS policies for products
CREATE POLICY "Users can view their own products"
  ON products FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own products"
  ON products FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own products"
  ON products FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own products"
  ON products FOR DELETE
  USING (user_id = auth.uid());

-- Anonymous users can insert products with session_id during onboarding
CREATE POLICY "Anonymous users can insert with session_id"
  ON products FOR INSERT
  WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

-- Service role can claim products (used by claim-onboarding function)
CREATE POLICY "Service role can update products"
  ON products FOR UPDATE
  USING (auth.role() = 'service_role');

-- Update businesses RLS to allow anonymous creation with session_id
CREATE POLICY "Anonymous users can create businesses with session_id"
  ON businesses FOR INSERT
  WITH CHECK (owner_id IS NULL AND session_id IS NOT NULL);

CREATE POLICY "Service role can update businesses"
  ON businesses FOR UPDATE
  USING (auth.role() = 'service_role');

-- Update campaigns RLS to allow anonymous creation
CREATE POLICY "Anonymous users can create campaigns with session_id"
  ON campaigns FOR INSERT
  WITH CHECK (session_id IS NOT NULL);

CREATE POLICY "Service role can update campaigns"
  ON campaigns FOR UPDATE
  USING (auth.role() = 'service_role');