import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

interface StarterPackCheckoutProps {
  onContinue: () => void;
  businessName: string;
}

export const StarterPackCheckout = ({ onContinue, businessName }: StarterPackCheckoutProps) => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <div className="text-center mb-8 space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-4xl font-bold">Ready to launch {businessName}?</h2>
        <p className="text-xl text-muted-foreground">
          Get everything you need to start your business today
        </p>
      </div>

      <Card className="border-2 border-primary/30 shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2">SideHive Starter Pack</h3>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold">$49</span>
              <span className="text-xl text-muted-foreground">one-time</span>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Complete Business Identity</p>
                <p className="text-sm text-muted-foreground">Your logo, brand colors, and tagline</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Professional Storefront</p>
                <p className="text-sm text-muted-foreground">Beautiful, mobile-optimized website</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Launch-Ready Social Posts</p>
                <p className="text-sm text-muted-foreground">Instagram, LinkedIn, and Facebook content</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Product Catalog</p>
                <p className="text-sm text-muted-foreground">Your offerings organized and ready to sell</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Payment Integration</p>
                <p className="text-sm text-muted-foreground">Accept payments from day one</p>
              </div>
            </div>
          </div>

          <Button 
            size="lg"
            onClick={onContinue}
            className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all group"
          >
            Let's Go Live! 🚀
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            30-day money-back guarantee · No recurring fees
          </p>
        </CardContent>
      </Card>

      <div className="text-center mt-8">
        <Button 
          variant="ghost"
          onClick={onContinue}
          className="text-muted-foreground hover:text-foreground"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
};