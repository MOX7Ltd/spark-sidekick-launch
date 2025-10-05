-- Storage policies for product-assets bucket
CREATE POLICY "Users can view their own product assets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'product-assets' AND
  ((storage.foldername(name))[1])::uuid IN (
    SELECT id FROM products WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Service role can insert product assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-assets' AND
  auth.role() = 'service_role'
);

CREATE POLICY "Service role can update product assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-assets' AND
  auth.role() = 'service_role'
);