import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { HubTile } from '@/components/hub/HubTile';
import { AppSurface } from '@/components/layout/AppSurface';
import { HubBrandHeader } from '@/components/hub/HubBrandHeader';
import { Package, Megaphone, Users, UserCircle2, LogOut } from 'lucide-react';
import { logFrontendEvent } from '@/lib/frontendEventLogger';

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

      {/* Main content - 2x2 grid */}
      <main className="pb-24">
        <div className="grid grid-cols-2 gap-3 px-4 pt-4 max-w-2xl mx-auto">
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
      </main>

      {/* Sticky bottom logout */}
      <div className="sticky bottom-0 left-0 w-full -mx-4 mt-6 bg-gradient-to-t from-white/70 to-transparent dark:from-background/70 backdrop-blur-md p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto">
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
      </div>
    </AppSurface>
  );
}
