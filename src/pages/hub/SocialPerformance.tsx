import * as React from 'react';
import { FLAGS } from '@/lib/flags';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { supabase } from '@/integrations/supabase/client';
import { useSocialMetrics } from '@/hooks/social/useSocialMetrics';
import { Card } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Legend } from 'recharts';

export default function SocialPerformance() {
  if (!FLAGS.SOCIAL_V1) {
    return (
      <AppSurface>
        <BackBar to="/hub/social" label="Back to Social" />
        <div className="p-6 text-sm text-muted-foreground">Social analytics disabled.</div>
      </AppSurface>
    );
  }

  const [businessId, setBusinessId] = React.useState<string | null>(null);
  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('businesses').select('id').eq('owner_id', user.id).maybeSingle();
      setBusinessId(data?.id ?? null);
    })();
  }, []);

  const { data: posts = [] } = useSocialMetrics(businessId ?? undefined);

  const total = posts.reduce(
    (a, p) => ({
      impressions: a.impressions + p.impressions,
      clicks: a.clicks + p.clicks,
      conversions: a.conversions + p.conversions,
    }),
    { impressions: 0, clicks: 0, conversions: 0 }
  );

  const ctr = total.impressions ? (total.clicks / total.impressions) * 100 : 0;
  const convRate = total.clicks ? (total.conversions / total.clicks) * 100 : 0;

  return (
    <AppSurface>
      <BackBar to="/hub/social" label="Back to Social" />
      <div className="mt-6 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Social Performance</h1>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Impressions" value={total.impressions.toLocaleString()} />
          <StatCard label="Total Clicks" value={total.clicks.toLocaleString()} />
          <StatCard label="CTR (%)" value={ctr.toFixed(1)} />
          <StatCard label="Conversion Rate (%)" value={convRate.toFixed(1)} />
        </div>

        <Card className="p-4">
          <h2 className="mb-2 text-lg font-semibold text-foreground">Performance by Post</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={posts}>
              <XAxis dataKey="caption" hide />
              <Tooltip />
              <Legend />
              <Bar dataKey="impressions" fill="hsl(var(--chart-1))" name="Impressions" />
              <Bar dataKey="clicks" fill="hsl(var(--chart-2))" name="Clicks" />
              <Bar dataKey="conversions" fill="hsl(var(--chart-3))" name="Conversions" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {posts.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            No social posts data available yet.
          </div>
        )}
      </div>
    </AppSurface>
  );
}

function StatCard({ label, value }: { label: string; value?: string | number }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-2 p-4 text-center">
      <div className="text-2xl font-semibold text-foreground">
        {value ?? '-'}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </Card>
  );
}
