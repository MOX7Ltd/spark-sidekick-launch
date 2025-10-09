// Per-platform content rules and validation helpers for Manage Posts

export const PLATFORM_RULES = {
  twitter: { captionMax: 240, hashtagsMax: 3 },
  instagram: { captionMax: 2200, hashtagsMax: 10 },
  linkedin: { captionMax: 3000, hashtagsMax: 8 },
  facebook: { captionMax: 2200, hashtagsMax: 8 },
  tiktok: { captionMax: 2200, hashtagsMax: 8 },
  youtube: { captionMax: 5000, hashtagsMax: 8 },
  pinterest: { captionMax: 500, hashtagsMax: 8 },
  substack: { captionMax: 5000, hashtagsMax: 8 }
} as const;

export type PlatformKey = keyof typeof PLATFORM_RULES;

export interface PostContent {
  hook: string;
  caption: string;
  hashtags: string[];
}

export interface EnforceLimitsResult {
  hook: string;
  caption: string;
  hashtags: string[];
  truncated: boolean;
}

export function enforceLimits(
  platform: string,
  content: PostContent
): EnforceLimitsResult {
  const rules = PLATFORM_RULES[platform as PlatformKey];
  if (!rules) {
    return { ...content, truncated: false };
  }

  let truncated = false;
  let { hook, caption, hashtags } = content;

  // Enforce caption max
  if (caption.length > rules.captionMax) {
    caption = caption.slice(0, rules.captionMax);
    truncated = true;
  }

  // Enforce hashtags max
  if (hashtags.length > rules.hashtagsMax) {
    hashtags = hashtags.slice(0, rules.hashtagsMax);
    truncated = true;
  }

  return { hook, caption, hashtags, truncated };
}

export function getCharCount(platform: string, caption: string): {
  current: number;
  max: number;
  percent: number;
} {
  const rules = PLATFORM_RULES[platform as PlatformKey];
  if (!rules) {
    return { current: caption.length, max: 5000, percent: 0 };
  }

  const current = caption.length;
  const max = rules.captionMax;
  const percent = Math.round((current / max) * 100);

  return { current, max, percent };
}

export function getHashtagCount(platform: string, hashtags: string[]): {
  current: number;
  max: number;
  isOver: boolean;
} {
  const rules = PLATFORM_RULES[platform as PlatformKey];
  if (!rules) {
    return { current: hashtags.length, max: 8, isOver: false };
  }

  const current = hashtags.length;
  const max = rules.hashtagsMax;
  const isOver = current > max;

  return { current, max, isOver };
}
