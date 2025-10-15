import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, X } from 'lucide-react';

interface RecoveryBannerProps {
  lastStep: number;
  onRestore: () => void;
  onDismiss: () => void;
}

export function RecoveryBanner({ lastStep, onRestore, onDismiss }: RecoveryBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-primary/20 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Welcome back! We saved your progress.
              </p>
              <p className="text-xs text-muted-foreground">
                Continue from step {lastStep} or start fresh.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={onRestore}
              size="sm"
              variant="default"
            >
              Continue
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
            >
              Start Fresh
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-primary/10 rounded-md transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
