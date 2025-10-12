import { useEffect } from 'react';
import { MessageSquare, Star, Calendar, BarChart3, Users } from 'lucide-react';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { SubHeader } from '@/components/hub/SubHeader';
import { SubTile } from '@/components/hub/SubTile';
import { logFrontendEvent } from '@/lib/frontendEventLogger';
import { FLAGS } from '@/lib/flags';

export default function Customers() {
  useEffect(() => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'view_hub_section',
      payload: { section: 'customers' }
    });
  }, []);

  const handleTileClick = (action: string) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'open_hub_action',
      payload: { section: 'customers', action }
    });
  };

  return (
    <AppSurface>
      <BackBar to="/hub" label="Back to Hub" />
      <SubHeader
        icon={<MessageSquare className="h-5 w-5" />}
        title="Customers"
        subtitle="Connect with your audience."
      />
      <div className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <SubTile
            variant="mini"
            to="/hub/customers/messages"
            icon={<MessageSquare className="h-5 w-5" />}
            title="Messages"
            desc="Inbox & replies"
            onClick={() => handleTileClick('messages')}
          />
          <SubTile
            variant="mini"
            to="/hub/customers/reviews"
            icon={<Star className="h-5 w-5" />}
            title="Reviews"
            desc="Collect & share"
            onClick={() => handleTileClick('reviews')}
            delay={0.03}
          />
        </div>
        
        {FLAGS.CUSTOMER_INSIGHTS_V1 && (
          <SubTile
            variant="card"
            to="/hub/customers/analytics"
            icon={<Users className="h-6 w-6" />}
            title="Customer Insights"
            desc="Repeat rate, LTV & reviews"
            onClick={() => handleTileClick('customer_insights')}
            delay={0.06}
            accentBorder
          />
        )}

        {FLAGS.ANALYTICS_V1 && (
          <SubTile
            variant="card"
            to="/hub/analytics"
            icon={<BarChart3 className="h-6 w-6" />}
            title="Analytics"
            desc="Track views, messages & reviews"
            onClick={() => handleTileClick('analytics')}
            delay={FLAGS.CUSTOMER_INSIGHTS_V1 ? 0.09 : 0.06}
            accentBorder
          />
        )}
        
        <SubTile
          variant="card"
          to="/hub/customers/calendar"
          icon={<Calendar className="h-6 w-6" />}
          title="Calendar"
          desc="Bookings & events"
          onClick={() => handleTileClick('calendar')}
          delay={(FLAGS.CUSTOMER_INSIGHTS_V1 ? 0.09 : 0) + (FLAGS.ANALYTICS_V1 ? 0.09 : 0.06)}
          accentBorder
        />
      </div>
      <p className="mt-4 px-1 text-sm text-muted-foreground">
        <span className="font-medium text-[hsl(var(--sh-teal-600))]">Tip:</span> Reply fast—speed builds trust.
      </p>
    </AppSurface>
  );
}
