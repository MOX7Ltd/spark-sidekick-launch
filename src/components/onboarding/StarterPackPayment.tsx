import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FLAGS } from '@/lib/flags';
import { PricingFAQModal } from '@/components/pricing/PricingFAQModal';

interface StarterPackPaymentProps {
  onSuccess?: () => void;
}

export function StarterPackPayment({ onSuccess }: StarterPackPaymentProps) {
  const [agreedToPricing, setAgreedToPricing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!FLAGS.STRIPE_PAYMENTS_V1) {
    return null;
  }

  const handlePayment = async () => {
    if (!agreedToPricing) {
      toast({
        title: "Please agree to pricing",
        description: "You must understand and accept SideHive's pricing structure to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: "Authentication required",
          description: "Please sign in to continue with payment.",
          variant: "destructive",
        });
        return;
      }

      // Call edge function to create checkout session
      const { data, error } = await supabase.functions.invoke('create-starter-session', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (!data?.url) {
        throw new Error('No checkout URL returned');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Unable to process payment. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Activate Your SideHive Shopfront</h2>
        <p className="text-muted-foreground">
          One simple payment to get started with everything you need
        </p>
        <div className="flex justify-center pt-2">
          <PricingFAQModal />
        </div>
      </div>

      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-full bg-primary/10 p-1">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">💰 $10 NZD Starter Pack</h3>
              <p className="text-sm text-muted-foreground">
                One-time payment to activate your shopfront
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-full bg-primary/10 p-1">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">🕒 14-Day Free Trial</h3>
              <p className="text-sm text-muted-foreground">
                Full access to SideHive Pro features for two weeks
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-full bg-primary/10 p-1">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">💳 $25 / month after trial</h3>
              <p className="text-sm text-muted-foreground">
                Continue with full platform access after your free trial
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-full bg-primary/10 p-1">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">💸 15% platform fee on sales</h3>
              <p className="text-sm text-muted-foreground">
                Covers Stripe processing, currency conversion, and platform services
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="agree-pricing"
              checked={agreedToPricing}
              onCheckedChange={(checked) => setAgreedToPricing(checked === true)}
            />
            <label
              htmlFor="agree-pricing"
              className="text-sm leading-relaxed cursor-pointer"
            >
              I understand SideHive's pricing structure and agree to the terms above
            </label>
          </div>
        </div>

        <Button
          onClick={handlePayment}
          disabled={!agreedToPricing || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redirecting to payment...
            </>
          ) : (
            'Pay $10 NZD Starter Pack'
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Secure payment powered by Stripe • Cancel subscription anytime
        </p>
      </Card>
    </div>
  );
}
