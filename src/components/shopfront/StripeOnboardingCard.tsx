import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface StripeOnboardingCardProps {
  businessId: string;
  stripeOnboarded: boolean;
  onStatusUpdate?: () => void;
}

export function StripeOnboardingCard({
  businessId,
  stripeOnboarded,
  onStatusUpdate,
}: StripeOnboardingCardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const [status, setStatus] = React.useState<{
    onboarded: boolean;
    capabilities?: {
      charges_enabled?: boolean;
      payouts_enabled?: boolean;
      details_submitted?: boolean;
    };
  }>({ onboarded: stripeOnboarded });

  const checkStripeStatus = React.useCallback(async () => {
    setChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to check Stripe status.',
          variant: 'destructive',
        });
        return;
      }

      const res = await supabase.functions.invoke('stripe-check-capabilities', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.error) throw res.error;

      const data = res.data;
      setStatus({
        onboarded: data.onboarded,
        capabilities: data.capabilities,
      });

      if (data.onboarded && !stripeOnboarded) {
        toast({
          title: 'Stripe Connected!',
          description: 'Your Stripe account is now ready to accept payments.',
        });
        onStatusUpdate?.();
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error);
      toast({
        title: 'Failed to check status',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setChecking(false);
    }
  }, [stripeOnboarded, toast, onStatusUpdate]);

  const handleStartOnboarding = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to set up Stripe.',
          variant: 'destructive',
        });
        return;
      }

      const res = await supabase.functions.invoke('stripe-connect-link', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.error) {
        console.error('Stripe Connect link error:', res.error);
        throw res.error;
      }

      const data = res.data;

      if (data.onboarded) {
        toast({
          title: 'Already Onboarded',
          description: 'Your Stripe account is already set up.',
        });
        setStatus({ onboarded: true, capabilities: data.capabilities });
        onStatusUpdate?.();
        return;
      }

      if (data.url) {
        // Open Stripe onboarding in new tab
        window.open(data.url, '_blank');
        
        toast({
          title: 'Stripe Onboarding',
          description: 'Complete the setup in the new tab, then return here to refresh.',
        });
      }
    } catch (error) {
      console.error('Error starting Stripe onboarding:', error);
      toast({
        title: 'Failed to start onboarding',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Check status on mount if not onboarded yet
  React.useEffect(() => {
    if (!stripeOnboarded && businessId) {
      checkStripeStatus();
    }
  }, [businessId, stripeOnboarded, checkStripeStatus]);

  // If fully onboarded, show success state
  if (status.onboarded) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/20">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
        <AlertDescription className="ml-2 flex items-center justify-between">
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">
              Stripe Connected
            </p>
            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
              Your account is ready to accept payments.
            </p>
          </div>
          <Badge variant="outline" className="ml-4 border-green-500 text-green-700 dark:text-green-400">
            Active
          </Badge>
        </AlertDescription>
      </Alert>
    );
  }

  // Show onboarding required state
  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-500" />
          <div className="flex-1">
            <p className="font-medium text-amber-900 dark:text-amber-100">
              Stripe Setup Required
            </p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Complete your Stripe onboarding to start accepting payments on your shopfront.
            </p>
            
            {status.capabilities && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge variant={status.capabilities.details_submitted ? "default" : "outline"}>
                  {status.capabilities.details_submitted ? '✓' : '○'} Details Submitted
                </Badge>
                <Badge variant={status.capabilities.charges_enabled ? "default" : "outline"}>
                  {status.capabilities.charges_enabled ? '✓' : '○'} Charges Enabled
                </Badge>
                <Badge variant={status.capabilities.payouts_enabled ? "default" : "outline"}>
                  {status.capabilities.payouts_enabled ? '✓' : '○'} Payouts Enabled
                </Badge>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={handleStartOnboarding}
                disabled={loading}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {loading ? 'Opening...' : 'Complete Stripe Setup'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={checkStripeStatus}
                disabled={checking}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                {checking ? 'Checking...' : 'Refresh Status'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
