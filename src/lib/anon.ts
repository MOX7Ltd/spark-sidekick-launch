const STORAGE_KEY = 'sh_anon_id';

export function getAnonId(): string {
  if (typeof window === 'undefined') return 'server-anon';
  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto?.randomUUID?.() ?? `anon_${Math.random().toString(36).slice(2)}`;
    try { window.localStorage.setItem(STORAGE_KEY, id); } catch {}
  }
  return id;
}
