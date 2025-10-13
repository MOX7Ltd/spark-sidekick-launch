import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StarterPackCheckout } from './StarterPackCheckout';
import { ProgressBar } from './ProgressBar';
import { DebugPanel } from '@/components/debug/DebugPanel';
import { saveOnboardingSession } from '@/lib/onboardingSession';
import { supabase } from '@/integrations/supabase/client';
import type { BrandContext } from '@/types/brand';

interface FinalStepProps {
  formData: any;
  context: BrandContext;
  onCheckoutComplete: () => void;
  navigate: ReturnType<typeof useNavigate>;
  toast: any;
}

export const FinalStep = ({ formData, context, onCheckoutComplete, navigate, toast }: FinalStepProps) => {
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">Checking authentication...</div>
      </div>
    );
  }

  // If not signed in, show auth gate
  if (!session) {
    return (
      <>
        <ProgressBar currentStep={7} totalSteps={7} stepLabel="Create Account" />
        <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
          <div className="text-center mb-6 md:mb-8 space-y-3">
            <h2 className="text-2xl md:text-4xl font-bold">Create Your Account</h2>
            <p className="text-base md:text-xl text-muted-foreground px-4">
              We'll save your progress and link your shopfront. Nothing is lost.
            </p>
          </div>
          
          <div className="bg-card border-2 rounded-xl p-6 md:p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 text-primary">✓</div>
                <div>
                  <p className="font-semibold">Your work is automatically saved</p>
                  <p className="text-sm text-muted-foreground">Brand, shopfront, and posts are ready to go</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 text-primary">✓</div>
                <div>
                  <p className="font-semibold">Access from any device</p>
                  <p className="text-sm text-muted-foreground">Your data syncs across all your devices</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 text-primary">✓</div>
                <div>
                  <p className="font-semibold">Secure & private</p>
                  <p className="text-sm text-muted-foreground">We never post without your permission</p>
                </div>
              </div>
            </div>

            <Button 
              size="lg"
              variant="hero"
              onClick={async () => {
                // Save onboarding session before redirect
                await saveOnboardingSession(
                  { formData, context },
                  formData.email
                );
                navigate('/auth/signup?next=/onboarding/final');
              }}
              className="w-full h-12 md:h-14 text-base md:text-lg font-semibold"
            >
              Continue
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Already have an account? <button onClick={() => navigate('/auth/signin')} className="underline">Sign in</button>
            </p>
          </div>
        </div>
        <DebugPanel info={{ context, formData, currentStep: 7 }} />
      </>
    );
  }

  // If signed in, show Starter Pack checkout
  return (
    <>
      <ProgressBar currentStep={7} totalSteps={7} stepLabel="Starter Pack" />
      <StarterPackCheckout
        businessName={context.business_name || formData.businessIdentity?.name || 'your business'}
        onContinue={onCheckoutComplete}
      />
      <DebugPanel info={{ context, formData, currentStep: 7 }} />
    </>
  );
};
