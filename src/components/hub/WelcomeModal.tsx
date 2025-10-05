import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Store, Megaphone, TrendingUp } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName?: string;
  stats?: {
    products: number;
    campaigns: number;
  };
}

export const WelcomeModal = ({ isOpen, onClose, businessName = 'your business', stats }: WelcomeModalProps) => {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);

  // Trigger confetti when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleViewProfile = () => {
    onClose();
    navigate('/hub/profile');
  };

  const handleStartPromoting = () => {
    onClose();
    navigate('/hub/marketing');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-primary animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}
        
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center animate-bounce-in">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-3xl font-bold">
            🎉 Welcome to Your SideHive Hub!
          </DialogTitle>
          <DialogDescription className="text-lg">
            You've just launched {businessName}. Here's what's ready for you:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-6">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10 shrink-0">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    🛍️ Your Shopfront is Live
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your logo, bio, and {stats?.products || 0} product{stats?.products !== 1 ? 's' : ''} are ready to impress customers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10 shrink-0">
                  <Megaphone className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    💬 Intro Campaign Ready
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your launch posts are crafted and ready to share across platforms
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10 shrink-0">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    📈 Growth Tools Available
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Calendar, messages, reviews, and marketing tools to grow and refine your business
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="hero"
            size="lg"
            onClick={handleViewProfile}
            className="flex-1"
          >
            <Store className="mr-2 h-5 w-5" />
            See My Shopfront
          </Button>
          <Button
            variant="accent"
            size="lg"
            onClick={handleStartPromoting}
            className="flex-1"
          >
            <Megaphone className="mr-2 h-5 w-5" />
            Start Promoting
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Your journey starts now — let's make it amazing! 🚀
        </p>
      </DialogContent>
    </Dialog>
  );
};
