import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackBarProps {
  to: string;
  label?: string;
  className?: string;
}

export function BackBar({ to, label = "Back to Hub", className }: BackBarProps) {
  return (
    <div className={cn("sticky top-0 z-10 -mx-4 bg-white/50 backdrop-blur-sm border-b border-white/20 mb-3", className)}>
      <Link
        to={to}
        className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:text-[hsl(var(--sh-teal-600))] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <ChevronLeft className="h-4 w-4" />
        {label}
      </Link>
    </div>
  );
}
