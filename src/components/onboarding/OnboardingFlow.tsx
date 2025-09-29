import React, { useState } from 'react';
import { ProgressBar } from './ProgressBar';
import { StepOne } from './StepOne';
import { StepAboutYou } from './StepAboutYou';
import { StepTwo } from './StepTwo';
import { StepThree } from './StepThree';
import { StarterPackReveal } from './StarterPackReveal';

interface OnboardingData {
  idea: string;
  aboutYou: {
    firstName: string;
    expertise: string;
    style: string;
  };
  audience: string;
  businessIdentity: {
    name: string;
    logo: string;
  };
}

interface OnboardingFlowProps {
  onComplete?: (data: OnboardingData) => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});

  const stepLabels = [
    'Your Idea',
    'About You',
    'Target Audience', 
    'Business Identity',
    'Launch Ready'
  ];

  const totalSteps = stepLabels.length;

  const handleStepOne = (idea: string) => {
    setFormData(prev => ({ ...prev, idea }));
    setCurrentStep(2);
  };

  const handleStepAboutYou = (aboutYou: { firstName: string; expertise: string; style: string }) => {
    setFormData(prev => ({ ...prev, aboutYou }));
    setCurrentStep(3);
  };

  const handleStepTwo = (audience: string) => {
    setFormData(prev => ({ ...prev, audience }));
    setCurrentStep(4);
  };

  const handleStepThree = (businessIdentity: { name: string; logo: string }) => {
    setFormData(prev => ({ ...prev, businessIdentity }));
    setCurrentStep(5);
  };

  const handleUnlock = () => {
    // In a real app, this would trigger Stripe checkout
    if (onComplete && formData.idea && formData.aboutYou && formData.audience && formData.businessIdentity) {
      onComplete({
        idea: formData.idea,
        aboutYou: formData.aboutYou,
        audience: formData.audience,
        businessIdentity: formData.businessIdentity
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
        {currentStep < 5 && (
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
            <StepAboutYou 
              onNext={handleStepAboutYou}
              onBack={goBack}
              initialValue={formData.aboutYou}
            />
          )}
          
          {currentStep === 3 && (
            <StepTwo 
              onNext={handleStepTwo}
              onBack={goBack}
              initialValue={formData.audience}
            />
          )}
          
          {currentStep === 4 && (
            <StepThree
              onNext={handleStepThree}
              onBack={goBack}
              initialValue={formData.businessIdentity}
              idea={formData.idea}
              aboutYou={formData.aboutYou}
              audience={formData.audience}
            />
          )}
          
          {currentStep === 5 && formData.idea && formData.aboutYou && formData.audience && formData.businessIdentity && (
            <StarterPackReveal
              idea={formData.idea}
              aboutYou={formData.aboutYou}
              audience={formData.audience}
              businessIdentity={formData.businessIdentity}
              onUnlock={handleUnlock}
              onBack={goBack}
            />
          )}
        </div>
      </div>
    </div>
  );
};