import { useEffect } from 'react';
import { FlaskConical, Megaphone, BarChart3 } from 'lucide-react';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { SubHeader } from '@/components/hub/SubHeader';
import { SubTile } from '@/components/hub/SubTile';
import { logFrontendEvent } from '@/lib/frontendEventLogger';

export default function Social() {
  useEffect(() => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'view_hub_section',
      payload: { section: 'social' }
    });
  }, []);

  const handleTileClick = (action: string) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'open_hub_action',
      payload: { section: 'social', action }
    });
  };

  return (
    <AppSurface>
      <BackBar to="/hub" label="Back to Hub" />
      <SubHeader
        icon={<Megaphone className="h-5 w-5" />}
        title="Social Media"
        subtitle="Create content and track reach."
      />
      <div className="mt-3 space-y-3">
        <SubTile
          variant="lab"
          to="/hub/social/lab"
          icon={<FlaskConical className="h-6 w-6" />}
          title="Social Lab"
          desc="Create & schedule"
          badge="Start here"
          onClick={() => handleTileClick('lab')}
        />
        <SubTile
          variant="card"
          to="/hub/social/manage"
          icon={<Megaphone className="h-6 w-6" />}
          title="Manage Posts"
          desc="Edit posts"
          onClick={() => handleTileClick('manage')}
          delay={0.05}
        />
        <SubTile
          variant="card"
          to="/hub/social/performance"
          icon={<BarChart3 className="h-6 w-6" />}
          title="Performance"
          desc="Reach & clicks"
          onClick={() => handleTileClick('performance')}
          delay={0.08}
        />
      </div>
      <p className="mt-4 px-1 text-sm text-muted-foreground">
        <span className="font-medium text-[hsl(var(--sh-teal-600))]">Tip:</span> Consistency beats perfection—post today.
      </p>
    </AppSurface>
  );
}
