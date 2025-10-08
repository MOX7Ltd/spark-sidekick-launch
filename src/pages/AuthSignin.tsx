import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { logFrontendEvent } from '@/lib/frontendEventLogger';
import { getOnboardingSessionId, clearOnboardingSession } from '@/lib/onboardingSession';
import { getSessionId } from '@/lib/telemetry';

export default function AuthSignin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    // Check if user is already signed in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/hub');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleMigration = async (userId: string) => {
    const sessionId = getOnboardingSessionId();
    
    if (!sessionId) {
      console.log('No onboarding session to migrate');
      return;
    }

    try {
      console.log('Attempting to migrate onboarding session:', sessionId);
      
      const { data, error } = await supabase.functions.invoke('migrate-onboarding-to-user', {
        body: { user_id: userId, session_id: sessionId },
      });

      if (error) throw error;

      console.log('Migration successful:', data);
      clearOnboardingSession();
      
      await logFrontendEvent({
        eventType: 'user_action',
        step: 'signin',
        payload: { action: 'migration_success', ...data },
      });
    } catch (error) {
      console.error('Migration failed:', error);
      // Don't block signin if migration fails
      toast({
        title: 'Note',
        description: 'Could not migrate your onboarding data, but you can continue',
      });
    }
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      await logFrontendEvent({
        eventType: 'user_action',
        step: 'signin',
        payload: { action: 'complete_signin' },
      });

      if (data.user) {
        await handleMigration(data.user.id);
      }

      await logFrontendEvent({
        eventType: 'user_action',
        step: 'hub',
        payload: { action: 'first_hub_view' },
      });

      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in',
      });

      navigate('/hub');
    } catch (error: any) {
      console.error('Signin error:', error);
      toast({
        title: 'Sign in failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="p-4 sm:p-6">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-24">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Welcome Back</h1>
            <p className="text-lg text-muted-foreground">
              Sign in to access your Hub
            </p>
          </div>

          <form onSubmit={handleSignin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-12 text-base"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-12 text-base"
                required
                disabled={isLoading}
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full h-12 text-base"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>

          <div className="text-center">
            <button
              onClick={() => navigate('/auth/signup')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Don't have an account? <span className="font-medium">Sign up</span>
            </button>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4 sm:hidden">
        <Button
          type="submit"
          form="signin-form"
          variant="hero"
          size="lg"
          className="w-full h-12"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </div>
    </div>
  );
}
