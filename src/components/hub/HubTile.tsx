import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HubTileProps {
  to: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  onClick?: () => void;
}

export function HubTile({ to, icon: Icon, title, desc, onClick }: HubTileProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      aria-label={`Open ${title}`}
      className="block"
    >
      <Card
        className={cn(
          "p-4 h-full min-h-[140px] flex flex-col items-center justify-center text-center",
          "rounded-2xl backdrop-blur-md bg-white/75 dark:bg-card/75",
          "border border-white/30 dark:border-white/10 shadow-lg",
          "transition-all duration-200",
          "hover:shadow-xl hover:scale-[1.02]",
          "active:scale-[0.99]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        )}
      >
        <div 
          className="h-8 w-8 mb-3"
          style={{
            background: `linear-gradient(135deg, hsl(var(--sh-teal-600)), hsl(var(--sh-orange-600)))`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          <Icon className="h-full w-full" />
        </div>
        <h3 className="font-semibold text-base mb-1 text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-tight">{desc}</p>
      </Card>
    </Link>
  );
}
