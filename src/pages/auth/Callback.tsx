import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/telemetry';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'migrating' | 'error'>('processing');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('processing');

        // Try implicit flow (tokens in hash fragment)
        const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');

        if (access_token && refresh_token) {
          // Set session from hash tokens
          const { error: setError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (setError) throw setError;
        } else {
          // Fallback: try code exchange flow
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
          if (!data?.session) {
            throw new Error('Could not establish session from callback.');
          }
        }

        // Migrate anonymous onboarding data to this user
        setStatus('migrating');
        const sessionId = getSessionId();
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;
        
        if (session) {
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
        }

        toast({
          title: 'Welcome to SideHive!',
          description: 'Your account is confirmed.',
        });

        const params = new URLSearchParams(location.search);
        const next = params.get('next') || '/onboarding/final';
        navigate(next, { replace: true });
      } catch (e: any) {
        console.error('Auth callback error:', e);
        setStatus('error');
        toast({
          title: 'Confirmation failed',
          description: e?.message || 'Your link may be expired. Please sign in and request a new link.',
          variant: 'destructive',
        });
        
        setTimeout(() => {
          navigate('/auth/signin', { replace: true });
        }, 2000);
      }
    };

    handleCallback();
  }, [navigate, location, toast]);

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
