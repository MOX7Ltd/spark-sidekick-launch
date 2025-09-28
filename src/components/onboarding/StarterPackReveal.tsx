import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LivePreview } from './LivePreview';
import { Rocket, Sparkles, CheckCircle, Heart } from 'lucide-react';

interface StarterPackRevealProps {
  idea: string;
  audience: string;
  namingPreference: string;
  onUnlock: () => void;
  onBack: () => void;
}

export const StarterPackReveal = ({ idea, audience, namingPreference, onUnlock, onBack }: StarterPackRevealProps) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger confetti animation on mount
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-4xl mx-auto animate-slide-up">
      {/* Confetti Elements */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 opacity-75 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#2DD4BF', '#F59E0B', '#1E40AF', '#F97316'][Math.floor(Math.random() * 4)],
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-hero rounded-full flex items-center justify-center animate-bounce-in">
          <Rocket className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Your business is ready to launch! 🚀
        </h2>
        <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
          We've created everything you need to start earning. 
          Unlock your storefront + launch campaigns for just $10.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 items-start">
        {/* Preview Panel - Blurred */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/80 z-10 rounded-lg" />
          <LivePreview 
            idea={idea}
            audience={audience}
            namingPreference={namingPreference}
            isBlurred={true}
          />
        </div>

        {/* Unlock Panel */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-gradient-subtle">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-accent rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold">Starter Pack</h3>
                <div className="text-3xl font-bold text-brand-orange">$10</div>
                <p className="text-muted-foreground">One-time payment to launch</p>
              </div>

              <div className="space-y-3 my-6">
                {[
                  'Professional storefront with payments',
                  '2 ready-to-sell products',
                  '3 launch campaigns with content',
                  'Social media posting tools',
                  'Basic analytics & insights'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant="starter" 
                size="xl" 
                className="w-full mb-4"
                onClick={onUnlock}
              >
                <Heart className="mr-2 h-5 w-5" />
                Unlock My Business
              </Button>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  ✨ Start earning immediately<br />
                  💳 Secure payment via Stripe<br />
                  🔒 15% platform fee only when you sell
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Testimonial/Social Proof */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <div className="flex justify-center space-x-1 text-accent">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>⭐</span>
                  ))}
                </div>
                <p className="text-sm italic">
                  "From idea to first sale in 20 minutes. This is exactly what I needed to get started!"
                </p>
                <p className="text-xs text-muted-foreground">- Jamie R., Creator</p>
              </div>
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Want to change something?
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};