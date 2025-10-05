import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import { ProgressModal } from './ProgressModal';

interface ProgressTrackerProps {
  progress: number;
  completedMilestones: string[];
  nextActions: Array<{ title: string; path: string }>;
}

export const ProgressTracker = ({ progress, completedMilestones, nextActions }: ProgressTrackerProps) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all border-2 border-primary/20 bg-gradient-to-r from-card to-primary/5"
        onClick={() => setShowModal(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-gradient-hero shrink-0">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Your SideHive Progress</h3>
                <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {completedMilestones.length > 0 && `✅ ${completedMilestones[completedMilestones.length - 1]}`}
                {nextActions.length > 0 && ` • 🔜 ${nextActions[0].title}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProgressModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        progress={progress}
        completedMilestones={completedMilestones}
        nextActions={nextActions}
      />
    </>
  );
};
