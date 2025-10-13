import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Check, ChevronDown, Shield, CreditCard, XCircle } from 'lucide-react';

interface StarterPackPricingCardProps {
  onStartCheckout: () => void;
}

export const StarterPackPricingCard = ({ onStartCheckout }: StarterPackPricingCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const features = [
    'Live, shareable shopfront',
    'Brand & identity toolkit',
    'Hub analytics & scheduling starter',
    'Stripe Connect payouts',
    'Support (AI assistant)'
  ];

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2">Start your 14-day trial</h2>
        <p className="text-muted-foreground">
          Transparent pricing. No hidden fees. Cancel anytime.
        </p>
      </div>

      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl">Launch Package</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pricing breakdown */}
          <div className="space-y-4">
            <div className="flex items-start justify-between pb-4 border-b">
              <div>
                <h3 className="font-semibold text-lg">Starter Pack</h3>
                <p className="text-sm text-muted-foreground">Instant shopfront setup + 14-day trial of your Hub tools</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">$10</p>
                <p className="text-xs text-muted-foreground">one-time</p>
              </div>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">Hub Plan</h3>
                <p className="text-sm text-muted-foreground">Auto-starts after trial</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">$25</p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Cancel anytime before your trial ends. No hidden fees.
            </p>
          </div>

          {/* Collapsible feature list */}
          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="font-medium">What you get</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Secure checkout by Stripe</span>
            </div>
            <div className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              <span>No hidden fees</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              <span>Cancel anytime</span>
            </div>
          </div>

          {/* CTA */}
          <Button
            size="lg"
            onClick={onStartCheckout}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            Start my 14-day trial
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Starter Pack is a one-time $10 setup. Your 14-day trial begins today. Cancel anytime before your trial ends. No hidden fees.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
