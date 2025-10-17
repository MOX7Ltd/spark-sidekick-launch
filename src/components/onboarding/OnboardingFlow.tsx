import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepOne } from './StepOne';
import { StepAboutYouMobile } from './StepAboutYouMobile';
import { StepAboutYouVibe } from './StepAboutYouVibe';
import { SocialPostPreview } from './SocialPostPreview';
import { StepBusinessIdentity } from './StepBusinessIdentity';
import { StarterPackReveal } from './StarterPackReveal';
import { StarterPackRevealV2 } from './launch/StarterPackRevealV2';
import { StarterPackPricingCard } from './launch/StarterPackPricingCard';
import { ProgressJourney, getStepKey } from './ProgressJourney';
import { SubProgressBar } from './SubProgressBar';
import { EmailSaveDialog } from './EmailSaveDialog';
import { useToast } from '@/hooks/use-toast';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { logFrontendEvent } from '@/lib/frontendEventLogger';
import { DebugPanel } from '@/components/debug/DebugPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import type { OnboardingData } from '@/types/onboarding';
import type { BrandContext } from '@/types/brand';
import { generateBusinessIdentity, generateLogos, generateCampaign } from '@/lib/api';

interface OnboardingFlowProps {
  onComplete?: (data: OnboardingData) => void;
  initialStep?: number;
  restoredSession?: {
    formData: any;
    step: number;
    businessId: string | null;
    context: any;
    sessionId: string;
  };
}

