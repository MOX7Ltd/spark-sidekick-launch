import { useState, useEffect } from 'react';
import { StepOne } from '../onboarding/StepOne';
import { StepAboutYouMobile } from '../onboarding/StepAboutYouMobile';
import { StepAboutBusiness } from '../onboarding/StepAboutBusiness';
import { StepBusinessIdentity } from '../onboarding/StepBusinessIdentity';
import { ProgressBar } from '../onboarding/ProgressBar';
import { logFrontendEvent } from '@/lib/frontendEventLogger';
import type { OnboardingData } from '@/types/onboarding';

interface CreateProfileWizardProps {
  onComplete: (data: OnboardingData) => void;
}

export const CreateProfileWizard = ({ onComplete }: CreateProfileWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const stepNames = ['', 'Your Idea', 'About You', 'About Your Business', 'Create Your Brand'];
    if (currentStep > 0 && currentStep < stepNames.length) {
      logFrontendEvent({
        eventType: 'step_transition',
        step: stepNames[currentStep],
        payload: { stepNumber: currentStep, context: 'hub_profile_wizard' }
      });
    }
  }, [currentStep]);

  // Step 1: Your Idea
  const handleStepOne = async (idea: string, products: any[]) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'Your Idea',
      payload: { action: 'submit_idea', productCount: products.length, context: 'hub_profile_wizard' }
    });
    setFormData(prev => ({ ...prev, idea, products }));
    setCurrentStep(2);
  };

  // Step 2: About You
  const handleStepAboutYou = (aboutYou: OnboardingData['aboutYou']) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'About You',
      payload: { 
        action: 'submit_about_you',
        includeFirstName: aboutYou.includeFirstName,
        includeLastName: aboutYou.includeLastName,
        context: 'hub_profile_wizard'
      }
    });
    setFormData(prev => ({ ...prev, aboutYou }));
    setCurrentStep(3);
  };

  // Step 3: About Your Business (vibes + audiences + bio)
  const handleAboutBusiness = (data: { vibes: string[]; audiences: string[]; businessIdentity?: any }) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'About Your Business',
      payload: { 
        action: 'submit_business_info',
        vibes: data.vibes,
        audiences: data.audiences,
        hasBio: !!data.businessIdentity?.bio,
        context: 'hub_profile_wizard'
      }
    });
    
    const updates: any = { vibes: data.vibes, audiences: data.audiences };
    if (data.businessIdentity?.bio) {
      updates.businessIdentity = {
        ...formData.businessIdentity,
        ...data.businessIdentity
      };
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
    setCurrentStep(4);
  };

  // Step 4: Create Your Brand (name + logo)
  const handleBusinessIdentity = async (businessIdentity: OnboardingData['businessIdentity']) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'Create Your Brand',
      payload: { 
        action: 'submit_business_identity',
        businessName: businessIdentity.name,
        logoSource: businessIdentity.logoSource,
        context: 'hub_profile_wizard'
      }
    });
    
    const finalData: OnboardingData = {
      idea: formData.idea || '',
      products: formData.products || [],
      aboutYou: formData.aboutYou || {
        firstName: '',
        lastName: '',
        expertise: '',
        includeFirstName: false,
        includeLastName: false
      },
      vibes: formData.vibes || [],
      audiences: formData.audiences || [],
      businessIdentity
    };
    
    onComplete(finalData);
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepLabel = (step: number): string => {
    const labels = {
      1: 'Your Idea',
      2: 'About You',
      3: 'About Your Business',
      4: 'Create Your Brand'
    };
    return labels[step as keyof typeof labels] || '';
  };

  return (
    <div className="min-h-screen py-6 md:py-8">
      <ProgressBar 
        currentStep={currentStep} 
        totalSteps={4} 
        stepLabel={getStepLabel(currentStep)}
      />
      
      <div className="max-w-screen-sm mx-auto px-3 sm:px-4 w-full">
        <div className="min-h-[60vh] flex items-center justify-center">
          {/* Step 1: Your Idea */}
          {currentStep === 1 && (
            <StepOne 
              onNext={handleStepOne}
              initialValue={formData.idea}
            />
          )}
          
          {/* Step 2: About You */}
          {currentStep === 2 && (
            <StepAboutYouMobile 
              onNext={handleStepAboutYou}
              onBack={goBack}
              initialValue={formData.aboutYou}
              isLoading={false}
            />
          )}

          {/* Step 3: About Your Business */}
          {currentStep === 3 && (
            <StepAboutBusiness 
              onNext={handleAboutBusiness}
              onBack={goBack}
              initialVibes={formData.vibes}
              initialAudiences={formData.audiences}
              idea={formData.idea || ''}
              aboutYou={formData.aboutYou}
              businessIdentity={formData.businessIdentity}
              isLoading={false}
            />
          )}

          {/* Step 4: Create Your Brand */}
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
              audiences={formData.audiences || []}
              vibes={formData.vibes || []}
            />
          )}
        </div>
      </div>
    </div>
  );
};
