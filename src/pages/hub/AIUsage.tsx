import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Brain, DollarSign, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AIUsage() {
  const { data: usage, isLoading } = useQuery({
    queryKey: ['ai-usage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_cost_tracking')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  const totalCost = usage?.reduce((sum, u) => sum + Number(u.cost_usd), 0) || 0;
  const totalTokens = usage?.reduce((sum, u) => sum + u.tokens_in + u.tokens_out, 0) || 0;

  // Group by function
  const byFunction = usage?.reduce((acc, u) => {
    if (!acc[u.function_name]) {
      acc[u.function_name] = { count: 0, cost: 0, tokens: 0 };
    }
    acc[u.function_name].count++;
    acc[u.function_name].cost += Number(u.cost_usd);
    acc[u.function_name].tokens += u.tokens_in + u.tokens_out;
    return acc;
  }, {} as Record<string, { count: number; cost: number; tokens: number }>);

  if (isLoading) {
    return (
      <div className="space-y-6 p-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Usage & Costs</h1>
        <p className="text-muted-foreground mt-2">
          Track your AI generation usage and associated costs
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-2xl font-bold">${totalCost.toFixed(4)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Tokens</p>
              <p className="text-2xl font-bold">{totalTokens.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Generations</p>
              <p className="text-2xl font-bold">{usage?.length || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* By Function Breakdown */}
      {byFunction && Object.keys(byFunction).length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Usage by Function</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Function</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(byFunction)
                .sort(([, a], [, b]) => b.cost - a.cost)
                .map(([name, stats]) => (
                  <TableRow key={name}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell className="text-right">{stats.count}</TableCell>
                    <TableCell className="text-right">{stats.tokens.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${stats.cost.toFixed(4)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Recent Usage */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Usage</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Function</TableHead>
              <TableHead>Model</TableHead>
              <TableHead className="text-right">Tokens</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usage && usage.length > 0 ? (
              usage.slice(0, 20).map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.function_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.model}</TableCell>
                  <TableCell className="text-right">
                    {(item.tokens_in + item.tokens_out).toLocaleString()}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({item.tokens_in}+{item.tokens_out})
                    </span>
                  </TableCell>
                  <TableCell className="text-right">${Number(item.cost_usd).toFixed(4)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No AI usage recorded yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
