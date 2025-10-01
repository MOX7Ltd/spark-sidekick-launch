import React, { useState, useEffect } from 'react';
import { StepOne } from './StepOne';
import { StepAboutYouMobile } from './StepAboutYouMobile';
import { StepTwoMultiSelect } from './StepTwoMultiSelect';
import { SocialPostPreview } from './SocialPostPreview';
import { StepBusinessIdentity } from './StepBusinessIdentity';
import { StarterPackReveal } from './StarterPackReveal';
import { generateBusinessIdentity, generateCampaign, GenerateIdentityRequest, GenerateCampaignRequest } from '@/lib/api';
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
    nameOptions: Array<{name: string; style?: string; archetype?: string; tagline: string}>;
  };
  products?: Array<{
    title: string;
    type: string;
    price: string;
    description: string;
  }>;
  introCampaign?: {
    shortPost: {
      caption: string;
      hashtags: string[];
    };
    longPost: {
      caption: string;
    };
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

  // Scroll to top whenever the step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

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
    setCurrentStep(3); // Go to audience select
  };

  const handleAudienceSelect = (audiences: string[]) => {
    setFormData(prev => ({ ...prev, audiences }));
    setCurrentStep(4); // Go to social post preview
  };

  const handleSocialPostContinue = () => {
    setCurrentStep(5); // Go to business identity
  };

  const handleBusinessIdentity = (businessIdentity: OnboardingData['businessIdentity']) => {
    setFormData(prev => ({ ...prev, businessIdentity }));
    setCurrentStep(6); // Go to final reveal
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
        <div className="min-h-[60vh] flex items-center justify-center">
          {currentStep === 1 && (
            <StepOne 
              onNext={handleStepOne}
              initialValue={formData.idea}
            />
          )}
          
          {currentStep === 2 && (
            <StepAboutYouMobile 
              onNext={handleStepAboutYou}
              onBack={goBack}
              initialValue={formData.aboutYou}
              isLoading={false}
            />
          )}

          {currentStep === 3 && (
            <StepTwoMultiSelect 
              onNext={handleAudienceSelect}
              onBack={goBack}
              initialValue={formData.audiences?.[0]}
              isLoading={false}
            />
          )}

          {currentStep === 4 && formData.aboutYou && formData.idea && formData.audiences && (
            <SocialPostPreview
              firstName={formData.aboutYou.firstName}
              expertise={formData.aboutYou.expertise}
              motivation={formData.aboutYou.motivation}
              styles={formData.aboutYou.styles}
              audiences={formData.audiences}
              idea={formData.idea}
              onContinue={handleSocialPostContinue}
            />
          )}
          
          {currentStep === 5 && (
            <StepBusinessIdentity
              onNext={handleBusinessIdentity}
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