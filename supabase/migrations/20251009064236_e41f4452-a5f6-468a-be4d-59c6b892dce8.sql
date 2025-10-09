-- Add status and meta columns to campaign_items for Manage Posts v1.0
-- status: draft|ready|scheduled|posted
-- meta: store media_assets, revisions, deleted_at, etc.

ALTER TABLE campaign_items 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'scheduled', 'posted'));

ALTER TABLE campaign_items 
ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}'::jsonb;

-- Add storage bucket for campaign media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('campaign-media', 'campaign-media', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for campaign-media bucket
CREATE POLICY "Users can view their own campaign media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'campaign-media' 
  AND (storage.foldername(name))[1] IN (
    SELECT auth.uid()::text
  )
);

CREATE POLICY "Users can upload their own campaign media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'campaign-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own campaign media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'campaign-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own campaign media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'campaign-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);