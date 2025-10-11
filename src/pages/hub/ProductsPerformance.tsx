import * as React from 'react';
import { FLAGS } from '@/lib/flags';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { useSalesSummary } from '@/hooks/sales/useSalesSummary';
import { useSalesTimeseries } from '@/hooks/sales/useSalesTimeseries';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { DollarSign, TrendingUp, CreditCard, Coins } from 'lucide-react';

export default function ProductsPerformance() {
  if (!FLAGS.STRIPE_V1) {
    return (
      <AppSurface>
        <BackBar to="/hub/products" label="Back to Products" />
        <div className="p-6 text-sm text-muted-foreground">
          Sales tracking not yet enabled.
        </div>
      </AppSurface>
    );
  }

  const [businessId, setBusinessId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      setBusinessId(data?.id ?? null);
    })();
  }, []);

  const { data: summary, isLoading: summaryLoading } = useSalesSummary(businessId ?? undefined);
  const { data: timeseries } = useSalesTimeseries(businessId ?? undefined);

  const dailyRevenue = React.useMemo(() => {
    if (!timeseries) return [];
    const grouped: Record<string, number> = {};
    timeseries.forEach((o) => {
      const date = o.created_at.slice(0, 10);
      grouped[date] = (grouped[date] || 0) + (o.amount_total / 100);
    });
    return Object.entries(grouped)
      .map(([date, amount]) => ({ date, amount }))
      .slice(-30); // Last 30 days
  }, [timeseries]);

  if (!businessId) {
    return (
      <AppSurface>
        <BackBar to="/hub/products" label="Back to Products" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </AppSurface>
    );
  }

  return (
    <AppSurface>
      <BackBar to="/hub/products" label="Back to Products" />
      <div className="mx-auto mt-6 max-w-screen-xl space-y-6 p-4">
        <div>
          <h1 className="text-3xl font-bold">Sales Performance</h1>
          <p className="text-muted-foreground mt-1">Track revenue, fees, and sales trends</p>
        </div>

        {summaryLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading stats...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<CreditCard className="h-5 w-5" />}
                label="Total Orders"
                value={summary?.orders?.toString() ?? '0'}
                iconColor="text-blue-500"
              />
              <StatCard
                icon={<DollarSign className="h-5 w-5" />}
                label="Gross Revenue"
                value={currency(summary?.gross_revenue)}
                iconColor="text-green-500"
              />
              <StatCard
                icon={<Coins className="h-5 w-5" />}
                label="Platform Fees"
                value={currency(summary?.platform_fees)}
                iconColor="text-orange-500"
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="Net Payout"
                value={currency(summary?.net_payout)}
                iconColor="text-purple-500"
              />
            </div>

            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Daily Revenue (Last 30 Days)</h2>
              {dailyRevenue.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No sales data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </>
        )}
      </div>
    </AppSurface>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  iconColor 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value?: string | number;
  iconColor?: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value ?? '-'}</p>
        </div>
        <div className={`rounded-lg bg-muted p-3 ${iconColor}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function currency(v?: number) {
  if (v === undefined || v === null) return '$0.00';
  return `$${v.toFixed(2)}`;
}
