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
import { logFrontendEvent } from '@/lib/frontendEventLogger';
import { DebugPanel } from '@/components/debug/DebugPanel';

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

  // Scroll to top and log step transitions
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Log step transition
    const stepNames = ['', 'StepOne', 'StepAboutYou', 'StepAboutBusiness', 'StepBusinessIdentity', 'StarterPackReveal', 'SocialPostPreview', 'StarterPackCheckout'];
    if (currentStep > 0 && currentStep < stepNames.length) {
      logFrontendEvent({
        eventType: 'step_transition',
        step: stepNames[currentStep],
        payload: { stepNumber: currentStep }
      });
    }
  }, [currentStep]);

  // Stage 1: Idea + Products
  const handleStepOne = (idea: string, products: any[]) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'StepOne',
      payload: { action: 'submit_idea', productCount: products.length }
    });
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
    logFrontendEvent({
      eventType: 'user_action',
      step: 'StepAboutYou',
      payload: { 
        action: 'submit_about_you',
        includeFirstName: aboutYou.includeFirstName,
        includeLastName: aboutYou.includeLastName,
        hasProfilePicture: !!aboutYou.profilePicture
      }
    });
    setFormData(prev => ({ ...prev, aboutYou }));
    setCurrentStep(3); // Go to business info (vibes + audiences)
  };

  // Stage 3: About Your Business (Vibe & Style + Target Audience)
  const handleAboutBusiness = (data: { vibes: string[]; audiences: string[] }) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'StepAboutBusiness',
      payload: { 
        action: 'submit_business_info',
        vibes: data.vibes,
        audiences: data.audiences
      }
    });
    setFormData(prev => ({ ...prev, vibes: data.vibes, audiences: data.audiences }));
    setCurrentStep(4); // Go to business identity (name + logo)
  };

  // Stage 4: Business Identity (Name + Logo)
  const handleBusinessIdentity = (businessIdentity: OnboardingData['businessIdentity']) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'StepBusinessIdentity',
      payload: { 
        action: 'submit_business_identity',
        businessName: businessIdentity.name
      }
    });
    setFormData(prev => ({ ...prev, businessIdentity }));
    setCurrentStep(5); // Go to shopfront preview
  };

  // Stage 5: Shopfront Preview (Celebration)
  const handleShopfrontContinue = () => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'StarterPackReveal',
      payload: { action: 'view_shopfront_preview' }
    });
    setCurrentStep(6); // Go to social media posts
  };

  // Stage 6: Social Media Posts
  const handleSocialPostsComplete = () => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'SocialPostPreview',
      payload: { action: 'complete_social_posts' }
    });
    setCurrentStep(7); // Go to checkout
  };

  // Checkout: Starter Pack (Final Step - not counted in onboarding)
  const handleCheckoutComplete = () => {
    if (onComplete && formData.idea && formData.aboutYou && formData.audiences && formData.businessIdentity) {
      onComplete(formData as OnboardingData);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      const stepNames = ['', 'StepOne', 'StepAboutYou', 'StepAboutBusiness', 'StepBusinessIdentity', 'StarterPackReveal', 'SocialPostPreview', 'StarterPackCheckout'];
      logFrontendEvent({
        eventType: 'user_action',
        step: stepNames[currentStep] || 'Unknown',
        payload: { action: 'go_back', fromStep: currentStep, toStep: currentStep - 1 }
      });
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-[80vh] py-6 md:py-8 overflow-x-hidden">
      <div className="max-w-screen-sm mx-auto px-3 sm:px-4 w-full">
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
              audience={(formData.audiences || []).join(', ')}
              vibes={formData.vibes || []}
            />
          )}
          
          {/* Stage 5: Shopfront Preview (Celebration) */}
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

          {/* Stage 6: Social Media Kickstart */}
          {currentStep === 6 && formData.aboutYou && formData.businessIdentity && formData.audiences && formData.vibes && formData.products && (
            <SocialPostPreview
              aboutYou={formData.aboutYou}
              vibes={formData.vibes}
              audiences={formData.audiences}
              businessIdentity={formData.businessIdentity}
              products={formData.products}
              onContinue={handleSocialPostsComplete}
            />
          )}

          {/* Checkout: Starter Pack (Not counted in main onboarding steps) */}
          {currentStep === 7 && formData.businessIdentity && (
            <StarterPackCheckout
              businessName={formData.businessIdentity.name}
              onContinue={handleCheckoutComplete}
            />
          )}
        </div>
      </div>
      
      <DebugPanel info={{ 
        step: ['', 'StepOne', 'StepAboutYou', 'StepAboutBusiness', 'StepBusinessIdentity', 'StarterPackReveal', 'SocialPostPreview', 'StarterPackCheckout'][currentStep] 
      }} />
    </div>
  );
};