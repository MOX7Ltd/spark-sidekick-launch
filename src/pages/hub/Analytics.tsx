import * as React from 'react';
import { FLAGS } from '@/lib/flags';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { StatCard } from '@/components/analytics/StatCard';
import { AnalyticsChart } from '@/components/analytics/AnalyticsChart';
import { useAnalyticsSummary } from '@/hooks/analytics/useAnalyticsSummary';
import { useAnalyticsTimeseries } from '@/hooks/analytics/useAnalyticsTimeseries';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, MessageSquare, Star, TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  if (!FLAGS.ANALYTICS_V1) {
    return (
      <AppSurface>
        <BackBar to="/hub" label="Back to Hub" />
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Analytics</h1>
          <p className="text-muted-foreground">Analytics are currently disabled.</p>
        </div>
      </AppSurface>
    );
  }

  const { toast } = useToast();
  const [businessId, setBusinessId] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to view analytics.",
          variant: "destructive",
        });
        return;
      }
      const { data } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      
      setBusinessId(data?.id ?? null);
    })();
  }, [toast]);

  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary(businessId ?? undefined);
  const { data: timeseries, isLoading: timeseriesLoading } = useAnalyticsTimeseries(businessId ?? undefined);

  return (
    <AppSurface>
      <BackBar to="/hub" label="Back to Hub" />
      <div className="mt-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
        
        {!businessId ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Loading...
          </div>
        ) : (
          <div className="mx-auto max-w-screen-xl space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard 
                label="Views" 
                value={summaryLoading ? '...' : summary?.views} 
                icon={<Eye size={20} />}
              />
              <StatCard 
                label="Messages" 
                value={summaryLoading ? '...' : summary?.messages} 
                icon={<MessageSquare size={20} />}
              />
              <StatCard 
                label="Reviews" 
                value={summaryLoading ? '...' : summary?.reviews} 
                icon={<TrendingUp size={20} />}
              />
              <StatCard 
                label="Avg Rating" 
                value={summaryLoading ? '...' : summary?.avg_rating?.toFixed(1)} 
                icon={<Star size={20} />}
              />
            </div>

            {/* Chart */}
            <div className="rounded-xl border bg-card p-4">
              <h2 className="mb-4 text-lg font-semibold">Activity (last 30 days)</h2>
              {timeseriesLoading ? (
                <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                  Loading chart...
                </div>
              ) : (
                <AnalyticsChart data={timeseries ?? []} />
              )}
            </div>

            {/* Tips */}
            <div className="rounded-xl border bg-muted/50 p-4 text-sm text-muted-foreground">
              <p>
                💡 <em>Tip:</em> Track how new campaigns affect views and messages. 
                A spike in "views → messages" means your shopfront CTA is working.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppSurface>
  );
}
