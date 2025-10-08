import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AppSurfaceProps {
  children: ReactNode;
  className?: string;
}

/**
 * AppSurface: Reusable gradient background matching onboarding
 */
export function AppSurface({ children, className }: AppSurfaceProps) {
  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5",
      className
    )}>
      {children}
    </div>
  );
}
