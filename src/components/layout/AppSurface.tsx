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
    <div 
      className={cn("min-h-screen", className)}
      style={{ background: "var(--sh-bg-gradient)" }}
    >
      <div className="mx-auto w-full max-w-screen-sm px-4 pb-[calc(72px+env(safe-area-inset-bottom))] pt-3">
        {children}
      </div>
    </div>
  );
}
