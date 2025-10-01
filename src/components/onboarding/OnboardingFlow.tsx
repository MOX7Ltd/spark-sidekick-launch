import React, { useState, useEffect } from 'react';
import { StepOne } from './StepOne';
import { StepAboutYouMobile } from './StepAboutYouMobile';
import { StepAboutBusiness } from './StepAboutBusiness';
import { SocialPostPreview } from './SocialPostPreview';
import { StepBusinessIdentity } from './StepBusinessIdentity';
import { StarterPackReveal } from './StarterPackReveal';
import { StarterPackCheckout } from './StarterPackCheckout';
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
    profilePicture?: string;
    includeFirstName: boolean;
    includeLastName: boolean;
  };
  vibes: string[];
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

  // Stage 2: About You (Name, Why, Story)
  const handleStepAboutYou = (aboutYou: { 
    firstName: string; 
    lastName: string;
    expertise: string;
    motivation: string;
    profilePicture?: string;
    includeFirstName: boolean;
    includeLastName: boolean;
  }) => {
    setFormData(prev => ({ ...prev, aboutYou }));
    setCurrentStep(3); // Go to business info (vibes + audiences)
  };

  // Stage 3: About Your Business (Vibe & Style + Target Audience)
  const handleAboutBusiness = (data: { vibes: string[]; audiences: string[] }) => {
    setFormData(prev => ({ ...prev, vibes: data.vibes, audiences: data.audiences }));
    setCurrentStep(4); // Go to business identity (name + logo)
  };

  // Stage 4: Business Identity (Name + Logo)
  const handleBusinessIdentity = (businessIdentity: OnboardingData['businessIdentity']) => {
    setFormData(prev => ({ ...prev, businessIdentity }));
    setCurrentStep(5); // Go to shopfront preview
  };

  // Stage 6: Shopfront Preview (Celebration)
  const handleShopfrontContinue = () => {
    setCurrentStep(7); // Go to social media posts
  };

  // Stage 7: Social Media Posts
  const handleSocialPostsComplete = () => {
    setCurrentStep(8); // Go to checkout
  };

  // Stage 8: Starter Pack Checkout (Final Step)
  const handleCheckoutComplete = () => {
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

          {/* Stage 3: About Your Business (Vibe + Audience) */}
          {currentStep === 3 && (
            <StepAboutBusiness 
              onNext={handleAboutBusiness}
              onBack={goBack}
              initialVibes={formData.vibes}
              initialAudiences={formData.audiences}
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
                includeFirstName: false,
                includeLastName: false
              }}
              audience={formData.audiences?.[0] || ''}
              vibes={formData.vibes || []}
            />
          )}
          
          {/* Stage 6: Shopfront Preview (Celebration) */}
          {currentStep === 5 && formData.idea && formData.aboutYou && formData.audiences && formData.businessIdentity && (
            <StarterPackReveal
              idea={formData.idea}
              aboutYou={{
                ...formData.aboutYou,
                styles: formData.vibes || []
              }}
              audience={formData.audiences[0]}
              businessIdentity={formData.businessIdentity}
              introCampaign={formData.introCampaign}
              products={formData.products}
              onUnlock={handleShopfrontContinue}
              onBack={goBack}
            />
          )}

          {/* Stage 7: Social Media Kickstart */}
          {currentStep === 7 && formData.aboutYou && formData.idea && formData.audiences && formData.vibes && (
            <SocialPostPreview
              firstName={formData.aboutYou.firstName}
              expertise={formData.aboutYou.expertise}
              motivation={formData.aboutYou.motivation}
              styles={formData.vibes}
              audiences={formData.audiences}
              idea={formData.idea}
              onContinue={handleSocialPostsComplete}
            />
          )}

          {/* Stage 8: Starter Pack Checkout */}
          {currentStep === 8 && formData.businessIdentity && (
            <StarterPackCheckout
              businessName={formData.businessIdentity.name}
              onContinue={handleCheckoutComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
};