import { supabase } from '@/integrations/supabase/client';

/**
 * Upload a file to a public storage bucket
 * @param bucket Storage bucket name (e.g., 'avatars', 'brand-assets')
 * @param path Path within the bucket (e.g., 'userId/timestamp.jpg')
 * @param file File to upload
 * @returns Public URL of the uploaded file
 */
export async function uploadPublic(
  bucket: string,
  path: string,
  file: File
): Promise<{ url: string }> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return { url: publicUrl };
}

/**
 * Generate a unique file path for user uploads
 * @param userId User ID
 * @param prefix Path prefix (e.g., 'avatars', 'logos')
 * @param file File to upload
 * @returns Unique storage path
 */
export function generateStoragePath(
  userId: string,
  prefix: string,
  file: File
): string {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop() || 'jpg';
  return `${userId}/${prefix}/${timestamp}.${extension}`;
}
