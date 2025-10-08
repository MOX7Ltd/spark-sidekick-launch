import { useEffect } from 'react';
import { User, Building2, Store } from 'lucide-react';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { SubHeader } from '@/components/hub/SubHeader';
import { SubTile } from '@/components/hub/SubTile';
import { logFrontendEvent } from '@/lib/frontendEventLogger';

export default function Profile() {
  useEffect(() => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'view_hub_section',
      payload: { section: 'profile' }
    });
  }, []);

  const handleTileClick = (action: string) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'open_hub_action',
      payload: { section: 'profile', action }
    });
  };

  return (
    <AppSurface>
      <BackBar to="/hub" label="Back to Hub" />
      <SubHeader
        icon={<User className="h-5 w-5" />}
        title="Profile"
        subtitle="Manage your identity and settings."
      />
      <div className="mt-3 space-y-3">
        <SubTile
          variant="card"
          to="/hub/profile/user"
          icon={<User className="h-6 w-6" />}
          title="User Profile"
          desc="You & security"
          onClick={() => handleTileClick('user')}
          accentBorder
        />
        <SubTile
          variant="card"
          to="/hub/profile/business"
          icon={<Building2 className="h-6 w-6" />}
          title="Business Profile"
          desc="Brand details"
          onClick={() => handleTileClick('business')}
          delay={0.03}
          accentBorder
        />
        <SubTile
          variant="card"
          to="/hub/profile/shopfront"
          icon={<Store className="h-6 w-6" />}
          title="Shopfront"
          desc="Public page"
          onClick={() => handleTileClick('shopfront')}
          delay={0.06}
          accentBorder
        />
      </div>
      <p className="mt-4 px-1 text-sm text-muted-foreground">
        <span className="font-medium text-[hsl(var(--sh-teal-600))]">Tip:</span> Keep your brand fresh—update regularly.
      </p>
    </AppSurface>
  );
}
