import { supabase } from '@/integrations/supabase/client';

/**
 * Upload a base64-encoded logo to Supabase Storage
 * Supports anonymous onboarding (session-based) and authenticated users
 */
export async function uploadBase64Logo({
  base64,
  sessionId,
  userId,
  filenameBase = 'logo',
  ext = 'png',
}: {
  base64: string;
  sessionId?: string;
  userId?: string;
  filenameBase?: string;
  ext?: 'png' | 'webp' | 'svg' | 'jpg';
}): Promise<string> {
  // Convert base64 to Uint8Array
  const bytes = base64ToUint8Array(base64);
  
  // Determine storage path based on user status
  const idPart = userId ? `users/${userId}` : `onboarding/${sessionId}`;
  const name = `${filenameBase}-${crypto.randomUUID()}.${ext}`;
  const path = `${idPart}/logos/${name}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('brand-assets')
    .upload(path, bytes, {
      contentType: ext === 'svg' ? 'image/svg+xml' : `image/${ext}`,
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw new Error(`Failed to upload logo: ${uploadError.message}`);
  }

  // Get public URL (CDN-cached)
  const { data } = supabase.storage
    .from('brand-assets')
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Convert base64 string to Uint8Array for upload
 */
function base64ToUint8Array(b64: string): Uint8Array {
  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  const comma = b64.indexOf(',');
  const raw = atob(comma >= 0 ? b64.slice(comma + 1) : b64);
  
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    arr[i] = raw.charCodeAt(i);
  }
  
  return arr;
}

/**
 * Move logo files from session folder to user folder during claim
 * Returns the new public URL if successful
 */
export async function moveLogoToUserFolder(
  sessionId: string,
  userId: string
): Promise<string | null> {
  try {
    // List files in the onboarding session folder
    const { data: files, error: listError } = await supabase.storage
      .from('brand-assets')
      .list(`onboarding/${sessionId}/logos`);

    if (listError || !files || files.length === 0) {
      console.warn('No logos to move for session:', sessionId);
      return null;
    }

    // Move the first logo file (there should only be one per session)
    const file = files[0];
    const fromPath = `onboarding/${sessionId}/logos/${file.name}`;
    const toPath = `users/${userId}/logos/${file.name}`;

    // Copy file to new location
    const { error: copyError } = await supabase.storage
      .from('brand-assets')
      .copy(fromPath, toPath);

    if (copyError) {
      console.error('Copy error:', copyError);
      throw copyError;
    }

    // Delete old file
    const { error: deleteError } = await supabase.storage
      .from('brand-assets')
      .remove([fromPath]);

    if (deleteError) {
      console.warn('Delete error (non-critical):', deleteError);
    }

    // Return new public URL
    const { data } = supabase.storage
      .from('brand-assets')
      .getPublicUrl(toPath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error moving logo:', error);
    return null;
  }
}
