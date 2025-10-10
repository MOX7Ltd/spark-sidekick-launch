export function firstImageFromMedia(media: any): string | null {
  if (!media) return null;
  if (Array.isArray(media) && media.length > 0) {
    const m0 = media[0];
    if (typeof m0 === 'string') return m0;
    if (m0 && typeof m0.url === 'string') return m0.url;
  }
  return null;
}
