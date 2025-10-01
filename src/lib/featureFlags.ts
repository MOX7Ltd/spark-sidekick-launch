import { supabase } from '@/integrations/supabase/client';

// In-memory cache for feature flags
interface FlagCache {
  flags: Record<string, boolean>;
  timestamp: number;
}

let flagCache: FlagCache | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

// Local overrides for dev mode (stored in localStorage)
const LOCAL_OVERRIDE_KEY = 'feature_flags_override';

function getLocalOverrides(): Record<string, boolean> {
  if (import.meta.env.MODE !== 'development') return {};
  
  try {
    const stored = localStorage.getItem(LOCAL_OVERRIDE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setLocalOverride(key: string, enabled: boolean) {
  if (import.meta.env.MODE !== 'development') return;
  
  const overrides = getLocalOverrides();
  overrides[key] = enabled;
  localStorage.setItem(LOCAL_OVERRIDE_KEY, JSON.stringify(overrides));
  
  // Clear cache to force refetch
  flagCache = null;
}

function clearLocalOverride(key: string) {
  if (import.meta.env.MODE !== 'development') return;
  
  const overrides = getLocalOverrides();
  delete overrides[key];
  localStorage.setItem(LOCAL_OVERRIDE_KEY, JSON.stringify(overrides));
  
  // Clear cache to force refetch
  flagCache = null;
}

async function fetchAllFlags(): Promise<Record<string, boolean>> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('key, enabled')
    .eq('enabled', true);

  if (error) {
    console.error('Failed to fetch feature flags:', error);
    return {};
  }

  const flags: Record<string, boolean> = {};
  data?.forEach(flag => {
    flags[flag.key] = flag.enabled;
  });

  return flags;
}

export async function getAllFeatureFlags(): Promise<Record<string, boolean>> {
  const now = Date.now();
  
  // Check cache
  if (flagCache && (now - flagCache.timestamp) < CACHE_TTL_MS) {
    return { ...flagCache.flags };
  }

  // Fetch from Supabase
  const flags = await fetchAllFlags();
  
  // Apply local overrides in dev mode
  const overrides = getLocalOverrides();
  const mergedFlags = { ...flags, ...overrides };
  
  // Update cache
  flagCache = {
    flags: mergedFlags,
    timestamp: now,
  };

  return { ...mergedFlags };
}

export async function getFeatureFlag(key: string): Promise<boolean> {
  const flags = await getAllFeatureFlags();
  return flags[key] ?? false;
}

export function getEnabledFlagKeys(flags: Record<string, boolean>): string[] {
  return Object.entries(flags)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key);
}

export function getFeatureFlagsHeader(flags: Record<string, boolean>): string {
  return getEnabledFlagKeys(flags).join(',');
}

// Dev mode utilities
export {
  getLocalOverrides,
  setLocalOverride,
  clearLocalOverride,
};
