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
  products?: Array<{
    id: string;
    title: string;
    format: string;
    description: string;
  }>;
  aboutYou: {
    firstName: string;
    lastName: string;
    expertise: string;
    motivation: string;
    styles: string[];
    vibe: string;
    profilePicture?: string;
    includeFirstName: boolean;
    includeLastName: boolean;
  };
  audiences: string[];
  businessIdentity: {
    name: string;
    logo: string;
    tagline: string;
    bio: string;
    colors: string[];
    logoSVG: string;
    nameOptions: Array<{name: string; style?: string; archetype?: string; tagline: string}>;
  };
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

  // Stage 1: Idea + Products
  const handleStepOne = (idea: string, products: any[]) => {
    setFormData(prev => ({ ...prev, idea, products }));
    setCurrentStep(2);
  };

  // Stage 2: About You (First name, Last name, Why, Story, Vibe)
  const handleStepAboutYou = (aboutYou: { 
    firstName: string; 
    lastName: string;
    expertise: string;
    motivation: string;
    styles: string[];
    vibe: string;
    profilePicture?: string;
    includeFirstName: boolean;
    includeLastName: boolean;
  }) => {
    setFormData(prev => ({ ...prev, aboutYou }));
    setCurrentStep(3); // Go to audience select
  };

  // Stage 3: Audience Selection
  const handleAudienceSelect = (audiences: string[]) => {
    setFormData(prev => ({ ...prev, audiences }));
    setCurrentStep(4); // Go to business identity
  };

  // Stage 4: Business Identity (Name + Logo)
  const handleBusinessIdentity = (businessIdentity: OnboardingData['businessIdentity']) => {
    setFormData(prev => ({ ...prev, businessIdentity }));
    setCurrentStep(5); // Go to shopfront preview
  };

  // Stage 5: Shopfront Preview (Celebration)
  const handleShopfrontContinue = () => {
    setCurrentStep(6); // Go to social media posts
  };

  // Stage 6: Social Media Posts (Final Step)
  const handleSocialPostsComplete = () => {
    if (onComplete && formData.idea && formData.aboutYou && formData.audiences && formData.businessIdentity) {
      onComplete(formData as OnboardingData);
    }
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
          {/* Stage 1: Your Idea (Products) */}
          {currentStep === 1 && (
            <StepOne 
              onNext={handleStepOne}
              initialValue={formData.idea}
            />
          )}
          
          {/* Stage 2: About You */}
          {currentStep === 2 && (
            <StepAboutYouMobile 
              onNext={handleStepAboutYou}
              onBack={goBack}
              initialValue={formData.aboutYou}
              isLoading={false}
            />
          )}

          {/* Stage 3: Audience Selection */}
          {currentStep === 3 && (
            <StepTwoMultiSelect 
              onNext={handleAudienceSelect}
              onBack={goBack}
              initialValue={formData.audiences?.[0]}
              isLoading={false}
            />
          )}

          {/* Stage 4: Business Identity (Name + Logo) */}
          {currentStep === 4 && (
            <StepBusinessIdentity
              onNext={handleBusinessIdentity}
              onBack={goBack}
              initialValue={formData.businessIdentity}
              idea={formData.idea || ''}
              aboutYou={formData.aboutYou || {
                firstName: '',
                lastName: '',
                expertise: '',
                motivation: '',
                styles: [],
                includeFirstName: false,
                includeLastName: false
              }}
              audience={formData.audiences?.[0] || ''}
            />
          )}
          
          {/* Stage 5: Shopfront Preview (Celebration) */}
          {currentStep === 5 && formData.idea && formData.aboutYou && formData.audiences && formData.businessIdentity && (
            <StarterPackReveal
              idea={formData.idea}
              aboutYou={formData.aboutYou}
              audience={formData.audiences[0]}
              businessIdentity={formData.businessIdentity}
              introCampaign={formData.introCampaign}
              products={formData.products}
              onUnlock={handleShopfrontContinue}
              onBack={goBack}
            />
          )}

          {/* Stage 6: Social Media Kickstart (Final Step) */}
          {currentStep === 6 && formData.aboutYou && formData.idea && formData.audiences && (
            <SocialPostPreview
              firstName={formData.aboutYou.firstName}
              expertise={formData.aboutYou.expertise}
              motivation={formData.aboutYou.motivation}
              styles={formData.aboutYou.styles}
              audiences={formData.audiences}
              idea={formData.idea}
              onContinue={handleSocialPostsComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
};