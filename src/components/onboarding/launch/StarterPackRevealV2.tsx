import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface StarterPackRevealV2Props {
  businessName: string;
  logoUrl?: string;
  brandColors?: string[];
  onContinue: () => void;
}

export const StarterPackRevealV2 = ({ 
  businessName, 
  logoUrl, 
  brandColors, 
  onContinue 
}: StarterPackRevealV2Props) => {
  const [showConfetti, setShowConfetti] = useState(false);

  // Use brand colors for gradient if available, fallback to SideHive gradient
  const gradientStyle = brandColors && brandColors.length > 0
    ? { background: `linear-gradient(135deg, ${brandColors[0]}, ${brandColors[1] || brandColors[0]})` }
    : { background: 'linear-gradient(135deg, hsl(var(--brand-teal)), hsl(var(--brand-orange)))' };

  useEffect(() => {
    // Trigger confetti animation on mount
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto px-4 py-8"
    >
      {/* Confetti Elements */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                top: '-5%', 
                left: `${Math.random() * 100}%`,
                opacity: 0.8 
              }}
              animate={{ 
                top: '110%',
                rotate: Math.random() * 360,
                opacity: 0
              }}
              transition={{ 
                duration: 0.8 + Math.random() * 0.4,
                ease: 'easeOut'
              }}
              className="absolute w-2 h-2"
              style={{
                backgroundColor: brandColors?.[Math.floor(Math.random() * brandColors.length)] || 
                  ['hsl(185, 85%, 45%)', 'hsl(35, 95%, 55%)', 'hsl(210, 85%, 25%)'][Math.floor(Math.random() * 3)]
              }}
            />
          ))}
        </div>
      )}

      <div className="text-center space-y-6">
        {/* Logo with pulse animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mx-auto w-32 h-32 rounded-full flex items-center justify-center overflow-hidden relative"
          style={gradientStyle}
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: 1 }}
            className="w-28 h-28 rounded-full bg-background flex items-center justify-center"
          >
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={businessName}
                className="w-20 h-20 object-contain"
              />
            ) : (
              <Sparkles className="w-12 h-12 text-primary" />
            )}
          </motion.div>
        </motion.div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Your brand is live-ready!
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
            Your shopfront, products, and identity are ready to launch. Let's unlock your hub and start selling.
          </p>
        </div>

        {/* CTA */}
        <div className="pt-4">
          <Button
            size="lg"
            onClick={onContinue}
            className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            Unlock my Hub
          </Button>
        </div>

        {/* Footer */}
        <p className="text-sm text-muted-foreground pt-4">
          You own it. We just power it.
        </p>
      </div>
    </motion.div>
  );
};
