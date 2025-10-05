import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

export const EmptyState = ({ icon: Icon, title, description }: EmptyStateProps) => {
  return (
    <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-b from-background to-muted/20 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
        {Icon && (
          <div className="mb-6 p-4 rounded-full bg-gradient-hero animate-scale-in">
            <Icon className="h-10 w-10 text-white" />
          </div>
        )}
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-base text-muted-foreground max-w-md leading-relaxed">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};
