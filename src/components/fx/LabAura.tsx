export function LabAura() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <div 
        className="absolute -top-16 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl opacity-[0.06] motion-reduce:opacity-0"
        style={{ background: "radial-gradient(closest-side, hsl(var(--sh-cta-from)), transparent)" }}
      />
      <div 
        className="absolute bottom-24 right-6 h-40 w-40 rounded-full blur-2xl opacity-[0.04] motion-reduce:opacity-0"
        style={{ background: "radial-gradient(closest-side, hsl(var(--sh-cta-to)), transparent)" }}
      />
    </div>
  );
}
