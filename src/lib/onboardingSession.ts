import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from './telemetry';

export interface OnboardingSessionData {
  formData: any;
  context: any;
  generatedPosts?: any[];
}

const SESSION_KEY = 'onboarding_session_id';

/**
 * Get the current onboarding session ID from localStorage
 */
export function getOnboardingSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

/**
 * Set the onboarding session ID in localStorage
 */
export function setOnboardingSessionId(sessionId: string): void {
  localStorage.setItem(SESSION_KEY, sessionId);
}

/**
 * Clear the onboarding session ID from localStorage
 */
export function clearOnboardingSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Save onboarding session data to Supabase
 */
export async function saveOnboardingSession(
  data: OnboardingSessionData,
  userHintEmail?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionId = getSessionId();
    
    const { error } = await supabase
      .from('onboarding_sessions')
      .insert({
        session_id: sessionId,
        payload: data as any,
        user_hint_email: userHintEmail,
      });

    if (error) {
      console.error('Failed to save onboarding session:', error);
      return { success: false, error: error.message };
    }

    setOnboardingSessionId(sessionId);
    return { success: true };
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
