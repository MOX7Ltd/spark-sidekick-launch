import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FLAGS } from '@/lib/flags';
import { getSessionId } from '@/lib/telemetry';

interface StarterPackCheckoutProps {
  onContinue: () => void;
  businessName: string;
}

export const StarterPackCheckout = ({ onContinue, businessName }: StarterPackCheckoutProps) => {
  const [agreedToPricing, setAgreedToPricing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleLaunch = async () => {
    // If Stripe payments enabled, process real payment
    if (FLAGS.STRIPE_PAYMENTS_V1) {
      if (!agreedToPricing) {
        toast({
          title: "Please agree to pricing",
          description: "You must understand and accept SideHive's pricing structure to continue.",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);

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
            'X-Session-Id': getSessionId(),
          },
          body: {
            session_id: getSessionId(),
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
        setIsProcessing(false);
      }
    } else {
      // Legacy flow - just continue
      onContinue();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      <div className="text-center mb-6 md:mb-8 space-y-2 md:space-y-3">
        <p className="text-xs md:text-sm text-muted-foreground/70 uppercase tracking-wide mb-2 md:mb-3 px-4">
          Your idea, story, brand, shopfront, and launch posts are all ready — now it's time to go live.
        </p>
        <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-full mb-2 md:mb-4">
          <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-4xl font-bold px-2">🚀 Launch {businessName} Today!</h2>
        <p className="text-base md:text-xl text-muted-foreground px-4">
          Your brand, storefront, and launch posts are ready to go live. Unlock your Starter Pack to make it official.
        </p>
      </div>

      <Card className="border-2 border-primary/30 shadow-xl">
        <CardContent className="p-6 md:p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl md:text-2xl font-bold mb-2">SideHive Starter Pack</h3>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl md:text-5xl font-bold">$10</span>
              <span className="text-lg md:text-xl text-muted-foreground">one-time</span>
            </div>
          </div>

          <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
            <div className="flex items-start gap-2 md:gap-3">
              <div className="mt-0.5 md:mt-1 flex-shrink-0">
                <Check className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm md:text-base">✨ Your brand identity is ready to shine</p>
                <p className="text-xs md:text-sm text-muted-foreground">Logo, tagline, and colors that represent you</p>
              </div>
            </div>

            <div className="flex items-start gap-2 md:gap-3">
              <div className="mt-0.5 md:mt-1 flex-shrink-0">
                <Check className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm md:text-base">✨ Your storefront is launch-ready</p>
                <p className="text-xs md:text-sm text-muted-foreground">Mobile-friendly website ready to impress</p>
              </div>
            </div>

            <div className="flex items-start gap-2 md:gap-3">
              <div className="mt-0.5 md:mt-1 flex-shrink-0">
                <Check className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm md:text-base">✨ Your social media posts are prepped to attract customers</p>
                <p className="text-xs md:text-sm text-muted-foreground">Instagram, LinkedIn, and Facebook content ready to post</p>
              </div>
            </div>

            <div className="flex items-start gap-2 md:gap-3">
              <div className="mt-0.5 md:mt-1 flex-shrink-0">
                <Check className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm md:text-base">✨ Your product catalog is organized and ready to sell</p>
                <p className="text-xs md:text-sm text-muted-foreground">Your offerings beautifully showcased</p>
              </div>
            </div>

            <div className="flex items-start gap-2 md:gap-3">
              <div className="mt-0.5 md:mt-1 flex-shrink-0">
                <Check className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm md:text-base">✨ Your payment setup means you can take money from day one</p>
                <p className="text-xs md:text-sm text-muted-foreground">Start earning immediately</p>
              </div>
            </div>
          </div>

          {FLAGS.STRIPE_PAYMENTS_V1 && (
            <>
              <div className="mb-6 p-4 bg-muted rounded-lg space-y-3">
                <h4 className="font-semibold text-sm">Transparent Pricing:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>💰 <strong>$10 NZD</strong> one-time Starter Pack fee</li>
                  <li>🕒 Includes <strong>14-day free trial</strong> of SideHive Pro</li>
                  <li>💳 Then <strong>$25 NZD/month</strong> after trial</li>
                  <li>💸 <strong>15% platform fee</strong> on each sale (covers Stripe + processing)</li>
                </ul>
              </div>

              <div className="flex items-start gap-3 mb-6">
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
            </>
          )}

          <Button 
            size="lg"
            variant="hero"
            onClick={handleLaunch}
            disabled={FLAGS.STRIPE_PAYMENTS_V1 && (!agreedToPricing || isProcessing)}
            className="w-full h-12 md:h-14 text-base md:text-lg font-semibold group"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                🔥 Launch My Business
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>

          <p className="text-center text-xs md:text-sm text-muted-foreground mt-3 md:mt-4">
            {FLAGS.STRIPE_PAYMENTS_V1 ? 'Secure payment powered by Stripe · Cancel anytime' : '30-day money-back guarantee · No recurring fees'}
          </p>
        </CardContent>
      </Card>

      <div className="text-center mt-8">
        <Button 
          variant="ghost"
          onClick={onContinue}
          className="text-muted-foreground hover:text-foreground"
          disabled={isProcessing}
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
};