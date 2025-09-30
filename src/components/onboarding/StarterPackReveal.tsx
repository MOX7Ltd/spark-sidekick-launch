import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CustomerStorefront } from './CustomerStorefront';
import { Rocket, Sparkles, CheckCircle, Heart, Eye, Settings } from 'lucide-react';

interface Product {
  title: string;
  type: string;
  price: string;
  description: string;
}

interface StarterPackRevealProps {
  idea: string;
  aboutYou: {
    firstName: string;
    lastName: string;
    expertise: string;
    motivation: string;
    styles: string[];
  };
  audience: string;
  businessIdentity: {
    name: string;
    logo: string;
    tagline?: string;
    bio?: string;
    colors?: string[];
    logoSVG?: string;
  };
  introCampaign?: {
    shortPost: {
      caption: string;
      hashtags: string[];
    };
    longPost: {
      caption: string;
    };
  };
  products?: Product[];
  onUnlock: () => void;
  onBack: () => void;
}

export const StarterPackReveal = ({ idea, aboutYou, audience, businessIdentity, introCampaign, products, onUnlock, onBack }: StarterPackRevealProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [viewMode, setViewMode] = useState<'customer' | 'edit'>('customer');

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
          🔥 Your business is ready to launch!
        </h2>
        <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
          This is exactly what customers will see when they visit your link from social media.
        </p>
        
        {/* View Toggle */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Button
            variant={viewMode === 'customer' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('customer')}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            See as Customer
          </Button>
          <Button
            variant={viewMode === 'edit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('edit')}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Edit Details
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.5fr,1fr] items-start">
        {/* Storefront Preview - Customer Facing */}
        <div>
          <CustomerStorefront
            idea={idea}
            aboutYou={aboutYou}
            audience={audience}
            businessIdentity={businessIdentity}
            introCampaign={introCampaign}
            products={products}
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