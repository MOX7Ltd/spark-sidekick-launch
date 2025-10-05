import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

export const EmptyState = ({ icon: Icon, title, description }: EmptyStateProps) => {
  return (
    <Card className="border-2 border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
        {Icon && (
          <div className="mb-4 p-3 rounded-full bg-muted">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};
