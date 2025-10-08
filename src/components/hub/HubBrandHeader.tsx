import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useHubBranding, getInitials, getDeterministicGradient } from '@/hooks/useHubBranding';
import { logFrontendEvent } from '@/lib/frontendEventLogger';

export function HubBrandHeader() {
  const navigate = useNavigate();
  const { name, tagline, logoUrl, isLoading } = useHubBranding();
  const initials = getInitials(name);
  const gradient = getDeterministicGradient(name);

  const handleSettingsClick = () => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'hub_home',
      payload: { action: 'open_settings' }
    });
    navigate('/hub/settings');
  };

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Logo/Avatar */}
          <Avatar className="h-10 w-10 ring-2 ring-white/70 shadow-md shrink-0">
            {logoUrl && (
              <AvatarImage 
                src={logoUrl} 
                alt={`${name} logo`}
              />
            )}
            <AvatarFallback 
              className="font-semibold text-white"
              style={{
                background: `linear-gradient(135deg, hsl(${gradient.from}), hsl(${gradient.to}))`
              }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Business name & tagline */}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-foreground truncate">
              {name}
            </h1>
            {tagline && (
              <p className="text-xs text-muted-foreground truncate">
                {tagline}
              </p>
            )}
          </div>
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
