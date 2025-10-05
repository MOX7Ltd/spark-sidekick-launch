import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const ReEngagementBanner = () => {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkActivity();
  }, []);

  const checkActivity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if banner was dismissed recently
      const dismissedKey = `reengagement_dismissed_${user.id}`;
      const dismissedAt = localStorage.getItem(dismissedKey);
      
      if (dismissedAt) {
        const hoursSinceDismiss = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
        if (hoursSinceDismiss < 24) {
          return; // Don't show if dismissed within last 24h
        }
      }

      // Check last activity
      const { data: profile } = await supabase
        .from('profiles')
        .select('last_active_at')
        .eq('user_id', user.id)
        .single();

      if (profile?.last_active_at) {
        const hoursSinceActive = (Date.now() - new Date(profile.last_active_at).getTime()) / (1000 * 60 * 60);
        
        // Show banner if inactive for 72+ hours
        if (hoursSinceActive >= 72) {
          setShow(true);
        }
      }
    } catch (error) {
      console.error('Error checking activity:', error);
    }
  };

  const handleDismiss = async () => {
    setDismissed(true);
    setShow(false);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.setItem(`reengagement_dismissed_${user.id}`, Date.now().toString());
    }
  };

  const handleAction = (path: string) => {
    handleDismiss();
    navigate(path);
  };

  if (!show || dismissed) return null;

  return (
    <Alert className="relative border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent animate-fade-in">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      
      <Zap className="h-5 w-5 text-primary" />
      <AlertTitle className="font-semibold text-lg">
        Your customers might be missing you! 👋
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>
          It's been a few days since your last update. Generate a fresh post or polish your shopfront to keep the momentum going!
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="hero"
            size="sm"
            onClick={() => handleAction('/hub/marketing')}
          >
            🚀 Create New Campaign
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('/hub/profile')}
          >
            ✨ Update Profile
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
