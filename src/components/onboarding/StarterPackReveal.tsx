import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { BusinessIdentity, ProductIdea } from '@/types/onboarding';

interface StarterPackRevealProps {
  businessIdentity: BusinessIdentity;
  products: ProductIdea[];
  onContinue: () => void;
  onBack: () => void;
}

export const StarterPackReveal = ({ businessIdentity, products, onContinue, onBack }: StarterPackRevealProps) => {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Use brand colors for confetti if available
  const confettiColors = businessIdentity.colors && businessIdentity.colors.length > 0
    ? businessIdentity.colors
    : ['#2DD4BF', '#F59E0B', '#1E40AF', '#F97316'];

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    // Trigger confetti animation on mount
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    if (isAuthenticated === false) {
      // Redirect to signup with return URL
      navigate('/auth/signup?next=/onboarding/final');
    } else {
      // Proceed to next step (payment)
      onContinue();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      {/* Confetti Elements */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 opacity-75 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="text-center mb-6 md:mb-8 space-y-3 md:space-y-4">
        <p className="text-xs md:text-sm text-muted-foreground/70 uppercase tracking-wide mb-2 md:mb-3 px-4">
          You've shaped your idea, shared your story, and built your brand — now here's your storefront.
        </p>
        <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center animate-bounce-in">
          <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white animate-pulse" />
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold animate-fade-in px-2">
          ✨ Your Shopfront is Ready!
        </h2>
        <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in px-4" style={{ animationDelay: '0.1s' }}>
          This is the face of your new business — your storefront customers could be seeing today.
        </p>
      </div>

      {/* Shopfront Header Preview v2 - Header Only */}
      <Card className="border-2 border-primary/20 overflow-hidden mb-6 md:mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <CardContent className="p-6 md:p-8">
          {/* Logo & Business Name */}
          <div className="flex flex-col items-center text-center mb-4 md:mb-6">
            {(businessIdentity.logoUrl || businessIdentity.logoSVG) && (
              <div className="w-32 h-32 md:w-40 md:h-40 mb-4 md:mb-6">
                {businessIdentity.logoSVG?.startsWith('<svg') ? (
                  <div dangerouslySetInnerHTML={{ __html: businessIdentity.logoSVG }} />
                ) : (
                  <img 
                    src={businessIdentity.logoUrl || businessIdentity.logoSVG} 
                    alt={businessIdentity.name}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )}
            <h3 className="text-2xl md:text-3xl font-bold mb-2">{businessIdentity.name}</h3>
            {businessIdentity.tagline && (
              <p className="text-base md:text-lg text-muted-foreground px-2">{businessIdentity.tagline}</p>
            )}
          </div>

          {/* About Section */}
          <div className="mb-4 md:mb-6">
            <h4 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase mb-2">About</h4>
            <p className="text-sm md:text-base leading-relaxed">{businessIdentity.bio}</p>
          </div>

          {/* Products Preview */}
          {products && products.length > 0 && (
            <div>
              <h4 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase mb-2 md:mb-3">What We Offer</h4>
              <div className="space-y-2 md:space-y-3">
                {products.slice(0, 3).map((product, idx) => (
                  <div key={product.id || idx} className="p-3 md:p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-start justify-between gap-3 md:gap-4">
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm md:text-base mb-1">{product.title}</h5>
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                      </div>
                      {product.format && (
                        <span className="text-[10px] md:text-xs bg-primary/10 text-primary px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                          {product.format}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Continue Button */}
      <div className="text-center space-y-3 md:space-y-4">
        <Button 
          size="lg"
          variant="hero"
          onClick={handleContinue}
          disabled={isAuthenticated === null}
          className="w-full md:w-auto h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-semibold"
        >
          {isAuthenticated === false ? '💾 Create Account to Continue' : '📣 Create My Launch Posts'}
        </Button>
        
        <div>
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-sm md:text-base text-muted-foreground hover:text-foreground"
          >
            ← Want to change something?
          </Button>
        </div>
      </div>
    </div>
  );
};
