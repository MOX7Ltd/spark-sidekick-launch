import { supabase } from '@/integrations/supabase/client';
import { getSessionId, saveFormState, getFormState, OnboardingFormState } from './telemetry';
import { saveOnboardingSession as syncSession } from './onboardingSync';

export interface OnboardingSessionData {
  formData: any;
  context: any;
  generatedPosts?: any[];
}

/**
 * @deprecated Use getSessionId from telemetry.ts instead
 */
export function getOnboardingSessionId(): string | null {
  return getSessionId();
}

/**
 * @deprecated Use saveFormState from telemetry.ts instead
 */
export function setOnboardingSessionId(sessionId: string): void {
  localStorage.setItem('sidehive_session_id', sessionId);
}

/**
 * @deprecated Use clearOnboardingState from telemetry.ts instead
 */
export function clearOnboardingSession(): void {
  localStorage.removeItem('sidehive_session_id');
  localStorage.removeItem('sidehive_form_state');
}

/**
 * Save onboarding session data to Supabase
 * @deprecated Use saveOnboardingSession from onboardingSync.ts instead
 */
export async function saveOnboardingSession(
  data: OnboardingSessionData,
  userHintEmail?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionId = getSessionId();
    
    // Use new sync function
    return await syncSession(
      data.formData as OnboardingFormState,
      'legacy',
      data.context,
      undefined
    );
  } catch (error) {
    console.error('Failed to save onboarding session:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Fetch onboarding session data from Supabase
 */
export async function fetchOnboardingSession(
  sessionId: string
): Promise<OnboardingSessionData | null> {
  try {
    const { data, error } = await supabase
      .from('onboarding_sessions')
      .select('payload')
      .eq('session_id', sessionId)
      .is('migrated_at', null)
      .single();

    if (error) {
      console.error('Failed to fetch onboarding session:', error);
      return null;
    }

    return data?.payload as unknown as OnboardingSessionData;
  } catch (error) {
    console.error('Failed to fetch onboarding session:', error);
    return null;
  }
}
