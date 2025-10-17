import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/telemetry';
import { useToast } from '@/hooks/use-toast';
import { restoreOnboardingSession } from '@/lib/onboardingSync';

interface EmailSaveDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (email: string) => void;
  onSkip?: () => void;
  onFormDataUpdate?: (data: { aboutYou: { email: string } }) => void;
  currentIdea?: string;
}

export function EmailSaveDialog({ open, onClose, onSaved, onSkip, onFormDataUpdate, currentIdea }: EmailSaveDialogProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSessionChoice, setShowSessionChoice] = useState(false);
  const [previousSessionData, setPreviousSessionData] = useState<{
    sessionId: string;
    idea: string;
    lastSeen: string;
  } | null>(null);
  const { toast } = useToast();

  const saveEmailAndContinue = async () => {
    const sessionId = getSessionId();
    
    // Save email to preauth profile
    const { error: insertError } = await supabase
      .from('preauth_profiles')
      .upsert({ 
        email: email.toLowerCase(), 
        session_id: sessionId,
        last_seen_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      });
    
    if (insertError) {
      console.error('Failed to save pre-auth profile:', insertError);
    }
    
    // Update form data with email
    onFormDataUpdate?.({ 
      aboutYou: { email: email.toLowerCase() } 
    });
    
    toast({
      title: 'Progress saved',
      description: 'We\'ll send you a reminder to finish your setup.',
    });
    
    onSaved?.(email);
    onClose();
  };

  const handleSave = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const currentSessionId = getSessionId();
      console.log('[EmailSaveDialog] Checking for collision with email:', email, 'sessionId:', currentSessionId);
      
      // Check for existing email with different session
      const { data: existing, error: selectError } = await supabase
        .from('preauth_profiles')
        .select('session_id, last_seen_at')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (selectError) {
        console.error('[EmailSaveDialog] Failed to check for existing email:', selectError);
        toast({
          title: 'Could not verify email',
          description: 'Please try again.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      console.log('[EmailSaveDialog] Collision check result:', existing ? `Found session ${existing.session_id}` : 'No collision');
      
      if (existing && existing.session_id !== currentSessionId) {
        console.log('[EmailSaveDialog] Email collision detected - fetching previous session idea');
        
        // Fetch previous session's idea
        const { data: prevSession, error: sessionError } = await supabase
          .from('onboarding_sessions')
          .select('payload')
          .eq('session_id', existing.session_id)
          .maybeSingle();

        if (sessionError) {
          console.error('[EmailSaveDialog] Failed to fetch previous session:', sessionError);
        }
        
        const p = prevSession?.payload as any;
        const previousIdea = (
          p?.formData?.aboutBusiness?.idea ||
          p?.formData?.idea ||
          p?.context?.idea ||
          p?.context?.idea_text ||
          p?.idea_text ||
          p?.idea ||
          ''
        ).toString().trim() || '(No idea saved)';
        
        console.log('[EmailSaveDialog] Extracted previous idea:', previousIdea.substring(0, 50));
        
        console.log('[EmailSaveDialog] Showing session choice dialog');
        setShowSessionChoice(true);
        setPreviousSessionData({
          sessionId: existing.session_id,
          idea: previousIdea,
          lastSeen: existing.last_seen_at || 'Unknown'
        });
        setIsLoading(false);
        return;
      }
      
      // No conflict - proceed with save
      console.log('[EmailSaveDialog] No collision - proceeding with save');
      await saveEmailAndContinue();
    } catch (error) {
      console.error('[EmailSaveDialog] Error saving email:', error);
      toast({
        title: 'Error',
        description: 'Failed to save email. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleKeepNew = async () => {
    setIsLoading(true);
    try {
      await saveEmailAndContinue();
      setShowSessionChoice(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePrevious = async () => {
    setIsLoading(true);
    try {
      if (!previousSessionData) return;
      
      // Restore the previous session
      const result = await restoreOnboardingSession(previousSessionData.sessionId);
      
      if (result.success && result.data) {
        // Update localStorage with previous session ID
        localStorage.setItem('sidehive_session_id', previousSessionData.sessionId);
        
        // Update form data with email
        onFormDataUpdate?.({ 
          aboutYou: { email: email.toLowerCase() } 
        });
        
        toast({
          title: 'Session restored',
          description: 'Your previous session has been loaded.',
        });
        
        onSaved?.(email);
        setShowSessionChoice(false);
        onClose();
        
        // Reload the page to apply restored state
        window.location.reload();
      } else {
        toast({
          title: 'Could not restore session',
          description: 'Continuing with your new session instead.',
          variant: 'destructive',
        });
        await handleKeepNew();
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      toast({
        title: 'Could not restore session',
        description: 'Continuing with your new session instead.',
        variant: 'destructive',
      });
      await handleKeepNew();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onSkip?.();
    onClose();
  };

  return (
    <>
      <Dialog open={open && !showSessionChoice} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save your progress</DialogTitle>
            <DialogDescription>
              Enter your email so you can pick up where you left off anytime.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleSkip} disabled={isLoading}>
              Skip for now
            </Button>
            <Button onClick={handleSave} disabled={isLoading || !email}>
              {isLoading ? 'Saving...' : 'Save Progress'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSessionChoice} onOpenChange={() => setShowSessionChoice(false)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose Your Session</DialogTitle>
            <DialogDescription>
              We found an existing session with this email. Which one would you like to continue with?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="text-2xl">🆕</div>
                  <div className="font-semibold">Your New Session (current)</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Idea:</span>{' '}
                  {currentIdea ? (currentIdea.length > 100 ? currentIdea.slice(0, 100) + '...' : currentIdea) : '(Just started)'}
                </div>
                <Button onClick={handleKeepNew} disabled={isLoading} className="w-full">
                  Continue with This
                </Button>
              </div>

              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="text-2xl">📦</div>
                  <div className="font-semibold">Previous Session</div>
                </div>
                {previousSessionData && (
                  <>
                    <div className="text-xs text-muted-foreground">
                      Last seen: {new Date(previousSessionData.lastSeen).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Idea:</span>{' '}
                      {previousSessionData.idea.length > 100 
                        ? previousSessionData.idea.slice(0, 100) + '...' 
                        : previousSessionData.idea}
                    </div>
                  </>
                )}
                <Button onClick={handleRestorePrevious} disabled={isLoading} variant="secondary" className="w-full">
                  Restore This Session
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
