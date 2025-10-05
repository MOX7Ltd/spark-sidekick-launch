import { Sparkles } from 'lucide-react';

interface MicroGuidanceProps {
  text: string;
}

export const MicroGuidance = ({ text }: MicroGuidanceProps) => {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gradient-to-r from-primary/5 to-transparent px-4 py-3 rounded-lg border-l-2 border-primary animate-fade-in">
      <Sparkles className="h-4 w-4 text-primary shrink-0" />
      <p className="leading-relaxed">{text}</p>
    </div>
  );
};
