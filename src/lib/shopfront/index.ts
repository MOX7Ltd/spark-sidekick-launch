/**
 * Get the public URL for a shopfront by handle
 */
export function getShopfrontUrl(handle?: string | null): string | null {
  if (!handle) return null;
  
  const baseUrl = window.location.origin;
  return `${baseUrl}/s/${handle}`;
}
