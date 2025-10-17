import React from 'react';
import { Check } from 'lucide-react';

interface SubProgressBarProps {
  currentSubStep: number; // 0-based index
  totalSubSteps: number;
  labels: string[];
}

export const SubProgressBar = ({ currentSubStep, totalSubSteps, labels }: SubProgressBarProps) => {
  return (
    <div className="w-full max-w-3xl mx-auto mb-6 px-4">
      <div className="flex items-center justify-between">
        {labels.map((label, index) => {
          const isActive = index === currentSubStep;
          const isComplete = index < currentSubStep;
          
          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                    ${isComplete ? 'bg-green-500 text-white' : ''}
                    ${isActive ? 'bg-primary text-primary-foreground ring-2 ring-primary/20' : ''}
                    ${!isActive && !isComplete ? 'bg-muted text-muted-foreground' : ''}
                  `}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span
                  className={`
                    text-xs font-medium text-center max-w-[80px] transition-colors
                    ${isActive ? 'text-primary' : ''}
                    ${isComplete ? 'text-green-600' : ''}
                    ${!isActive && !isComplete ? 'text-muted-foreground' : ''}
                  `}
                >
                  {label}
                </span>
              </div>
              
              {index < totalSubSteps - 1 && (
                <div
                  className={`
                    flex-1 h-[2px] mx-2 transition-colors
                    ${isComplete ? 'bg-green-300' : 'bg-border'}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