export const OnboardingFlow = ({ onComplete, initialStep = 1, restoredSession }: OnboardingFlowProps) => {
  // Use new persistent state hook
  const {
    sessionId,
    formData,
    currentStep,
    businessId,
    context: savedContext,
    isRestoring,
    isSyncing,
    updateFormData,
    setCurrentStep: setStep,
    setBusinessId,
    updateContext: updateSavedContext,
    syncToServer,
    restoreState,
    generateWithCache,
    selectAIGeneration,
  } = useOnboardingState(initialStep);

  // Local state for BrandContext (merged with saved)
  const [context, setContext] = useState<BrandContext>({
    idea_text: '',
    families_ranked: [],
    dominant_family: 'Digital',
    tone_adjectives: [],
    audience: [],
    personal_brand: false,
    palette: [],
    business_name: undefined,
    logo_style: undefined,
    ...savedContext,
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCheckedForRecovery, setHasCheckedForRecovery] = useState(false);
  
  // Step 2 sub-step tracking (0-3 for Name, Why, Ready, Vibe)
  const [step2SubStep, setStep2SubStep] = useState(0);
  const [bioLocked, setBioLocked] = useState(formData.aboutYou?.bioLocked || false);
  
  // Email save dialog
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const { toast } = useToast();

  // If we have a restored session, switch the browser to that session ID
  useEffect(() => {
    if (restoredSession?.sessionId) {
      localStorage.setItem('sidehive_session_id', restoredSession.sessionId);
      const params = new URLSearchParams(window.location.search);
      params.set('sid', restoredSession.sessionId);
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }
  }, [restoredSession]);
  const navigate = useNavigate();
  
  // Only auto-restore if we're past Step 1 (user is committed to this session)
  useEffect(() => {
    const autoRestoreIfCommitted = async () => {
      if (currentStep > 0 && !hasCheckedForRecovery) {
        setHasCheckedForRecovery(true);
        const restored = await restoreState();
        if (restored && savedContext) {
          setContext(prev => ({ ...prev, ...savedContext }));
        }
      }
    };
    
    autoRestoreIfCommitted();
  }, [currentStep, hasCheckedForRecovery, restoreState, savedContext]);

  // Context updater callback - now also syncs to persistent storage
  const onUpdateContext = useCallback(
    (updater: (ctx: BrandContext) => BrandContext) => {
      setContext((prev) => {
        const updated = updater(prev);
        console.log('BrandContext updated:', updated);
        
        // Also update persistent context
        updateSavedContext(updated);
        
        return updated;
      });
    },
    [updateSavedContext]
  );

  // Wrapped generate functions that use unified context + caching
  const handleGenerateIdentity = useCallback(async () => {
    try {
      // Build request from context
      const request = {
        idea: context.idea_text,
        audiences: context.audience || context.audiences || [],
        vibes: context.tone_adjectives || context.vibes || [],
        aboutYou: {
          firstName: context.user_first_name || '',
          lastName: context.user_last_name || '',
          expertise: context.expertise || '',
          motivation: context.motivation || '',
          includeFirstName: context.personal_brand || false,
          includeLastName: context.personal_brand || false,
        },
      };
      
      // Use cached generation
      const cached = await generateWithCache('business_identity', request);
      
      if (cached) {
        // Use cached result
        const res = cached.payload?.response || cached.payload;
        
        // Merge response into context
        onUpdateContext((ctx) => ({
          ...ctx,
          bio: res.bio,
          palette: res.colors,
          tone_adjectives: ctx.tone_adjectives || [],
          audience: ctx.audience || [],
        }));
        
        return res;
      }
      
      // Fallback to direct API call if cache fails
      const res = await generateBusinessIdentity(request);
      
      // Merge response into context
      onUpdateContext((ctx) => ({
        ...ctx,
        bio: res.bio,
        palette: res.colors,
        tone_adjectives: ctx.tone_adjectives || [],
        audience: ctx.audience || [],
      }));
      
      return res;
    } catch (error) {
      console.error('Failed to generate identity:', error);
      throw error;
    }
  }, [context, onUpdateContext, generateWithCache]);
  
  const handleGenerateLogos = useCallback(async (businessName: string, style: string) => {
    try {
      const logos = await generateLogos(
        businessName,
        style,
        context.vibes || context.tone_adjectives || [],
        context.idea_text,
        context
      );
      return logos;
    } catch (error) {
      console.error('Failed to generate logos:', error);
      throw error;
    }
  }, [context]);
  
  const handleGenerateCampaign = useCallback(async (products: any[]) => {
    try {
      const res = await generateCampaign(context, products);
      return res;
    } catch (error) {
      console.error('Failed to generate campaign:', error);
      throw error;
    }
  }, [context]);

  // Scroll to top and log step transitions
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Log step transition
    const stepNames = ['', 'StepOne', 'StepAboutYou', 'StepAboutBusiness', 'StepBusinessIdentity', 'StarterPackReveal', 'SocialPostPreview', 'LaunchPricing'];
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
    
    // Update persistent form data
    updateFormData({ idea, products });
    
    // Update context
    onUpdateContext((ctx) => ({
      ...ctx,
      idea_text: idea,
    }));
    
    setStep(2);
  };

  // Stage 2: About You (Name, Why, Story) - Now with sub-steps
  const handleStepAboutYou = async (aboutYou: { 
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
        subStep: step2SubStep,
        includeFirstName: aboutYou.includeFirstName,
        includeLastName: aboutYou.includeLastName,
        hasProfilePicture: !!aboutYou.profilePicture
      }
    });
    
    // Update context with user information
    onUpdateContext((ctx) => ({
      ...ctx,
      user_first_name: aboutYou.firstName,
      user_last_name: aboutYou.lastName,
      expertise: aboutYou.expertise,
      motivation: aboutYou.motivation,
      personal_brand: aboutYou.includeFirstName || aboutYou.includeLastName,
    }));
    
    // Update persistent form data
    updateFormData({ aboutYou });
    
    // Auto-save after sub-step completion
    await syncToServer();
    
    toast({
      title: "✅ Saved",
      description: "Your progress has been saved.",
    });
    
    // Advance to next sub-step (Vibe & Audience)
    setStep2SubStep(3);
    setStep(3); // Go to vibe & audience step
  };

  // Stage 3: Vibe & Audience + Bio (final sub-step of Step 2)
  const handleVibeAndBio = async (data: { 
    vibes: string[]; 
    audiences: string[]; 
    bio: string;
    bioLocked: boolean;
    bioAttempts: number;
    bioHistory: string[];
  }) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'StepAboutYouVibe',
      payload: { 
        action: 'submit_vibe_and_bio',
        vibes: data.vibes,
        audiences: data.audiences,
        bioLocked: data.bioLocked,
        bioAttempts: data.bioAttempts
      }
    });
    
    // Update context with vibes, audiences, and bio
    onUpdateContext((ctx) => ({
      ...ctx,
      vibes: data.vibes,
      audiences: data.audiences,
      tone_adjectives: data.vibes,
      audience: data.audiences,
      bio: data.bio,
    }));
    
    // Update form data
    updateFormData({ 
      vibes: data.vibes, 
      audiences: data.audiences,
      aboutYou: {
        ...formData.aboutYou,
        bio: data.bio,
        bioLocked: data.bioLocked,
        bioAttempts: data.bioAttempts,
        bioHistory: data.bioHistory,
      }
    });
    
    setBioLocked(data.bioLocked);
    
    // Auto-save
    await syncToServer();
    
    toast({
      title: "✅ Saved",
      description: "Your vibe and bio have been saved.",
    });
    
    // Check for email before continuing to Step 3
    if (!formData.aboutYou?.email) {
      setShowEmailDialog(true);
      return;
    }
    
    // Advance to Step 3 (Create Your Brand)
    setStep(4);
  };

  // Stage 4: Business Identity (Name + Logo)
  const handleBusinessIdentity = (businessIdentity: OnboardingData['businessIdentity']) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'StepBusinessIdentity',
      payload: { 
        action: 'submit_business_identity',
        businessName: businessIdentity.name,
        logoSource: businessIdentity.logoSource
      }
    });
    
    // Update context with business name and logo style
    onUpdateContext((ctx) => ({
      ...ctx,
      business_name: businessIdentity.name,
      logo_style: businessIdentity.logoSource === 'generated' ? 'modern' : undefined,
      palette: businessIdentity.colors || ctx.palette,
    }));
    
    // Update persistent form data
    updateFormData({ businessIdentity });
    
    setStep(5); // Go to shopfront preview
  };

  // Stage 5: Shopfront Preview (Celebration)
  const handleShopfrontContinue = () => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'StarterPackReveal',
      payload: { action: 'view_shopfront_preview' }
    });
    setStep(6); // Go to social media posts
  };

  // Stage 6: Social Media Posts
  const handleSocialPostsComplete = () => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'SocialPostPreview',
      payload: { action: 'complete_social_posts' }
    });
    setStep(7); // Go to checkout
  };

  // Checkout: Starter Pack (Final Step - not counted in onboarding)
  const handleCheckoutComplete = () => {
    if (onComplete && formData.idea && formData.aboutYou && formData.audiences && formData.businessIdentity) {
      onComplete(formData as OnboardingData);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      const stepNames = ['', 'StepOne', 'StepAboutYou', 'StepAboutBusiness', 'StepBusinessIdentity', 'StarterPackReveal', 'SocialPostPreview', 'LaunchPricing'];
      logFrontendEvent({
        eventType: 'user_action',
        step: stepNames[currentStep] || 'Unknown',
        payload: { action: 'go_back', fromStep: currentStep, toStep: currentStep - 1 }
      });
      setStep(currentStep - 1);
    }
  };

  // Composite component for Step 7: Launch Experience
  const FinaliseLaunchStep = ({ formData, sessionId, onCheckoutComplete }: { 
    formData: Partial<OnboardingData>;
    sessionId: string;
    onCheckoutComplete: () => void;
  }) => {
    const [stage, setStage] = useState<'reveal' | 'pricing'>('reveal');
    const [session, setSession] = useState<any>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [signupData, setSignupData] = useState({ email: '', password: '', name: '' });

    useEffect(() => {
      const checkAuth = async () => {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setIsCheckingAuth(false);
      };
      checkAuth();
    }, []);

    const handleInlineSignup = () => {
      // Route to signup page with redirect back to this step
      navigate('/auth/signup?next=/onboarding/final');
    };

    const handleStartCheckout = async () => {
      if (!session) {
        toast({
          title: "Please create your account to continue",
          variant: "destructive"
        });
        return;
      }

      try {
        const deviceId = sessionId;
        const response = await supabase.functions.invoke('create-starter-session', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'X-Session-Id': deviceId,
          },
          body: {
            session_id: deviceId,
            flow: 'starter_pack'
          }
        });

        if (response.error) throw response.error;
        if (response.data?.url) {
          window.location.href = response.data.url;
        }
      } catch (error) {
        console.error('Checkout error:', error);
        toast({
          title: "Couldn't start checkout",
          description: "Please try again or contact support.",
          variant: "destructive",
        });
      }
    };

    if (isCheckingAuth) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      );
    }

    // If no session, show CTA to route to signup
    if (!session) {
      return (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your brand is live-ready! Create an account to unlock your hub and start selling.
            </p>
            <Button
              onClick={handleInlineSignup}
              size="lg"
              className="w-full"
            >
              Continue
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/auth/signin?next=/onboarding/final')}
                className="underline"
              >
                Sign in
              </button>
            </p>
          </CardContent>
        </Card>
      );
    }

    switch (stage) {
      case 'reveal':
        return (
          <StarterPackRevealV2
            businessName={formData.businessIdentity?.name || 'Your Business'}
            logoUrl={formData.businessIdentity?.logoUrl || formData.businessIdentity?.logoSVG}
            brandColors={formData.businessIdentity?.colors}
            onContinue={() => setStage('pricing')}
          />
        );
      case 'pricing':
        return (
          <StarterPackPricingCard
            onStartCheckout={handleStartCheckout}
          />
        );
      default:
        return null;
    }
  };

  // Step labels for progress bar - remapped to show Step 2 for both "About You" and "Vibe & Audience"
  const getStepLabel = (step: number): string => {
    const labels = {
      1: 'Your Idea',
      2: 'About You',
      3: 'About You', // Maps to Step 2 of 4 in UI
      4: 'Create Your Brand'
    };
    return labels[step as keyof typeof labels] || '';
  };

  // Get display step number for progress bar (UI-only mapping)
  const getDisplayStep = (step: number): number => {
    if (step <= 2) return step; // Step 1-2 stay as is
    if (step === 3) return 2;   // Step 3 shows as Step 2
    if (step === 4) return 3;   // Step 4 shows as Step 3
    return step;
  };

  return (
    <>      
      <div className="min-h-[80vh] py-6 md:py-8 overflow-x-hidden">
      {/* Progress Journey - Sticky navbar for main onboarding steps (1-4) */}
      {currentStep <= 4 && (
        <ProgressJourney current={getStepKey(currentStep, { bioLocked })} />
      )}
      
      {/* Sub-progress for Step 2 (About You) */}
      {currentStep >= 2 && currentStep <= 3 && (
        <SubProgressBar
          currentSubStep={step2SubStep}
          totalSubSteps={4}
          labels={['Name', 'Why', 'Ready', 'Vibe & Audience']}
        />
      )}
      
      <div className="max-w-screen-sm mx-auto px-3 sm:px-4 w-full">
        <div className="min-h-[60vh] flex items-center justify-center">
          {/* Stage 1: Your Idea (Products) */}
          {currentStep === 1 && (
            <StepOne 
              onNext={handleStepOne}
              onUpdateContext={onUpdateContext}
              initialValue={formData.idea}
              formData={formData}
              updateFormData={updateFormData}
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

          {/* Stage 3: Vibe & Audience + Bio (Step 2.4) */}
          {currentStep === 3 && (
            <StepAboutYouVibe 
              onNext={handleVibeAndBio}
              onBack={goBack}
              initialVibes={formData.vibes}
              initialAudiences={formData.audiences}
              initialBio={formData.aboutYou?.bio}
              initialBioLocked={formData.aboutYou?.bioLocked}
              initialBioAttempts={formData.aboutYou?.bioAttempts || 0}
              initialBioHistory={formData.aboutYou?.bioHistory || []}
              idea={formData.idea || ''}
              aboutYou={formData.aboutYou}
              isLoading={false}
              onAutoSave={syncToServer}
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
              audiences={formData.audiences || []}
              vibes={formData.vibes || []}
              context={context}
              onUpdateContext={onUpdateContext}
              onGenerateIdentity={handleGenerateIdentity}
              onGenerateLogos={handleGenerateLogos}
            />
          )}
          
          {/* Stage 5: Shopfront Preview (Celebration) */}
          {currentStep === 5 && formData.idea && formData.aboutYou && formData.audiences && formData.businessIdentity && (
            <StarterPackReveal
              businessIdentity={formData.businessIdentity}
              products={formData.products || []}
              onContinue={handleShopfrontContinue}
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

          {/* Step 7: Launch Experience (Auth → Reveal → Pricing → Checkout) */}
          {currentStep === 7 && (
            <FinaliseLaunchStep
              formData={formData}
              sessionId={sessionId}
              onCheckoutComplete={handleCheckoutComplete}
            />
          )}
        </div>
      </div>
      
      <DebugPanel info={{ 
        step: ['', 'StepOne', 'StepAboutYou', 'StepAboutYouVibe', 'StepBusinessIdentity', 'StarterPackReveal', 'SocialPostPreview', 'LaunchPricing'][currentStep],
        brandContext: context
      }} />
    </div>
    
    {/* Email Save Dialog */}
    <EmailSaveDialog
      open={showEmailDialog}
      onClose={() => setShowEmailDialog(false)}
      onSaved={(email) => {
        updateFormData({ 
          aboutYou: { 
            ...formData.aboutYou, 
            email 
          } 
        });
        setShowEmailDialog(false);
        setStep(4); // Continue to Step 3
      }}
      onSkip={() => {
        setShowEmailDialog(false);
        setStep(4); // Continue anyway
      }}
      onFormDataUpdate={(data) => {
        updateFormData({
          aboutYou: {
            ...formData.aboutYou,
            ...data.aboutYou
          }
        });
      }}
      currentIdea={formData.idea}
    />
    </>
  );
};