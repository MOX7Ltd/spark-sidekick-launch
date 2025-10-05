-- Add asset columns to products table
ALTER TABLE products
ADD COLUMN asset_url TEXT,
ADD COLUMN asset_type TEXT,
ADD COLUMN asset_status TEXT CHECK (asset_status IN ('pending', 'ready', 'failed')),
ADD COLUMN asset_version INTEGER DEFAULT 1,
ADD COLUMN is_draft BOOLEAN DEFAULT true;

-- Create product_assets table for versioning
CREATE TABLE product_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  meta JSONB
);

-- Create index for faster queries
CREATE INDEX idx_product_assets_product_id ON product_assets(product_id);
CREATE INDEX idx_product_assets_version ON product_assets(product_id, version DESC);

-- Enable RLS on product_assets
ALTER TABLE product_assets ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_assets
CREATE POLICY "Users can view their own product assets"
ON product_assets FOR SELECT
USING (
  product_id IN (
    SELECT id FROM products WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own product assets"
ON product_assets FOR INSERT
WITH CHECK (
  product_id IN (
    SELECT id FROM products WHERE user_id = auth.uid()
  )
);

-- Create storage bucket for product assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-assets', 'product-assets', false)
ON CONFLICT (id) DO NOTHING;