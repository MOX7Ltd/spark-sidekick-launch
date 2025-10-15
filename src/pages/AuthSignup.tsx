import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { logFrontendEvent } from '@/lib/frontendEventLogger';
import { getSessionId } from '@/lib/telemetry';
import { confirmByEmailRequired, isEmailConfirmError } from '@/lib/authConfirm';

export default function AuthSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  // Ensure session ID is tracked before signup
  useEffect(() => {
    getSessionId();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await logFrontendEvent({
        eventType: 'user_action',
        step: 'signup',
        payload: { action: 'start_signup' },
      });

      const next = searchParams.get('next') || '/onboarding/final';

      // DEV/PREVIEW: bypass email confirmation for faster testing
      if (!confirmByEmailRequired) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              display_name: formData.name || undefined,
            },
          },
        });

        if (signUpError) throw signUpError;

        // Auto sign-in for dev
        let session = signUpData.session;
        if (!session) {
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: formData.email,
              password: formData.password,
            });
            if (signInError) {
              // Graceful fallback: if email not confirmed, send to check-email
              if (isEmailConfirmError(signInError)) {
                toast({
                  title: 'Check your email',
                  description: 'We sent you a confirmation link.',
                });
                navigate(`/auth/check-email?email=${encodeURIComponent(formData.email)}`);
                return;
              }
              throw signInError;
            }
            session = signInData.session;
          } catch (signInError) {
            // If sign-in fails for any reason in dev mode, let it throw
            throw signInError;
          }
        }

        // Migrate onboarding data
        const sessionId = getSessionId();
        if (session && sessionId) {
          try {
            await supabase.functions.invoke('migrate-onboarding-to-user', {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
              body: { session_id: sessionId }
            });
          } catch (migrationError) {
            console.error('Migration error:', migrationError);
          }
        }

        toast({
          title: 'Account created!',
          description: 'Welcome to SideHive.',
        });

        navigate(next);
        return;
      }

      // PRODUCTION: email confirmation flow
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          data: {
            display_name: formData.name || undefined,
          },
        },
      });

      if (signUpError) throw signUpError;

      await logFrontendEvent({
        eventType: 'user_action',
        step: 'signup',
        payload: { action: 'complete_signup' },
      });

      toast({
        title: 'Check your email',
        description: 'We sent you a confirmation link.',
      });

      navigate(`/auth/check-email?email=${encodeURIComponent(formData.email)}`);
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: 'Signup failed',
        description: error.message || 'Failed to create account',
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
            <h1 className="text-4xl font-bold tracking-tight">Create Account</h1>
            <p className="text-lg text-muted-foreground">
              Join us and launch your Hub
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-12 text-base"
                disabled={isLoading}
              />
            </div>

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
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-12 text-base"
                required
                minLength={8}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                Minimum 8 characters
              </p>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full h-12 text-base"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </div>
          </form>

          <div className="text-center">
            <button
              onClick={() => navigate('/auth/signin')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Already have an account? <span className="font-medium">Sign in</span>
            </button>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4 sm:hidden">
        <Button
          type="submit"
          form="signup-form"
          variant="hero"
          size="lg"
          className="w-full h-12"
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </div>
    </div>
  );
}
