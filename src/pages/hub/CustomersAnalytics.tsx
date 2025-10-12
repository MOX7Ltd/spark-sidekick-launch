import * as React from 'react';
import { FLAGS } from '@/lib/flags';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Users, Repeat, DollarSign, Star, TrendingUp } from 'lucide-react';
import { CustomerDetailDrawer } from '@/components/customers/CustomerDetailDrawer';

export default function CustomersAnalytics() {
  if (!FLAGS.CUSTOMER_INSIGHTS_V1) {
    return (
      <AppSurface>
        <BackBar to="/hub/customers" label="Back to Customers" />
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Customer Insights</h1>
          <p className="text-muted-foreground">Customer insights are currently disabled.</p>
        </div>
      </AppSurface>
    );
  }

  const { toast } = useToast();
  const [businessId, setBusinessId] = React.useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to view customer insights.",
          variant: "destructive",
        });
        return;
      }
      const { data } = await supabase.from('businesses').select('id').eq('owner_id', user.id).maybeSingle();
      setBusinessId(data?.id ?? null);
    })();
  }, [toast]);

  const { data, isLoading } = useQuery({
    queryKey: ['customerInsights', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      
      const res = await supabase.functions.invoke('get-customer-insights', {
        body: { business_id: businessId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (res.error) throw res.error;
      return res.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const summary = data?.summary || {
    first_time_customers: 0,
    repeat_customers: 0,
    avg_ltv: 0,
    avg_rating: 0,
    total_revenue: 0,
    total_customers: 0,
  };

  // Prepare chart data - top 10 customers by spend
  const topCustomers = React.useMemo(() => {
    if (!data?.customers) return [];
    return [...data.customers]
      .sort((a: any, b: any) => b.total_spend - a.total_spend)
      .slice(0, 10)
      .map((c: any) => ({
        email: c.customer_email?.split('@')[0] || 'Unknown',
        fullEmail: c.customer_email,
        spend: Number(c.total_spend || 0),
        orders: Number(c.total_orders || 0),
        rating: Number(c.avg_rating || 0),
      }));
  }, [data]);

  const handleCustomerClick = (email: string) => {
    setSelectedCustomer(email);
    setDrawerOpen(true);
  };

  return (
    <AppSurface>
      <BackBar to="/hub/customers" label="Back to Customers" />
      <div className="mt-6 px-4 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Customer Insights</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Understand your customer behavior and lifetime value
          </p>
        </div>

        {!businessId || isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-12">
            Loading insights...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{summary.total_customers}</div>
                  <div className="text-xs text-muted-foreground">Total Customers</div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <Users className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{summary.first_time_customers}</div>
                  <div className="text-xs text-muted-foreground">First-time</div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <Repeat className="h-5 w-5 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">{summary.repeat_customers}</div>
                  <div className="text-xs text-muted-foreground">Repeat</div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-5 w-5 mx-auto mb-2 text-emerald-500" />
                  <div className="text-2xl font-bold">${summary.avg_ltv?.toFixed(2) || "0.00"}</div>
                  <div className="text-xs text-muted-foreground">Avg LTV</div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <Star className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
                  <div className="text-2xl font-bold">{summary.avg_rating?.toFixed(1) || "0.0"}</div>
                  <div className="text-xs text-muted-foreground">Avg Rating</div>
                </CardContent>
              </Card>
            </div>

            {/* Key Metrics */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Customer Behavior
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Repeat Rate</div>
                    <div className="text-3xl font-bold">
                      {summary.total_customers > 0
                        ? ((summary.repeat_customers / summary.total_customers) * 100).toFixed(1)
                        : "0"}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {summary.repeat_customers} of {summary.total_customers} customers returned
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
                    <div className="text-3xl font-bold">${summary.total_revenue?.toFixed(2) || "0.00"}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      From all customer purchases
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Review Correlation</div>
                    <div className="text-3xl font-bold">
                      {summary.avg_rating > 4.0 ? "🔥 Strong" : summary.avg_rating > 3.0 ? "✅ Good" : "📈 Growing"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {summary.avg_rating?.toFixed(1)} avg rating from customers
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Customers Chart */}
            {topCustomers.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Top Customers by Spend</CardTitle>
                  <p className="text-sm text-muted-foreground">Click any bar to view customer details</p>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={topCustomers}
                        onClick={(e) => {
                          if (e?.activePayload?.[0]?.payload?.fullEmail) {
                            handleCustomerClick(e.activePayload[0].payload.fullEmail);
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="email" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80}
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '0.5rem',
                          }}
                          cursor={{ fill: 'hsl(var(--muted))' }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="spend" 
                          fill="hsl(var(--primary))" 
                          name="Total Spend ($)"
                          cursor="pointer"
                        />
                        <Bar 
                          dataKey="orders" 
                          fill="hsl(var(--sh-teal-500))" 
                          name="Orders"
                          cursor="pointer"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {topCustomers.length === 0 && (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No customer data yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Customer insights will appear here once you have completed orders.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Customer Detail Drawer */}
        <CustomerDetailDrawer
          businessId={businessId || ''}
          customerEmail={selectedCustomer}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedCustomer(null);
          }}
        />
      </div>
    </AppSurface>
  );
}
