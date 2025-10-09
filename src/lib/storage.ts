import { supabase } from '@/integrations/supabase/client';

/**
 * Generate a unique storage path for user uploads
 */
export function generateStoragePath(userId: string, folder: string, filename: string): string {
  const timestamp = Date.now();
  const ext = filename.split('.').pop();
  return `${userId}/${folder}/${timestamp}.${ext}`;
}

/**
 * Upload a file to a public Supabase storage bucket and return its public URL
 */
export async function uploadPublic(
  bucket: string,
  path: string,
  file: File
): Promise<{ url: string; error?: string }> {
  try {
    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { url: '', error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { url: publicUrl };
  } catch (error) {
    console.error('Upload failed:', error);
    return { url: '', error: String(error) };
  }
}
