import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SubHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  className?: string;
}

export function SubHeader({ icon, title, subtitle, className }: SubHeaderProps) {
  return (
    <div className={cn("sticky top-[57px] z-10 -mx-4 bg-white/50 backdrop-blur-sm border-b border-white/20 px-4 py-4 mb-4", className)}>
      <div className="flex items-start gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--sh-teal-500))] to-[hsl(var(--sh-orange-500))] text-white">
          {icon}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
