import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  primaryAction?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
  };
}

export const SectionHeader = ({ title, subtitle, primaryAction }: SectionHeaderProps) => {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">{title}</h1>
          {subtitle && (
            <p className="text-sm md:text-base text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {primaryAction && (
          <Button
            variant="hero"
            size="default"
            onClick={primaryAction.onClick}
            className="gap-2 shrink-0"
          >
            {primaryAction.icon && <primaryAction.icon className="h-4 w-4" />}
            {primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};
