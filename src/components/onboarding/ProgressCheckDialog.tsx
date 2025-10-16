import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/telemetry';
import { restoreOnboardingSession } from '@/lib/onboardingSync';
import { useToast } from '@/hooks/use-toast';
import type { ProgressInfo } from '@/lib/progressDetector';

interface ProgressCheckDialogProps {
  open: boolean;
  progressInfo: ProgressInfo;
  onRestore: () => void;
  onFresh: () => void;
}

export function ProgressCheckDialog({ open, progressInfo, onRestore, onFresh }: ProgressCheckDialogProps) {
  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleEmailVerify = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email to restore progress",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const sessionId = getSessionId();
      
      // Verify email matches preauth profile
      const { data: preauth } = await supabase
        .from('preauth_profiles')
        .select('email')
        .eq('session_id', sessionId)
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (!preauth) {
        toast({
          title: "Email not found",
          description: "We couldn't find saved progress for this email. Try a different email or start fresh.",
          variant: "destructive",
        });
        setIsVerifying(false);
        return;
      }

      // Restore the session
      const result = await restoreOnboardingSession(sessionId);
      
      if (result.success) {
        toast({
          title: "Progress restored!",
          description: "Continuing where you left off",
        });
        onRestore();
      } else {
        toast({
          title: "Restore failed",
          description: result.error || "Something went wrong. Please try starting fresh.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Email verification failed:', error);
      toast({
        title: "Verification failed",
        description: "Please try again or start fresh",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSessionRestore = async () => {
    const sessionId = getSessionId();
    const result = await restoreOnboardingSession(sessionId);
    
    if (result.success) {
      toast({
        title: "Progress restored!",
        description: "Continuing where you left off",
      });
      onRestore();
    } else {
      toast({
        title: "Restore failed",
        description: "Starting fresh instead",
        variant: "destructive",
      });
      onFresh();
    }
  };

  // Email verification UI (Tier 1)
  if (progressInfo.tier === 'email') {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome back!</DialogTitle>
            <DialogDescription>
              We found saved progress. Enter your email to continue where you left off.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailVerify()}
                disabled={isVerifying}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleEmailVerify}
                disabled={isVerifying}
                className="flex-1"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Restore Progress'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onFresh}
                disabled={isVerifying}
              >
                Start Fresh
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Session-based recovery UI (Tier 2)
  if (progressInfo.tier === 'session') {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Continue where you left off?</DialogTitle>
            <DialogDescription>
              You have unsaved progress from a previous session.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {progressInfo.ideaSummary && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium mb-1">Your idea:</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {progressInfo.ideaSummary}
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={handleSessionRestore}
                className="flex-1"
              >
                Continue
              </Button>
              <Button
                variant="outline"
                onClick={onFresh}
              >
                Start Fresh
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // No progress found - dialog shouldn't be visible
  return null;
}
