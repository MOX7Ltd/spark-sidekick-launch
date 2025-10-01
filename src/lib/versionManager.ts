// Version manager for cache busting preview assets
const versions = new Map<string, number>();

export function bumpVersion(key: string): number {
  const current = versions.get(key) || 0;
  const next = current + 1;
  versions.set(key, next);
  return next;
}

export function getVersion(key: string): number {
  return versions.get(key) || 0;
}

export function appendVersion(url: string, key: string): string {
  if (!url) return url;
  
  const version = getVersion(key);
  if (version === 0) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${version}`;
}

export function resetVersions(): void {
  versions.clear();
}
