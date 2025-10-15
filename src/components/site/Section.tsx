import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

/**
 * Section: Uniform section spacing helper
 * Consistent rhythm across all landing page sections
 */
export default function Section({ children, className = '', id }: SectionProps) {
  return (
    <section id={id} className={cn("py-14 md:py-18", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}
