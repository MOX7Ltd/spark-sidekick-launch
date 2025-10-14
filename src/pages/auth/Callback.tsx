import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/telemetry';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'migrating' | 'error'>('processing');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('processing');

        // Exchange the auth code for a session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        const session = data.session;
        if (!session) {
          throw new Error('No session found after email confirmation');
        }

        // Migrate anonymous onboarding data to this user
        setStatus('migrating');
        const sessionId = getSessionId();
        
        try {
          await supabase.functions.invoke('migrate-onboarding-to-user', {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            body: { session_id: sessionId },
          });
        } catch (migrationError) {
          console.error('Migration error:', migrationError);
          // Don't block - continue even if migration fails
        }

        toast({
          title: 'Welcome to SideHive!',
          description: 'Your account is confirmed.',
        });

        const next = searchParams.get('next') || '/onboarding/final';
        navigate(next, { replace: true });
      } catch (e: any) {
        console.error('Auth callback error:', e);
        setStatus('error');
        toast({
          title: 'Sign-in failed',
          description: e?.message ?? 'Please try signing in again.',
          variant: 'destructive',
        });
        
        setTimeout(() => {
          navigate('/auth/signin', { replace: true });
        }, 2000);
      }
    };

    handleCallback();
  }, [navigate, searchParams, toast]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          {status === 'error' ? (
            <>
              <div className="text-destructive text-lg">Something went wrong</div>
              <p className="text-sm text-muted-foreground">Redirecting to sign in...</p>
            </>
          ) : (
            <>
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <div className="text-lg">
                {status === 'processing' && 'Confirming your account...'}
                {status === 'migrating' && 'Setting up your workspace...'}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
