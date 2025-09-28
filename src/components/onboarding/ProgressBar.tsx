import React from 'react';
import { CheckCircle } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export const ProgressBar = ({ currentStep, totalSteps, stepLabels }: ProgressBarProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <div key={index} className="flex items-center">
              {/* Step Circle */}
              <div className={`
                relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-smooth
                ${isCompleted 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : isCurrent 
                    ? 'border-primary text-primary bg-background animate-pulse' 
                    : 'border-muted text-muted-foreground bg-background'
                }
              `}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 animate-scale-in" />
                ) : (
                  <span className="text-sm font-semibold">{stepNumber}</span>
                )}
              </div>
              
              {/* Step Label */}
              <div className="ml-3 hidden sm:block">
                <div className={`
                  text-sm font-medium transition-smooth
                  ${isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'}
                `}>
                  {stepLabels[index]}
                </div>
              </div>
              
              {/* Connector Line */}
              {index < totalSteps - 1 && (
                <div className={`
                  hidden sm:block w-12 h-0.5 mx-4 transition-smooth
                  ${isCompleted ? 'bg-primary' : 'bg-muted'}
                `} />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Mobile Progress Bar */}
      <div className="sm:hidden mt-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{stepLabels[currentStep - 1]}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-gradient-primary h-2 rounded-full transition-smooth duration-500"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};