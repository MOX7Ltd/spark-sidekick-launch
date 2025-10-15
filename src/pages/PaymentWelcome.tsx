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
  const [hasStarterPaid, setHasStarterPaid] = useState<boolean | null>(null);
  const [isResumingPayment, setIsResumingPayment] = useState(false);

  const starterStatus = searchParams.get('starter');
  const stripeStatus = searchParams.get('stripe');
  const type = searchParams.get('type');
  const csId = searchParams.get('cs_id');

  useEffect(() => {
    checkPaymentStatus();
  }, []);

  useEffect(() => {
    if ((starterStatus === 'success' || (type === 'starter' && hasStarterPaid)) && !stripeStatus) {
      initiateConnectOnboarding();
    }
  }, [starterStatus, type, stripeStatus, hasStarterPaid]);

  const checkPaymentStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/signin');
        return;
      }

      // Check if user has paid for starter pack
      const { data: businesses } = await supabase
        .from('businesses')
        .select('starter_paid')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const paid = businesses?.[0]?.starter_paid || false;
      setHasStarterPaid(paid);

      // If checkout session present but not yet paid, start polling for webhook
      if (!paid && type === 'starter' && csId) {
        startPollingPaymentStatus();
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const startPollingPaymentStatus = async () => {
    const maxAttempts = 20; // 2 minutes total
    let attempts = 0;

    const pollInterval = setInterval(async () => {
      attempts++;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          clearInterval(pollInterval);
          return;
        }

        const { data: businesses } = await supabase
          .from('businesses')
          .select('starter_paid')
          .eq('owner_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const paid = businesses?.[0]?.starter_paid || false;

        if (paid) {
          clearInterval(pollInterval);
          setHasStarterPaid(true);
          toast({
            title: "Payment confirmed!",
            description: "Your Starter Pack is now active.",
          });
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          toast({
            title: "Payment processing",
            description: "This is taking longer than expected. Please refresh the page.",
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(pollInterval);
      }
    }, 6000); // Poll every 6 seconds
  };

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

  const handleResumePayment = async () => {
    setIsResumingPayment(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Please sign in",
          variant: "destructive"
        });
        navigate('/auth/signin');
        return;
      }

      const sessionId = localStorage.getItem('session_id') || '';
      const response = await supabase.functions.invoke('create-starter-session', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'X-Session-Id': sessionId,
        },
        body: {
          session_id: sessionId,
          flow: 'starter_pack'
        }
      });

      if (response.error) throw response.error;
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Resume payment error:', error);
      toast({
        title: "Couldn't resume payment",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsResumingPayment(false);
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
        <Card className="max-w-2xl w-full">
          <div className="p-8 space-y-6">
            {/* Payment Processing State */}
            {type === 'starter' && hasStarterPaid === false && csId && (
              <>
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold">
                    Checking payment status...
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Please wait while we confirm your payment.
                  </p>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  This usually takes a few seconds. Please don't close this page.
                </p>
              </>
            )}

            {/* Abandoned Checkout State */}
            {type === 'starter' && hasStarterPaid === false && !csId && (
              <>
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-orange-600" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold">
                    Finish unlocking your Hub
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    It looks like your payment didn't finish.
                  </p>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={handleResumePayment}
                    disabled={isResumingPayment}
                    className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                    size="lg"
                  >
                    {isResumingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Resume payment'
                    )}
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    Starter Pack is a one-time $10 setup. Your 14-day trial begins today.
                  </p>
                </div>
              </>
            )}

            {/* Success State */}
            {((starterStatus === 'success' || (type === 'starter' && hasStarterPaid)) && hasStarterPaid !== false) && (
              <>
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold">
                    Payment successful — your 14-day trial has started
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Your Hub is live. Let's make sure you get paid.
                  </p>
                </div>

                {!onboardingComplete && connectUrl && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={openConnectOnboarding}
                        className="flex-1 h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                        size="lg"
                        disabled={isCheckingOnboarding}
                      >
                        {isCheckingOnboarding ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Checking status...
                          </>
                        ) : (
                          'Connect my bank'
                        )}
                      </Button>
                      <Button
                        onClick={handleContinue}
                        variant="outline"
                        className="h-14 text-lg"
                        size="lg"
                      >
                        Go to my Hub
                      </Button>
                    </div>

                    <p className="text-sm text-center text-muted-foreground">
                      Stripe securely handles verification. We never see your bank details.
                    </p>
                  </div>
                )}

                {onboardingComplete && (
                  <div className="space-y-4 text-center">
                    <p className="text-green-600 font-medium text-lg">✓ Payouts are configured!</p>
                    <Button
                      onClick={handleContinue}
                      className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                      size="lg"
                    >
                      Go to my Hub
                    </Button>
                  </div>
                )}
              </>
            )}

            {stripeStatus === 'cancelled' && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold">Payment Cancelled</h1>
                <p className="text-muted-foreground">
                  Your payment was not completed. You can try again when you're ready.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => navigate('/onboarding/final')}>
                    Try again
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/')}>
                    Go home
                  </Button>
                </div>
              </div>
            )}

            {stripeStatus === 'return' && (
              <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold">Stripe Connect Status</h1>
                {onboardingComplete ? (
                  <>
                    <p className="text-green-600 font-medium">✓ Connect setup complete!</p>
                    <Button onClick={handleContinue}>Go to my Hub</Button>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">
                      Stripe is reviewing your details. You can continue setting up your hub.
                    </p>
                    <Button onClick={handleContinue}>Go to my Hub</Button>
                  </>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppSurface>
  );
}
