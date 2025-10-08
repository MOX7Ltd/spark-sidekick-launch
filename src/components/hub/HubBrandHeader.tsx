import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { logFrontendEvent } from '@/lib/frontendEventLogger';
import sidehiveLogo from '@/assets/sidehive-logo.jpg';

export function HubBrandHeader() {
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'hub_home',
      payload: { action: 'open_settings' }
    });
    navigate('/hub/settings');
  };

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img 
            src={sidehiveLogo} 
            alt="SideHive" 
            className="h-8 w-8 rounded-full object-cover"
          />
          <h1 className="text-lg font-semibold text-foreground">
            SideHive
          </h1>
        </div>

        {/* Settings button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSettingsClick}
          aria-label="Open settings"
          className="shrink-0"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
