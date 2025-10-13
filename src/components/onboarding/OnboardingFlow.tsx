import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepOne } from './StepOne';
import { StepAboutYouMobile } from './StepAboutYouMobile';
import { StepAboutBusiness } from './StepAboutBusiness';
import { SocialPostPreview } from './SocialPostPreview';
import { StepBusinessIdentity } from './StepBusinessIdentity';
import { StarterPackReveal } from './StarterPackReveal';
import { StarterPackRevealV2 } from './launch/StarterPackRevealV2';
import { StarterPackPricingCard } from './launch/StarterPackPricingCard';
import { ProgressBar } from './ProgressBar';
import { useToast } from '@/hooks/use-toast';
import { logFrontendEvent } from '@/lib/frontendEventLogger';
import { DebugPanel } from '@/components/debug/DebugPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/telemetry';
import type { OnboardingData } from '@/types/onboarding';
import type { BrandContext } from '@/types/brand';
import { generateBusinessIdentity, generateLogos, generateCampaign } from '@/lib/api';

interface OnboardingFlowProps {
  onComplete?: (data: OnboardingData) => void;
  initialStep?: number;
}

export const OnboardingFlow = ({ onComplete, initialStep = 1 }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
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
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Context updater callback
  const onUpdateContext = useCallback(
    (updater: (ctx: BrandContext) => BrandContext) => {
      setContext((prev) => {
        const updated = updater(prev);
        console.log('BrandContext updated:', updated);
        return updated;
      });
    },
    []
  );
  
  // Wrapped generate functions that use unified context
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
  }, [context, onUpdateContext]);
  
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
    
    // Update context with user information
    onUpdateContext((ctx) => ({
      ...ctx,
      user_first_name: aboutYou.firstName,
      user_last_name: aboutYou.lastName,
      expertise: aboutYou.expertise,
      motivation: aboutYou.motivation,
      personal_brand: aboutYou.includeFirstName || aboutYou.includeLastName,
    }));
    
    setFormData(prev => ({ ...prev, aboutYou }));
    setCurrentStep(3); // Go to business info (vibes + audiences)
  };

  // Stage 3: About Your Business (Vibe & Style + Target Audience)
  const handleAboutBusiness = (data: { vibes: string[]; audiences: string[]; businessIdentity?: any }) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'StepAboutBusiness',
      payload: { 
        action: 'submit_business_info',
        vibes: data.vibes,
        audiences: data.audiences,
        hasBio: !!data.businessIdentity?.bio
      }
    });
    
    // Update context with vibes and audiences
    onUpdateContext((ctx) => ({
      ...ctx,
      vibes: data.vibes,
      audiences: data.audiences,
      tone_adjectives: data.vibes,
      audience: data.audiences,
    }));
    
    // Save vibes, audiences, and potentially the bio if already generated
    const updates: any = { vibes: data.vibes, audiences: data.audiences };
    if (data.businessIdentity?.bio) {
      updates.businessIdentity = {
        ...formData.businessIdentity,
        ...data.businessIdentity
      };
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
    setCurrentStep(4); // Go to business identity (name + logo)
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
      const stepNames = ['', 'StepOne', 'StepAboutYou', 'StepAboutBusiness', 'StepBusinessIdentity', 'StarterPackReveal', 'SocialPostPreview', 'LaunchPricing'];
      logFrontendEvent({
        eventType: 'user_action',
        step: stepNames[currentStep] || 'Unknown',
        payload: { action: 'go_back', fromStep: currentStep, toStep: currentStep - 1 }
      });
      setCurrentStep(currentStep - 1);
    }
  };

  // Composite component for Step 7: Launch Experience
  const FinaliseLaunchStep = ({ formData, onCheckoutComplete }: { 
    formData: Partial<OnboardingData>; 
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

    const handleInlineSignup = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSigningUp(true);

      try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: signupData.email,
          password: signupData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding/final`,
            data: { display_name: signupData.name || undefined }
          }
        });

        if (signUpError) throw signUpError;

        // Auto sign-in if session wasn't created
        if (!signUpData.session) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: signupData.email,
            password: signupData.password,
          });
          if (signInError) throw signInError;
          setSession(signInData.session);
        } else {
          setSession(signUpData.session);
        }

        // Call migration
        const deviceId = getSessionId();
        await supabase.functions.invoke('migrate-onboarding-to-user', {
          headers: {
            Authorization: `Bearer ${signUpData.session?.access_token || ''}`,
          },
          body: { session_id: deviceId }
        });

        toast({ title: 'Account created!', description: 'Welcome to SideHive.' });
      } catch (error: any) {
        toast({
          title: 'Signup failed',
          description: error.message || 'Please try again',
          variant: 'destructive'
        });
      } finally {
        setIsSigningUp(false);
      }
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
        const deviceId = getSessionId();
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

    // If no session, show inline signup before reveal
    if (!session) {
      return (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInlineSignup} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your brand is live-ready! Create an account to unlock your hub and start selling.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">Name (optional)</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                  minLength={8}
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={isSigningUp}
                className="w-full"
              >
                {isSigningUp ? 'Creating account...' : 'Continue with email'}
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
            </form>
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
    <div className="min-h-[80vh] py-6 md:py-8 overflow-x-hidden">
      {/* Progress Bar - Only show for main onboarding steps (1-4) */}
      {currentStep <= 4 && (
        <ProgressBar 
          currentStep={getDisplayStep(currentStep)} 
          totalSteps={4} 
          stepLabel={getStepLabel(currentStep)}
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
              idea={formData.idea || ''}
              aboutYou={formData.aboutYou}
              businessIdentity={formData.businessIdentity}
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
              onCheckoutComplete={handleCheckoutComplete}
            />
          )}
        </div>
      </div>
      
      <DebugPanel info={{ 
        step: ['', 'StepOne', 'StepAboutYou', 'StepAboutBusiness', 'StepBusinessIdentity', 'StarterPackReveal', 'SocialPostPreview', 'LaunchPricing'][currentStep],
        brandContext: context
      }} />
    </div>
  );
};