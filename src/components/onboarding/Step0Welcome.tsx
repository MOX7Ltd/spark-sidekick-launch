import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { restoreOnboardingSession } from '@/lib/onboardingSync';
import { clearOnboardingState } from '@/lib/telemetry';

interface Step0WelcomeProps {
  onContinue: () => void;
}

type Stage = 'initial' | 'email-input' | 'session-found' | 'no-session';

interface SavedSession {
  session_id: string;
  business_idea?: string;
  last_step?: number;
  updated_at?: string;
}

export function Step0Welcome({ onContinue }: Step0WelcomeProps) {
  const [stage, setStage] = useState<Stage>('initial');
  const [email, setEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);
  const { toast } = useToast();

  const handleNo = () => {
    // Clear any existing state and start fresh
    clearOnboardingState();
    onContinue();
  };

  const handleYes = () => {
    setStage('email-input');
  };

  const handleCheckEmail = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    try {
      // Check preauth_profiles for this email
      const { data: preauth, error } = await supabase
        .from('preauth_profiles')
        .select('session_id, last_seen_at')
        .eq('email', trimmedEmail)
        .order('last_seen_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!preauth?.session_id) {
        setStage('no-session');
        return;
      }

      // Try to get some context about their previous session
      const { data: sessionData } = await supabase
        .from('onboarding_state')
        .select('step, context')
        .eq('session_id', preauth.session_id)
        .maybeSingle();

      const context = sessionData?.context as any;
      const businessIdea = context?.idea || context?.aboutYou?.idea || 'your business';

      setSavedSession({
        session_id: preauth.session_id,
        business_idea: businessIdea,
        last_step: sessionData?.step ? parseInt(sessionData.step) : undefined,
        updated_at: preauth.last_seen_at,
      });
      setStage('session-found');
    } catch (error) {
      console.error('Error checking for saved session:', error);
      toast({
        title: "Check failed",
        description: "Unable to check for saved progress. You can start fresh.",
        variant: "destructive",
      });
      setStage('no-session');
    } finally {
      setIsChecking(false);
    }
  };

  const handleContinuePrevious = async () => {
    if (!savedSession) return;

    setIsChecking(true);
    try {
      const result = await restoreOnboardingSession(savedSession.session_id);
      
      if (result.success) {
        toast({
          title: "Progress restored!",
          description: "Continuing where you left off",
        });
        onContinue();
      } else {
        toast({
          title: "Restore failed",
          description: "We'll start fresh instead",
          variant: "destructive",
        });
        await handleStartFresh();
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      toast({
        title: "Restore failed",
        description: "We'll start fresh instead",
        variant: "destructive",
      });
      await handleStartFresh();
    } finally {
      setIsChecking(false);
    }
  };

  const handleStartFresh = async () => {
    // Clear any existing state
    clearOnboardingState();
    
    // Mark old session as abandoned if we found one
    if (savedSession?.session_id) {
      try {
        await supabase
          .from('onboarding_state')
          .update({ context: { ...{}, status: 'abandoned' } })
          .eq('session_id', savedSession.session_id);
      } catch (error) {
        console.error('Error marking session as abandoned:', error);
      }
    }
    
    onContinue();
  };

  // Initial yes/no screen
  if (stage === 'initial') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-3">
            <CardTitle className="text-2xl">Welcome to SideHive</CardTitle>
            <CardDescription className="text-base">
              Have you tried this site before?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleYes}
              variant="default"
              size="lg"
              className="w-full"
            >
              Yes, I've been here
            </Button>
            <Button
              onClick={handleNo}
              variant="outline"
              size="lg"
              className="w-full"
            >
              No, I'm new
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Email input screen
  if (stage === 'email-input') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-3">
            <CardTitle className="text-2xl">Welcome back!</CardTitle>
            <CardDescription className="text-base">
              Enter your email to check for saved progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isChecking && handleCheckEmail()}
                disabled={isChecking}
                autoFocus
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleCheckEmail}
                disabled={isChecking}
                size="lg"
                className="w-full"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check for Progress'
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStage('initial')}
                disabled={isChecking}
              >
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session found screen
  if (stage === 'session-found' && savedSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-3">
            <CardTitle className="text-2xl">Welcome back!</CardTitle>
            <CardDescription className="text-base">
              You previously started with the idea:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 border border-border">
              <p className="text-sm font-medium text-center">
                "{savedSession.business_idea}"
              </p>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              Would you like to continue where you left off or start a new one?
            </p>
            
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleContinuePrevious}
                disabled={isChecking}
                size="lg"
                variant="default"
                className="w-full"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  'Continue Previous Session'
                )}
              </Button>
              <Button
                onClick={handleStartFresh}
                disabled={isChecking}
                size="lg"
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Start Fresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No session found screen
  if (stage === 'no-session') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-3">
            <CardTitle className="text-2xl">No saved progress found</CardTitle>
            <CardDescription className="text-base">
              We couldn't find any saved progress for this email.
              Let's start your business from scratch!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={onContinue}
              size="lg"
              variant="default"
              className="w-full"
            >
              Start My Business
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => setStage('email-input')}
            >
              Try Different Email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
