import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HubTileProps {
  to: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  variant?: 'cta' | 'card';
  onClick?: () => void;
}

export function HubTile({ to, icon: Icon, title, desc, variant = 'cta', onClick }: HubTileProps) {
  const baseClasses = cn(
    "block p-4 min-h-[140px] rounded-2xl",
    "transition-all duration-200",
    "active:scale-[0.99]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
  );

  const ctaClasses = cn(
    "bg-gradient-to-br from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))]",
    "text-white shadow-lg hover:brightness-105"
  );

  const cardClasses = cn(
    "backdrop-blur-md bg-white/75 dark:bg-card/75",
    "border border-white/30 dark:border-white/10",
    "shadow-lg hover:shadow-xl hover:scale-[1.02]"
  );

  return (
    <Link
      to={to}
      onClick={onClick}
      aria-label={`Open ${title}`}
      className={cn(
        baseClasses,
        variant === 'cta' ? ctaClasses : cardClasses
      )}
    >
      <div className="flex flex-col items-center justify-center text-center h-full">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className={cn(
          "font-semibold text-base mb-1",
          variant === 'cta' ? 'text-white' : 'text-foreground'
        )}>
          {title}
        </h3>
        <p className={cn(
          "text-sm leading-tight",
          variant === 'cta' ? 'text-white/90' : 'text-muted-foreground'
        )}>
          {desc}
        </p>
      </div>
    </Link>
  );
}
