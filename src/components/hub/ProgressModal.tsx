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
import { Progress } from '@/components/ui/progress';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: number;
  completedMilestones: string[];
  nextActions: Array<{ title: string; path: string }>;
}

export const ProgressModal = ({ isOpen, onClose, progress, completedMilestones, nextActions }: ProgressModalProps) => {
  const navigate = useNavigate();

  const handleActionClick = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Your Progress Journey
          </DialogTitle>
          <DialogDescription className="text-base">
            You're building something amazing! Keep the momentum going.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-2xl font-bold text-primary">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Completed milestones */}
          {completedMilestones.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">✅ Achievements Unlocked</h3>
              <div className="space-y-2">
                {completedMilestones.map((milestone, i) => (
                  <Card key={i} className="border-2 border-green-200 bg-green-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-green-100 shrink-0">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium">{milestone}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Next actions */}
          {nextActions.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">🚀 Keep Growing</h3>
              <div className="space-y-2">
                {nextActions.map((action, i) => (
                  <Card 
                    key={i} 
                    className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
                    onClick={() => handleActionClick(action.path)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">{action.title}</span>
                        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Every action brings you closer to success! 💪
        </p>
      </DialogContent>
    </Dialog>
  );
};
