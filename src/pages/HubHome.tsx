import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { HubTile } from '@/components/hub/HubTile';
import { Package, Megaphone, Users, UserCircle2, Settings, LogOut } from 'lucide-react';
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

  const handleSettingsClick = () => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'hub_home',
      payload: { action: 'open_settings' }
    });
    navigate('/hub/settings');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">SideHive Hub</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSettingsClick}
            aria-label="Open settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

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
      <div className="sticky bottom-0 left-0 w-full p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-background via-background">
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
  );
}
