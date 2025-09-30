import React, { useState } from 'react';
import { ProgressBar } from './ProgressBar';
import { StepOne } from './StepOne';
import { StepAboutYou } from './StepAboutYou';
import { StepTwoMultiSelect } from './StepTwoMultiSelect';
import { StepStyleSelect } from './StepStyleSelect';
import { StepThreeExpandedNew } from './StepThreeExpandedNew';
import { StarterPackReveal } from './StarterPackReveal';
import { generateBusinessIdentity } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface OnboardingData {
  idea: string;
  aboutYou: {
    firstName: string;
    lastName: string;
    expertise: string;
    motivation: string;
    styles: string[];
    profilePicture?: string;
    includeFirstName: boolean;
    includeLastName: boolean;
  };
  audiences: string[];
  styleCategory: string;
  businessIdentity: {
    name: string;
    logo: string;
    tagline: string;
    bio: string;
    colors: string[];
    logoSVG: string;
    nameOptions: Array<{name: string; style: string; tagline: string}>;
  };
  products?: Array<{
    title: string;
    type: string;
    price: string;
    description: string;
  }>;
  introCampaign?: {
    hook: string;
    caption: string;
    hashtags: string[];
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
    'Business Style',
    'Business Identity',
    'Launch Ready'
  ];

  const totalSteps = stepLabels.length;

  const handleStepOne = (idea: string) => {
    setFormData(prev => ({ ...prev, idea }));
    setCurrentStep(2);
  };

  const handleStepAboutYou = (aboutYou: { 
    firstName: string; 
    lastName: string;
    expertise: string;
    motivation: string;
    styles: string[];
    profilePicture?: string;
    includeFirstName: boolean;
    includeLastName: boolean;
  }) => {
    setFormData(prev => ({ ...prev, aboutYou }));
    setCurrentStep(3);
  };

  const handleStepTwo = (audiences: string[]) => {
    setFormData(prev => ({ ...prev, audiences }));
    setCurrentStep(4);
  };

  const handleStyleSelect = async (styleCategory: string) => {
    if (!formData.idea || !formData.aboutYou) return;
    
    setFormData(prev => ({ ...prev, styleCategory }));
    setIsGenerating(true);
    
    try {
      console.log('Generating business identity with data:', {
        idea: formData.idea,
        audiences: formData.audiences,
        experience: formData.aboutYou.expertise,
        motivation: formData.aboutYou.motivation,
        firstName: formData.aboutYou.firstName,
        styles: formData.aboutYou.styles,
        styleCategory
      });

      // Determine naming preference based on checkboxes
      let namingPreference: 'with_personal_name' | 'anonymous' | 'custom' = 'anonymous';
      if (formData.aboutYou.includeFirstName || formData.aboutYou.includeLastName) {
        namingPreference = 'with_personal_name';
      }

      // Generate business identity using AI after all data is collected
      const identityData = await generateBusinessIdentity({
        idea: formData.idea,
        audience: formData.audiences?.join(', ') || '',
        experience: formData.aboutYou.expertise,
        motivation: formData.aboutYou.motivation,
        firstName: formData.aboutYou.firstName,
        lastName: formData.aboutYou.lastName,
        tone: formData.aboutYou.styles.join(', '),
        styleCategory,
        namingPreference
      });

      console.log('Generated identity data:', identityData);

      // Update form data with generated identity
      setFormData(prev => ({
        ...prev,
        businessIdentity: {
          name: identityData.nameOptions[0].name,
          logo: identityData.logoSVG,
          tagline: identityData.tagline,
          bio: identityData.bio,
          colors: identityData.colors,
          logoSVG: identityData.logoSVG,
          nameOptions: identityData.nameOptions
        },
        products: identityData.products
      }));
      
      setCurrentStep(5);
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

  const handleStepThree = (businessIdentity: { name: string; logo: string; tagline: string; bio: string; colors: string[]; logoSVG: string; nameOptions: Array<{name: string; style: string; tagline: string}> }) => {
    setFormData(prev => ({ ...prev, businessIdentity }));
    setCurrentStep(6);
  };

  const handleUnlock = () => {
    // In a real app, this would trigger Stripe checkout
    if (onComplete && formData.idea && formData.aboutYou && formData.audiences && formData.businessIdentity) {
      onComplete(formData as OnboardingData);
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
            <StepTwoMultiSelect 
              onNext={handleStepTwo}
              onBack={goBack}
              initialValue={formData.audiences?.[0]}
              isLoading={false}
            />
          )}

          {currentStep === 4 && (
            <StepStyleSelect
              onNext={handleStyleSelect}
              onBack={goBack}
              initialValue={formData.styleCategory}
              isLoading={isGenerating}
            />
          )}
          
          {currentStep === 5 && (
            <StepThreeExpandedNew
              onNext={handleStepThree}
              onBack={goBack}
              initialValue={formData.businessIdentity}
              idea={formData.idea}
              aboutYou={formData.aboutYou}
              audience={formData.audiences?.[0] || ''}
            />
          )}
          
          {currentStep === 6 && formData.idea && formData.aboutYou && formData.audiences && formData.businessIdentity && (
            <StarterPackReveal
              idea={formData.idea}
              aboutYou={formData.aboutYou}
              audience={formData.audiences[0]}
              businessIdentity={formData.businessIdentity}
              introCampaign={formData.introCampaign}
              products={formData.products}
              onUnlock={handleUnlock}
              onBack={goBack}
            />
          )}
        </div>
      </div>
    </div>
  );
};