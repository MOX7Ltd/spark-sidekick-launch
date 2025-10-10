import { Card } from '@/components/ui/card';

export function StatCard({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value?: number | string; 
  icon?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center justify-center gap-2 p-4 text-center">
      {icon && <div className="text-primary">{icon}</div>}
      <div className="text-2xl font-semibold text-foreground">
        {value ?? 0}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </Card>
  );
}
