import { FlaskConical, Sparkles } from 'lucide-react';

interface BeakerLoaderProps {
  label?: string;
}

export function BeakerLoader({ label = "Mixing your concept..." }: BeakerLoaderProps) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-8">
      <FlaskConical className="h-4 w-4 animate-bounce" />
      <span>{label}</span>
      <Sparkles className="h-4 w-4 animate-pulse" />
    </div>
  );
}
