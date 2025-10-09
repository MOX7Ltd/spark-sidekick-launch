// Platform constants and utilities for Social Lab

export const ALLOWED_PLATFORMS_DB = new Set([
  'instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'tiktok', 'pinterest'
]);

// Substack is UI-only; not yet in DB check
export const ALL_PLATFORMS = [
  'instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'substack'
] as const;

export type Platform = typeof ALL_PLATFORMS[number];

export function normalizePlatform(p?: string): string | null {
  const k = (p || '').toLowerCase().trim();
  const map: Record<string, string> = {
    x: 'twitter',
    ig: 'instagram',
    fb: 'facebook',
    yt: 'youtube'
  };
  const norm = map[k] ?? k;
  return ALLOWED_PLATFORMS_DB.has(norm) ? norm : null;
}

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

export type CampaignGoal = 'awareness' | 'signups' | 'sales' | 'bookings';
export type CampaignAngle = 'educational' | 'motivational' | 'behind-the-scenes' | 'testimonial' | 'offer';
export type DurationPreset = '7d' | '14d' | '30d';

export const DURATION_PRESETS = {
  '7d': { label: '1 week', days: 7, posts: [3, 5] },
  '14d': { label: '2 weeks', days: 14, posts: [6, 10] },
  '30d': { label: '30 days', days: 30, posts: [10, 20] }
} as const;
