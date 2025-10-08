import { useEffect } from 'react';
import { FlaskConical, Boxes, TrendingUp } from 'lucide-react';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { SubHeader } from '@/components/hub/SubHeader';
import { SubTile } from '@/components/hub/SubTile';
import { logFrontendEvent } from '@/lib/frontendEventLogger';

export default function Products() {
  useEffect(() => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'view_hub_section',
      payload: { section: 'products' }
    });
  }, []);

  const handleTileClick = (action: string) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'open_hub_action',
      payload: { section: 'products', action }
    });
  };

  return (
    <AppSurface>
      <BackBar to="/hub" label="Back to Hub" />
      <SubHeader
        icon={<FlaskConical className="h-5 w-5" />}
        title="Products"
        subtitle="Shape offers and track what's selling."
      />
      <div className="mt-3 space-y-3">
        <SubTile
          variant="lab"
          to="/hub/products/lab"
          icon={<FlaskConical className="h-6 w-6" />}
          title="Product Lab"
          desc="Shape offers fast"
          badge="Start here"
          onClick={() => handleTileClick('lab')}
        />
        <div className="grid grid-cols-2 gap-3">
          <SubTile
            variant="mini"
            to="/hub/products/manage"
            icon={<Boxes className="h-5 w-5" />}
            title="Manage Products"
            desc="Edit & organize"
            onClick={() => handleTileClick('manage')}
            delay={0.03}
          />
          <SubTile
            variant="mini"
            to="/hub/products/performance"
            icon={<TrendingUp className="h-5 w-5" />}
            title="Sales Performance"
            desc="See what's selling"
            onClick={() => handleTileClick('performance')}
            delay={0.06}
          />
        </div>
      </div>
      <p className="mt-4 px-1 text-sm text-muted-foreground">
        <span className="font-medium text-[hsl(var(--sh-teal-600))]">Tip:</span> Publish one offer today—momentum compounds.
      </p>
    </AppSurface>
  );
}
