import React, { useState } from 'react';
import { ProgressBar } from './ProgressBar';
import { StepOne } from './StepOne';
import { StepAboutYou } from './StepAboutYou';
import { StepTwo } from './StepTwo';
import { StepThree } from './StepThree';
import { StarterPackReveal } from './StarterPackReveal';
import { generateBusinessIdentity } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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
    tagline: string;
    bio: string;
    colors: string[];
    logoSVG: string;
    nameOptions: string[];
  };
}

interface OnboardingFlowProps {
  onComplete?: (data: OnboardingData) => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

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

  const handleStepTwo = async (audience: string) => {
    if (!formData.idea || !formData.aboutYou) return;
    
    setFormData(prev => ({ ...prev, audience }));
    setIsGenerating(true);
    
    try {
      console.log('Generating business identity with data:', {
        idea: formData.idea,
        audience,
        experience: formData.aboutYou.expertise,
        firstName: formData.aboutYou.firstName,
        style: formData.aboutYou.style
      });

      // Generate business identity using AI after all data is collected
      const identityData = await generateBusinessIdentity({
        idea: formData.idea,
        audience,
        experience: formData.aboutYou.expertise,
        firstName: formData.aboutYou.firstName,
        tone: formData.aboutYou.style.toLowerCase() as 'professional' | 'friendly' | 'playful',
        namingPreference: 'anonymous'
      });

      console.log('Generated identity data:', identityData);

      // Update form data with generated identity
      setFormData(prev => ({
        ...prev,
        businessIdentity: {
          name: identityData.nameOptions[0],
          logo: identityData.logoSVG,
          tagline: identityData.tagline,
          bio: identityData.bio,
          colors: identityData.colors,
          logoSVG: identityData.logoSVG,
          nameOptions: identityData.nameOptions
        }
      }));
      
      setCurrentStep(4);
    } catch (error) {
      console.error('Error generating business identity:', error);
      toast({
        title: "Generation Failed",
        description: `Failed to generate business identity: ${error.message || 'Please try again.'}`,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStepThree = (businessIdentity: { name: string; logo: string; tagline: string; bio: string; colors: string[]; logoSVG: string; nameOptions: string[] }) => {
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
              isLoading={false}
            />
          )}
          
          {currentStep === 3 && (
            <StepTwo 
              onNext={handleStepTwo}
              onBack={goBack}
              initialValue={formData.audience}
              isLoading={isGenerating}
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