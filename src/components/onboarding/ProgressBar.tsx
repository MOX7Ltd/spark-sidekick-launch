import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabel?: string;
}

export const ProgressBar = ({ currentStep, totalSteps, stepLabel }: ProgressBarProps) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto mb-8 px-4">
      {/* Clean horizontal progress bar */}
      <div className="relative">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-hero transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Step indicator text - showing only step number and label */}
        <div className="flex justify-center items-center mt-3">
          <span className="text-sm font-medium text-foreground">
            Step {currentStep} of {totalSteps}{stepLabel ? `: ${stepLabel}` : ''}
          </span>
        </div>
      </div>
    </div>
  );
};