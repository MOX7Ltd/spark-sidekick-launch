import { supabase } from '@/integrations/supabase/client';
import { 
  getSessionId, 
  saveFormState, 
  saveStepState, 
  saveDraftBusinessId,
  saveContext,
  OnboardingFormState 
} from './telemetry';

/**
 * Save onboarding session to Supabase
 * This is called automatically on step changes and can be called manually
 */
export async function saveOnboardingSession(
  formData: OnboardingFormState,
  currentStep: string | number,
  context?: any,
  businessDraftId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionId = getSessionId();
    
    // Save to localStorage first (instant)
    saveFormState(formData);
    saveStepState(currentStep);
    if (businessDraftId) saveDraftBusinessId(businessDraftId);
    if (context) saveContext(context);

    // Then sync to Supabase (background)
    const { error } = await supabase.functions.invoke('save-onboarding-session', {
      body: {
        session_id: sessionId,
        step: String(currentStep),
        context: context || formData,
        email: formData.aboutYou?.email,
        display_name: formData.aboutYou?.name,
        business_draft_id: businessDraftId,
      },
    });

    if (error) {
      console.error('Failed to sync onboarding session:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to save onboarding session:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Restore onboarding state from Supabase
 */
export async function restoreOnboardingSession(sessionId?: string, userId?: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const sid = sessionId || getSessionId();
    
    const { data, error } = await supabase.functions.invoke('get-onboarding-state', {
      body: {
        session_id: sid,
        user_id: userId,
      },
    });

    if (error) {
      console.error('Failed to restore onboarding session:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to restore onboarding session:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Cache AI generation result
 */
export async function cacheAIGeneration(
  stage: string,
  inputs: any,
  model?: string
): Promise<{ cached: boolean; generation: any; error?: string }> {
  try {
    const sessionId = getSessionId();
    
    const { data, error } = await supabase.functions.invoke('save-generation', {
      body: {
        stage,
        inputs,
        model: model || 'google/gemini-2.5-flash',
        session_id: sessionId,
      },
    });

    if (error) {
      console.error('Failed to cache AI generation:', error);
      return { cached: false, generation: null, error: error.message };
    }

    return {
      cached: data.cached || false,
      generation: data.generation,
    };
  } catch (error) {
    console.error('Failed to cache AI generation:', error);
    return { cached: false, generation: null, error: String(error) };
  }
}

/**
 * Select a generation as primary
 */
export async function selectGeneration(
  generationId: string,
  itemId?: string,
  businessId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionId = getSessionId();
    
    const { data, error } = await supabase.functions.invoke('select-generation', {
      body: {
        generation_id: generationId,
        item_id: itemId,
        session_id: sessionId,
        business_id: businessId,
      },
    });

    if (error) {
      console.error('Failed to select generation:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to select generation:', error);
    return { success: false, error: String(error) };
  }
}
