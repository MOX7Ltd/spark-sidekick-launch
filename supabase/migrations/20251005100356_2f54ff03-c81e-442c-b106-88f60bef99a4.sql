-- Create storage bucket for product PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-files',
  'product-files',
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf']
);

-- RLS policies for product-files bucket
CREATE POLICY "Users can upload their own product files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own product files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view product files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-files');

-- Add pdf_url column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS pdf_url text;