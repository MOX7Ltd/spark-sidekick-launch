export function applyTheme(theme?: { primary?: string; accent?: string; radius?: string; density?: string }) {
  if (typeof document === 'undefined' || !theme) return;
  const r = document.documentElement;
  if (theme.primary) r.style.setProperty('--sh-primary', theme.primary);
  if (theme.accent) r.style.setProperty('--sh-accent', theme.accent);
  // radius/density can be read by Tailwind via utility classes or custom CSS if you prefer
}
