// Platform taxonomy - single source of truth for Social Lab, edge functions, and migration

// Canonical UI platforms (also used in prompts/filters)
export const UI_PLATFORMS = [
  'instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'substack'
] as const;

export type UiPlatform = typeof UI_PLATFORMS[number];

// Platforms the DB currently allows in campaign_items.platform
export const DB_PLATFORMS = new Set([
  'instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'tiktok', 'pinterest'
]);

// Aliases we might receive from users/AI
const ALIAS: Record<string, string> = {
  x: 'twitter',
  ig: 'instagram',
  fb: 'facebook',
  yt: 'youtube',
  threads: 'instagram', // map to allowed
  instagram: 'instagram',
  twitter: 'twitter',
  facebook: 'facebook',
  linkedin: 'linkedin',
  youtube: 'youtube',
  tiktok: 'tiktok',
  pinterest: 'pinterest',
  substack: 'substack'
};

export function canonicalizePlatformKey(raw?: string | null): string | null {
  if (!raw) return null;
  const k = raw.toString().trim();
  const lower = k.toLowerCase();
  return ALIAS[lower] ?? ALIAS[k] ?? lower; // prefer lower alias; fall back to identity
}

// Use when reading AI → UI
export function normalizeForUi(raw?: string | null): UiPlatform | null {
  const key = canonicalizePlatformKey(raw);
  return (key && (UI_PLATFORMS as readonly string[]).includes(key)) ? (key as UiPlatform) : null;
}

// Use when writing to DB (campaign_items.platform)
export function normalizeForDb(raw?: string | null): string | null {
  const key = canonicalizePlatformKey(raw);
  return (key && DB_PLATFORMS.has(key)) ? key : null;
}

// Platform limits and icons (keep from existing socialLab.ts)
export const PLATFORM_LIMITS = {
  instagram: { captionMax: 2200, hashtagsMax: 10, ratio: '1:1 / 4:5' },
  twitter: { captionMax: 240, hashtagsMax: 3, ratio: 'landscape' },
  linkedin: { captionMax: 3000, hashtagsMax: 5, ratio: '1:1' },
  facebook: { captionMax: 2200, hashtagsMax: 5, ratio: '1:1' },
  tiktok: { captionMax: 2200, hashtagsMax: 5, ratio: '9:16', duration: '<60s' },
  youtube: { captionMax: 5000, hashtagsMax: 5, ratio: '16:9 / 9:16', duration: 'Shorts <60s' },
  pinterest: { captionMax: 500, hashtagsMax: 8, ratio: '2:3' },
  substack: { captionMax: 8000, hashtagsMax: 0, ratio: 'N/A' }
} as const;

export const PLATFORM_ICONS = {
  instagram: '📷',
  twitter: '𝕏',
  facebook: '👍',
  linkedin: '💼',
  youtube: '▶️',
  tiktok: '🎵',
  pinterest: '📌',
  substack: '✉️'
} as const;
