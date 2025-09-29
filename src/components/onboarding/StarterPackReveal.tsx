import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LivePreview } from './LivePreview';
import { Rocket, Sparkles, CheckCircle, Heart } from 'lucide-react';

interface StarterPackRevealProps {
  idea: string;
  aboutYou: {
    firstName: string;
    expertise: string;
    style: string;
  };
  audience: string;
  businessIdentity: {
    name: string;
    logo: string;
  };
  onUnlock: () => void;
  onBack: () => void;
}

export const StarterPackReveal = ({ idea, aboutYou, audience, businessIdentity, onUnlock, onBack }: StarterPackRevealProps) => {
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
          {businessIdentity.name} is ready to launch! 🚀
        </h2>
        <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
          Your complete business identity is live. Publish your storefront and start earning today for just $10.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 items-start">
        {/* Preview Panel - Full Visibility */}
        <div>
          <h3 className="text-2xl font-bold mb-4 text-center">Your Complete Business Preview</h3>
          <LivePreview 
            idea={idea}
            aboutYou={aboutYou}
            audience={audience}
            businessIdentity={businessIdentity}
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
                  'Publish your live storefront instantly',
                  'Own & edit your business identity',
                  'Post campaigns directly to social media',
                  'Accept payments & start earning',
                  'Access to Campaign Builder dashboard'
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
                Publish {businessIdentity.name}
              </Button>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  🚀 Go live in 60 seconds<br />
                  💳 Secure payment via Stripe<br />
                  📈 Start earning immediately
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
                  "Seeing my full business preview convinced me instantly. From idea to published storefront in 15 minutes!"
                </p>
                <p className="text-xs text-muted-foreground">- Alex M., Entrepreneur</p>
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