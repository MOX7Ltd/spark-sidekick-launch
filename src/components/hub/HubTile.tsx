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
          "rounded-2xl shadow-sm transition-all duration-200",
          "hover:shadow-md hover:scale-[1.02]",
          "active:scale-[0.99]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        )}
      >
        <Icon className="h-8 w-8 mb-3 text-primary" />
        <h3 className="font-semibold text-base mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-tight">{desc}</p>
      </Card>
    </Link>
  );
}
