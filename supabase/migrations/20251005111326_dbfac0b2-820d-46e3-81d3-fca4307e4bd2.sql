-- Add logo_url column for CDN storage URLs
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS logo_url text;

COMMENT ON COLUMN public.businesses.logo_url IS 'Public URL to logo stored in Supabase Storage (CDN-cached). Falls back to logo_svg (base64) if null.';

-- Create brand-assets storage bucket for logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets',
  'brand-assets',
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for brand-assets bucket

-- Allow authenticated users to upload their own logos
CREATE POLICY "Users can upload their own logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-assets' AND
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow anonymous users to upload during onboarding (session-based)
CREATE POLICY "Anonymous can upload onboarding logos"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'brand-assets' AND
  (storage.foldername(name))[1] = 'onboarding'
);

-- Allow public read access to all brand assets
CREATE POLICY "Public read access to brand assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'brand-assets');

-- Allow authenticated users to update their own logos
CREATE POLICY "Users can update their own logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brand-assets' AND
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to delete their own logos
CREATE POLICY "Users can delete their own logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand-assets' AND
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = auth.uid()::text
);