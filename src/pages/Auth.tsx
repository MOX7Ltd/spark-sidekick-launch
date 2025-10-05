import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { claimOnboardingData } from '@/lib/onboardingStorage';
import { Loader2 } from 'lucide-react';

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function Auth() {
  const navigate = useNavigate();
  const query = useQuery();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const next = query.get('next') || '/hub/dashboard';
  const claimSession = query.get('claimSession') || localStorage.getItem('pending_claim_session');

  const handlePostAuth = async (userId: string) => {
    try {
      if (claimSession) {
        const result = await claimOnboardingData(userId);
        localStorage.removeItem('pending_claim_session');
        
        if (result.success && result.claimed) {
          toast({
            title: "Welcome to SideHive! 🎉",
            description: `Successfully claimed your business with ${result.claimed.products} products and ${result.claimed.campaigns} campaigns`,
          });
        }
      }
    } catch (e) {
      console.error('Claim failed:', e);
      // Non-blocking - still allow user to proceed
    } finally {
      navigate(next);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (error) throw error;

        // Check if email confirmation is required
        if (data.user && !data.session) {
          toast({
            title: "Check your email",
            description: "We've sent you a confirmation link. Please check your email to complete registration.",
          });
          return;
        }

        if (data.user && data.session) {
          // User is auto-confirmed, handle post-auth and claim
          await handlePostAuth(data.user.id);
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data.user) {
          await handlePostAuth(data.user.id);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: isSignUp ? "Sign up failed" : "Sign in failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp 
              ? '🎉 Your business is ready! Create an account to claim it and enter your Hub.' 
              : 'Welcome back — sign in to access your Hub.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
              {isSignUp && (
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters
                </p>
              )}
            </div>
      <Button
        type="submit"
        variant="hero"
        className="w-full"
        disabled={isLoading}
      >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'Create account' : 'Sign in'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline"
              disabled={isLoading}
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}