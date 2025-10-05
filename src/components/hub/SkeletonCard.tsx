import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const SkeletonCard = () => {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-10 w-full mt-4" />
      </CardContent>
    </Card>
  );
};

export const SkeletonGrid = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};
