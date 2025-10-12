import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { HubTile } from '@/components/hub/HubTile';
import { AppSurface } from '@/components/layout/AppSurface';
import { HubBrandHeader } from '@/components/hub/HubBrandHeader';
import HubBrandStrip from '@/components/hub/HubBrandStrip';
import { Package, Megaphone, Users, UserCircle2, LogOut, BarChart3, CreditCard } from 'lucide-react';
import { logFrontendEvent } from '@/lib/frontendEventLogger';
import { FLAGS } from '@/lib/flags';

export default function HubHome() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/signin');
      }
    };
    checkAuth();
    
    // Analytics
    logFrontendEvent({
      eventType: 'user_action',
      step: 'hub_home',
      payload: { action: 'view_hub_home' }
    });
  }, [navigate]);

  const handleLogout = async () => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'hub_home',
      payload: { action: 'logout' }
    });
    
    try {
      await supabase.auth.signOut();
    } finally {
      navigate('/');
    }
  };

  const handleTileClick = (section: string) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'hub_home',
      payload: { action: 'open_hub_section', section }
    });
  };

  return (
    <AppSurface>
      <HubBrandHeader />
      
      <HubBrandStrip />

      {/* Main content - 2x2 grid */}
      <main className="pb-6">
        <div className="grid grid-cols-2 gap-3">
          <HubTile
            to="/hub/products"
            icon={Package}
            title="Products"
            desc="Create & manage offers."
            onClick={() => handleTileClick('products')}
          />
          <HubTile
            to="/hub/social"
            icon={Megaphone}
            title="Social Media"
            desc="Plan & publish campaigns."
            onClick={() => handleTileClick('social')}
          />
          <HubTile
            to="/hub/customers"
            icon={Users}
            title="Customers"
            desc="Messages, reviews, calendar."
            onClick={() => handleTileClick('customers')}
          />
          <HubTile
            to="/hub/profile"
            icon={UserCircle2}
            title="Profile"
            desc="Your details & shopfront."
            onClick={() => handleTileClick('profile')}
          />
        </div>

        {/* Analytics link (when enabled) */}
        {FLAGS.ANALYTICS_V1 && (
          <div className="mt-3">
            <HubTile
              to="/hub/analytics"
              icon={BarChart3}
              title="Analytics"
              desc="Track performance & engagement."
              onClick={() => handleTileClick('analytics')}
            />
          </div>
        )}

        {/* Billing link (when Stripe enabled) */}
        {FLAGS.STRIPE_PAYMENTS_V1 && (
          <div className="mt-3">
            <HubTile
              to="/hub/billing"
              icon={CreditCard}
              title="Billing"
              desc="Subscription & payment details."
              onClick={() => handleTileClick('billing')}
            />
          </div>
        )}

        {/* Momentum tip */}
        <p className="mt-4 px-1 text-sm leading-relaxed">
          <span className="font-medium" style={{ color: `hsl(var(--sh-teal-600))` }}>Tip:</span>{' '}
          Publish one post today—small steps compound into real revenue.
        </p>
      </main>

      {/* Sticky bottom logout */}
      <div 
        className="sticky bottom-0 left-0 right-0 -mx-4 mt-6 backdrop-blur-md p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        style={{ background: "linear-gradient(to top, rgba(255,255,255,0.85), rgba(255,255,255,0))" }}
      >
        <Button
          variant="ghost"
          className="w-full"
          onClick={handleLogout}
          aria-label="Log out"
        >
          <LogOut className="mr-2 h-5 w-5" />
          Log out
        </Button>
      </div>
    </AppSurface>
  );
}
