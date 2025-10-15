import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  getSessionId,
  getFormState,
  getStepState,
  getDraftBusinessId,
  getContext,
  OnboardingFormState,
  clearOnboardingState,
} from '@/lib/telemetry';
import {
  saveOnboardingSession,
  restoreOnboardingSession,
  cacheAIGeneration,
  selectGeneration,
} from '@/lib/onboardingSync';

export interface UseOnboardingStateReturn {
  sessionId: string;
  formData: OnboardingFormState;
  currentStep: number;
  businessId: string | null;
  context: any;
  isRestoring: boolean;
  isSyncing: boolean;
  
  // Actions
  updateFormData: (data: Partial<OnboardingFormState>) => void;
  setCurrentStep: (step: number) => void;
  setBusinessId: (id: string) => void;
  updateContext: (ctx: any) => void;
  syncToServer: () => Promise<void>;
  restoreState: () => Promise<boolean>;
  generateWithCache: (stage: string, inputs: any, model?: string) => Promise<any>;
  selectAIGeneration: (generationId: string, itemId?: string) => Promise<void>;
  clearState: () => void;
}

export function useOnboardingState(initialStep: number = 0): UseOnboardingStateReturn {
  const { toast } = useToast();
  const [sessionId] = useState(() => getSessionId());
  const [formData, setFormData] = useState<OnboardingFormState>(() => getFormState() || {});
  const [currentStep, setStep] = useState<number>(() => {
    const saved = getStepState();
    return saved ? parseInt(saved, 10) : initialStep;
  });
  const [businessId, setBusinessIdState] = useState<string | null>(() => getDraftBusinessId());
  const [context, setContextState] = useState<any>(() => getContext() || {});
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Auto-sync timer ref
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync to server
  const syncToServer = useCallback(async () => {
    setIsSyncing(true);
    try {
      await saveOnboardingSession(formData, currentStep, context, businessId || undefined);
    } catch (error) {
      console.error('Failed to sync onboarding state:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [formData, currentStep, context, businessId]);

  // Restore state from server
  const restoreState = useCallback(async (): Promise<boolean> => {
    setIsRestoring(true);
    try {
      const result = await restoreOnboardingSession(sessionId);
      
      if (result.success && result.data) {
        const { state, profile, business, generations } = result.data;
        
        // Restore form data
        if (state?.context) {
          setFormData(state.context);
        }
        
        // Restore step
        if (state?.step) {
          const stepNum = parseInt(state.step, 10);
          if (!isNaN(stepNum)) {
            setStep(stepNum);
          }
        }
        
        // Restore business ID
        if (business?.id) {
          setBusinessIdState(business.id);
        }
        
        // Restore context
        if (state?.context) {
          setContextState(state.context);
        }

        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to restore onboarding state:', error);
      return false;
    } finally {
      setIsRestoring(false);
    }
  }, [sessionId]);

  // Update form data
  const updateFormData = useCallback((data: Partial<OnboardingFormState>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  // Set current step
  const setCurrentStep = useCallback((step: number) => {
    setStep(step);
    // Trigger sync when step changes
    syncToServer();
  }, [syncToServer]);

  // Set business ID
  const setBusinessId = useCallback((id: string) => {
    setBusinessIdState(id);
  }, []);

  // Update context
  const updateContext = useCallback((ctx: any) => {
    setContextState(prev => ({ ...prev, ...ctx }));
  }, []);

  // Generate with cache
  const generateWithCache = useCallback(async (stage: string, inputs: any, model?: string) => {
    try {
      const result = await cacheAIGeneration(stage, inputs, model);
      
      if (result.cached) {
        toast({
          title: 'Using cached result',
          description: 'We found a previous generation for this request.',
        });
      }
      
      return result.generation;
    } catch (error) {
      console.error('Failed to generate with cache:', error);
      toast({
        title: 'Generation failed',
        description: 'Failed to generate content. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Select AI generation
  const selectAIGeneration = useCallback(async (generationId: string, itemId?: string) => {
    try {
      await selectGeneration(generationId, itemId, businessId || undefined);
    } catch (error) {
      console.error('Failed to select generation:', error);
    }
  }, [businessId]);

  // Clear state
  const clearState = useCallback(() => {
    clearOnboardingState();
    setFormData({});
    setStep(0);
    setBusinessIdState(null);
    setContextState({});
  }, []);

  // Auto-sync every 30 seconds
  useEffect(() => {
    syncTimerRef.current = setInterval(() => {
      if (!isSyncing) {
        syncToServer();
      }
    }, 30000);

    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
    };
  }, [syncToServer, isSyncing]);

  // Sync on unmount
  useEffect(() => {
    return () => {
      syncToServer();
    };
  }, [syncToServer]);

  return {
    sessionId,
    formData,
    currentStep,
    businessId,
    context,
    isRestoring,
    isSyncing,
    updateFormData,
    setCurrentStep,
    setBusinessId,
    updateContext,
    syncToServer,
    restoreState,
    generateWithCache,
    selectAIGeneration,
    clearState,
  };
}
