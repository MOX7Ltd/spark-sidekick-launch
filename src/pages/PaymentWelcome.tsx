import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AppSurface } from '@/components/layout/AppSurface';
import { FLAGS } from '@/lib/flags';

export default function PaymentWelcome() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [connectUrl, setConnectUrl] = useState<string | null>(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);

  const starterStatus = searchParams.get('starter');
  const stripeStatus = searchParams.get('stripe');
  const type = searchParams.get('type');
  const csId = searchParams.get('cs_id');

  useEffect(() => {
    if ((starterStatus === 'success' || type === 'starter') && !stripeStatus) {
      initiateConnectOnboarding();
    }
  }, [starterStatus, type, stripeStatus]);

  const initiateConnectOnboarding = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: "Authentication required",
          description: "Please sign in to continue.",
          variant: "destructive",
        });
        navigate('/auth/signin');
        return;
      }

      // Get Connect onboarding link
      const { data, error } = await supabase.functions.invoke('stripe-connect-link', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error getting Connect link:', error);
        throw error;
      }

      if (data?.onboarded) {
        setOnboardingComplete(true);
        toast({
          title: "Already onboarded",
          description: "Your Stripe account is already connected.",
        });
        return;
      }

      if (data?.url) {
        setConnectUrl(data.url);
        toast({
          title: "Payment successful!",
          description: "Complete your Stripe Connect onboarding to start accepting payments.",
        });
      }
    } catch (error) {
      console.error('Connect onboarding error:', error);
      toast({
        title: "Setup incomplete",
        description: "Unable to set up payment processing. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const openConnectOnboarding = () => {
    if (connectUrl) {
      window.open(connectUrl, '_blank');
      // Start polling for onboarding completion
      startPollingOnboarding();
    }
  };

  const startPollingOnboarding = async () => {
    setIsCheckingOnboarding(true);

    const checkCapabilities = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          return false;
        }

        const { data, error } = await supabase.functions.invoke('stripe-check-capabilities', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          console.error('Error checking capabilities:', error);
          return false;
        }

        return data?.charges_enabled === true;
      } catch (error) {
        console.error('Polling error:', error);
        return false;
      }
    };

    // Poll every 8 seconds for up to 5 minutes
    const maxAttempts = 37; // ~5 minutes
    let attempts = 0;

    const pollInterval = setInterval(async () => {
      attempts++;
      
      const isComplete = await checkCapabilities();

      if (isComplete) {
        clearInterval(pollInterval);
        setIsCheckingOnboarding(false);
        setOnboardingComplete(true);
        toast({
          title: "Onboarding complete!",
          description: "Your payment processing is now active.",
        });
      } else if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        setIsCheckingOnboarding(false);
        toast({
          title: "Still processing",
          description: "Onboarding is taking longer than expected. You can check back later.",
        });
      }
    }, 8000);
  };

  const initiateSubscription = async () => {
    setIsCreatingSubscription(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No session available');
        return;
      }

      // Call edge function to create subscription with trial
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating subscription:', error);
        // Don't block the user if subscription fails - they can do it later from billing page
        toast({
          title: "Subscription setup pending",
          description: "Visit your billing page to complete subscription setup.",
        });
        return;
      }

      console.log('Subscription initiated successfully');
      toast({
        title: "Trial activated!",
        description: "Your 14-day free trial of SideHive Pro has started.",
      });
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  const handleContinue = () => {
    navigate('/hub');
  };

  if (!FLAGS.STRIPE_PAYMENTS_V1) {
    navigate('/');
    return null;
  }

  return (
    <AppSurface>
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 space-y-6">
          {(starterStatus === 'success' || type === 'starter') && (
            <>
              <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold">Payment successful — your 14-day trial has started</h1>
                <p className="text-muted-foreground">
                  Your shopfront is ready. To receive money from sales, set up payouts with Stripe.
                </p>
              </div>

              {!onboardingComplete && connectUrl && (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold">Set up payouts to receive money from sales</h3>
                    <p className="text-sm text-muted-foreground">
                      Complete Stripe Connect onboarding. It only takes a couple of minutes.
                    </p>
                    <ol className="list-decimal ml-5 space-y-1 text-sm text-muted-foreground">
                      <li>Finish Stripe Connect onboarding (1–3 minutes)</li>
                      <li>Return here automatically</li>
                      <li>Start selling and get paid</li>
                    </ol>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={openConnectOnboarding}
                      className="flex-1"
                      size="lg"
                      disabled={isCheckingOnboarding}
                    >
                      {isCheckingOnboarding ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Waiting...
                        </>
                      ) : (
                        <>
                          Set up payouts
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleContinue}
                      variant="outline"
                      size="lg"
                    >
                      Go to my Hub
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    We never see your bank details. Stripe securely handles verification.
                  </p>

                  {isCheckingOnboarding && (
                    <p className="text-xs text-center text-muted-foreground">
                      Checking onboarding status every 8 seconds...
                    </p>
                  )}
                </div>
              )}

              {onboardingComplete && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">
                      ✅ All set! Your shopfront is ready to accept payments.
                    </p>
                  </div>

                  {!isCreatingSubscription && (
                    <>
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium mb-2">
                          🎉 Activating your 14-day free trial...
                        </p>
                        <p className="text-xs text-blue-700">
                          You'll have full access to SideHive Pro for 14 days, then $25 NZD/month.
                        </p>
                      </div>

                      <Button 
                        onClick={() => {
                          initiateSubscription();
                          setTimeout(() => handleContinue(), 2000);
                        }} 
                        className="w-full" 
                        size="lg"
                      >
                        Continue to Dashboard
                      </Button>
                    </>
                  )}

                  {isCreatingSubscription && (
                    <div className="text-center py-4">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Setting up your subscription...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {starterStatus === 'cancel' && (
            <>
              <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-yellow-600" />
                </div>
                <h1 className="text-2xl font-bold">Payment Cancelled</h1>
                <p className="text-muted-foreground">
                  You cancelled the payment. No charges were made.
                </p>
              </div>

              <div className="space-y-4">
                <Button onClick={() => navigate('/onboarding')} className="w-full" size="lg">
                  Try Again
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full"
                >
                  Back to Home
                </Button>
              </div>
            </>
          )}

          {stripeStatus === 'return' && (
            <>
              <div className="text-center space-y-2">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <h1 className="text-2xl font-bold">Completing Setup...</h1>
                <p className="text-muted-foreground">
                  Verifying your Stripe account configuration
                </p>
              </div>
            </>
          )}

          {stripeStatus === 'refresh' && (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">Setup Incomplete</h1>
                <p className="text-muted-foreground">
                  Please complete your Stripe account setup to continue
                </p>
              </div>

              <Button onClick={initiateConnectOnboarding} className="w-full" size="lg">
                Retry Setup
              </Button>
            </>
          )}
        </Card>
      </div>
    </AppSurface>
  );
}
