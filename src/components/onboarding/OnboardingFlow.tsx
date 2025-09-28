import React, { useState } from 'react';
import { ProgressBar } from './ProgressBar';
import { StepOne } from './StepOne';
import { StepTwo } from './StepTwo';
import { StepThree } from './StepThree';
import { StarterPackReveal } from './StarterPackReveal';

interface OnboardingData {
  idea: string;
  audience: string;
  namingPreference: string;
}

interface OnboardingFlowProps {
  onComplete?: (data: OnboardingData) => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});

  const stepLabels = [
    'Your Idea',
    'Target Audience', 
    'Naming Style',
    'Launch Ready'
  ];

  const totalSteps = stepLabels.length;

  const handleStepOne = (idea: string) => {
    setFormData(prev => ({ ...prev, idea }));
    setCurrentStep(2);
  };

  const handleStepTwo = (audience: string) => {
    setFormData(prev => ({ ...prev, audience }));
    setCurrentStep(3);
  };

  const handleStepThree = (namingPreference: string) => {
    setFormData(prev => ({ ...prev, namingPreference }));
    setCurrentStep(4);
  };

  const handleUnlock = () => {
    // In a real app, this would trigger Stripe checkout
    if (onComplete && formData.idea && formData.audience && formData.namingPreference) {
      onComplete({
        idea: formData.idea,
        audience: formData.audience,
        namingPreference: formData.namingPreference
      });
    }
    console.log('Triggering Stripe checkout with:', formData);
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-[80vh] py-8">
      <div className="container mx-auto px-4">
        {currentStep < 4 && (
          <ProgressBar 
            currentStep={currentStep} 
            totalSteps={totalSteps} 
            stepLabels={stepLabels}
          />
        )}
        
        <div className="min-h-[60vh] flex items-center justify-center">
          {currentStep === 1 && (
            <StepOne 
              onNext={handleStepOne}
              initialValue={formData.idea}
            />
          )}
          
          {currentStep === 2 && (
            <StepTwo 
              onNext={handleStepTwo}
              onBack={goBack}
              initialValue={formData.audience}
            />
          )}
          
          {currentStep === 3 && (
            <StepThree 
              onNext={handleStepThree}
              onBack={goBack}
              initialValue={formData.namingPreference}
            />
          )}
          
          {currentStep === 4 && formData.idea && formData.audience && formData.namingPreference && (
            <StarterPackReveal
              idea={formData.idea}
              audience={formData.audience}
              namingPreference={formData.namingPreference}
              onUnlock={handleUnlock}
              onBack={goBack}
            />
          )}
        </div>
      </div>
    </div>
  );
};